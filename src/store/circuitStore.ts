import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Bit, Circuit, CircuitComponent, GateType, Position, Wire } from "../logic/types";
import { GATE_INPUT_COUNT, GATE_HAS_OUTPUT, emptyCircuit } from "../logic/types";
import { simulate, type SimulationResult } from "../logic/simulator";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface HistoryEntry {
  circuit: Circuit;
}

const HISTORY_LIMIT = 50;
const AI_TOUCH_MS = 2200;

export interface CircuitState {
  circuit: Circuit;
  selectedId: string | null;
  exampleName: string | null;
  past: HistoryEntry[];
  future: HistoryEntry[];

  // --- derived ---
  simulation: () => SimulationResult;

  // --- selection ---
  select: (id: string | null) => void;

  // --- structural mutation (all push undo history) ---
  addComponent: (type: GateType, position: Position, label?: string) => string;
  removeComponent: (id: string) => ActionResult;
  updateComponent: (
    id: string,
    patch: Partial<Pick<CircuitComponent, "position" | "inputValue" | "label">>,
  ) => ActionResult;
  connect: (from: string, to: string, toPort: number) => ActionResult & { wireId?: string };
  disconnect: (wireId: string) => ActionResult;
  setInput: (id: string, value: Bit) => ActionResult;
  toggleInput: (id: string) => ActionResult;
  clearCircuit: () => void;
  loadCircuit: (circuit: Circuit, name?: string | null) => void;

  // --- undo/redo ---
  undo: () => void;
  redo: () => void;

  // --- agent-presence feedback ---
  markAiTouched: (componentIds: string[], wireIds: string[]) => void;

  // --- debugging highlights ---
  highlight: (componentIds: string[], wireIds: string[], reason: string) => void;
  clearHighlights: () => void;
}

function pushHistory(state: CircuitState): Pick<CircuitState, "past" | "future"> {
  const past = [...state.past, { circuit: state.circuit }].slice(-HISTORY_LIMIT);
  return { past, future: [] };
}

function cloneCircuit(c: Circuit): Circuit {
  return { components: c.components.map((x) => ({ ...x })), wires: c.wires.map((x) => ({ ...x })) };
}

export const useCircuitStore = create<CircuitState>((set, get) => ({
  circuit: emptyCircuit(),
  selectedId: null,
  exampleName: null,
  past: [],
  future: [],

  simulation: () => simulate(get().circuit),

  select: (id) => set({ selectedId: id }),

  addComponent: (type, position, label) => {
    const id = `${type.toLowerCase()}_${nanoid(6)}`;
    const comp: CircuitComponent = {
      id,
      type,
      position,
      label,
      inputValue: type === "INPUT" ? 0 : undefined,
    };
    set((state) => ({
      ...pushHistory(state),
      circuit: { ...state.circuit, components: [...state.circuit.components, comp] },
    }));
    return id;
  },

  removeComponent: (id) => {
    const state = get();
    if (!state.circuit.components.some((c) => c.id === id)) {
      return { ok: false, error: `No component with id "${id}".` };
    }
    set((s) => ({
      ...pushHistory(s),
      circuit: {
        components: s.circuit.components.filter((c) => c.id !== id),
        wires: s.circuit.wires.filter((w) => w.from !== id && w.to !== id),
      },
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
    return { ok: true };
  },

  updateComponent: (id, patch) => {
    const state = get();
    if (!state.circuit.components.some((c) => c.id === id)) {
      return { ok: false, error: `No component with id "${id}".` };
    }
    set((s) => ({
      ...pushHistory(s),
      circuit: {
        ...s.circuit,
        components: s.circuit.components.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      },
    }));
    return { ok: true };
  },

  connect: (from, to, toPort) => {
    const state = get();
    const fromComp = state.circuit.components.find((c) => c.id === from);
    const toComp = state.circuit.components.find((c) => c.id === to);
    if (!fromComp) return { ok: false, error: `No component with id "${from}".` };
    if (!toComp) return { ok: false, error: `No component with id "${to}".` };
    if (!GATE_HAS_OUTPUT[fromComp.type]) {
      return { ok: false, error: `${fromComp.type} "${from}" has no output port to wire from.` };
    }
    const maxPort = GATE_INPUT_COUNT[toComp.type];
    if (toPort < 0 || toPort >= maxPort) {
      return {
        ok: false,
        error: `${toComp.type} "${to}" only has input ports 0..${maxPort - 1}, got ${toPort}.`,
      };
    }
    const existing = state.circuit.wires.find((w) => w.to === to && w.toPort === toPort);
    if (existing) {
      return {
        ok: false,
        error: `Input ${toPort} of "${to}" is already driven by wire "${existing.id}". Disconnect it first.`,
      };
    }
    const wireId = `wire_${nanoid(6)}`;
    const wire: Wire = { id: wireId, from, to, toPort };
    set((s) => ({
      ...pushHistory(s),
      circuit: { ...s.circuit, wires: [...s.circuit.wires, wire] },
    }));
    return { ok: true, wireId };
  },

  disconnect: (wireId) => {
    const state = get();
    if (!state.circuit.wires.some((w) => w.id === wireId)) {
      return { ok: false, error: `No wire with id "${wireId}".` };
    }
    set((s) => ({
      ...pushHistory(s),
      circuit: { ...s.circuit, wires: s.circuit.wires.filter((w) => w.id !== wireId) },
    }));
    return { ok: true };
  },

  setInput: (id, value) => {
    const state = get();
    const comp = state.circuit.components.find((c) => c.id === id);
    if (!comp) return { ok: false, error: `No component with id "${id}".` };
    if (comp.type !== "INPUT") return { ok: false, error: `Component "${id}" is a ${comp.type}, not an INPUT.` };
    set((s) => ({
      ...pushHistory(s),
      circuit: {
        ...s.circuit,
        components: s.circuit.components.map((c) => (c.id === id ? { ...c, inputValue: value } : c)),
      },
    }));
    return { ok: true };
  },

  toggleInput: (id) => {
    const comp = get().circuit.components.find((c) => c.id === id);
    if (!comp) return { ok: false, error: `No component with id "${id}".` };
    if (comp.type !== "INPUT") return { ok: false, error: `Component "${id}" is a ${comp.type}, not an INPUT.` };
    return get().setInput(id, comp.inputValue ? 0 : 1);
  },

  clearCircuit: () => {
    set((s) => ({ ...pushHistory(s), circuit: emptyCircuit(), exampleName: null, selectedId: null }));
  },

  loadCircuit: (circuit, name = null) => {
    set((s) => ({ ...pushHistory(s), circuit: cloneCircuit(circuit), exampleName: name, selectedId: null }));
  },

  undo: () => {
    const state = get();
    const prev = state.past[state.past.length - 1];
    if (!prev) return;
    set({
      circuit: prev.circuit,
      past: state.past.slice(0, -1),
      future: [{ circuit: state.circuit }, ...state.future].slice(0, HISTORY_LIMIT),
    });
  },

  redo: () => {
    const state = get();
    const next = state.future[0];
    if (!next) return;
    set({
      circuit: next.circuit,
      future: state.future.slice(1),
      past: [...state.past, { circuit: state.circuit }].slice(-HISTORY_LIMIT),
    });
  },

  markAiTouched: (componentIds, wireIds) => {
    set((s) => ({
      circuit: {
        components: s.circuit.components.map((c) =>
          componentIds.includes(c.id) ? { ...c, aiTouched: true } : c,
        ),
        wires: s.circuit.wires.map((w) => (wireIds.includes(w.id) ? { ...w, aiTouched: true } : w)),
      },
    }));
    setTimeout(() => {
      set((s) => ({
        circuit: {
          components: s.circuit.components.map((c) =>
            componentIds.includes(c.id) ? { ...c, aiTouched: false } : c,
          ),
          wires: s.circuit.wires.map((w) => (wireIds.includes(w.id) ? { ...w, aiTouched: false } : w)),
        },
      }));
    }, AI_TOUCH_MS);
  },

  highlight: (componentIds, wireIds, reason) => {
    set((s) => ({
      circuit: {
        components: s.circuit.components.map((c) =>
          componentIds.includes(c.id) ? { ...c, highlighted: true, highlightReason: reason } : c,
        ),
        wires: s.circuit.wires.map((w) =>
          wireIds.includes(w.id) ? { ...w, highlighted: true, highlightReason: reason } : w,
        ),
      },
    }));
  },

  clearHighlights: () => {
    set((s) => ({
      circuit: {
        components: s.circuit.components.map((c) => ({
          ...c,
          highlighted: false,
          highlightReason: undefined,
        })),
        wires: s.circuit.wires.map((w) => ({ ...w, highlighted: false, highlightReason: undefined })),
      },
    }));
  },
}));
