import { useWebMCP } from "@mcp-b/react-webmcp";
import { useCircuitStore } from "../store/circuitStore";
import { simulate } from "../logic/simulator";
import { generateTruthTable } from "../logic/simulator";
import { validateAgainstKnownFunction, type KnownFunction } from "../logic/validators";
import { EXAMPLES, getExample } from "../examples";
import type { Bit, GateType } from "../logic/types";

const GATE_TYPES: GateType[] = ["INPUT", "OUTPUT", "AND", "OR", "NOT", "XOR", "NAND", "NOR"];
const KNOWN_FUNCTIONS: KnownFunction[] = ["AND", "OR", "NOT", "XOR", "NAND", "NOR", "HALF_ADDER", "FULL_ADDER"];

function labelsOf(store: ReturnType<typeof useCircuitStore.getState>) {
  const labels: Record<string, string> = {};
  for (const c of store.circuit.components) labels[c.id] = c.label ?? c.id;
  return labels;
}

/**
 * Registers every WebMCP tool LogicLab exposes to an agent. Mounted once near the
 * root of the app so tool availability doesn't depend on which panel is on screen.
 * Every tool reads/writes the same zustand store the canvas renders from, so an
 * agent action and a mouse action are indistinguishable to the rest of the app —
 * that shared state is the whole point of the human+agent demo.
 */
export function WebMCPTools() {
  useWebMCP({
    name: "get_circuit_state",
    description:
      "Read the full current circuit: every component (gates, inputs, outputs) with its id, type, position, label and value, every wire, and the live simulated signal on every component and wire. Call this first, before making any change, to see what's already on the canvas.",
    inputSchema: { type: "object", properties: {} } as const,
    annotations: { readOnlyHint: true },
    execute: async () => {
      const state = useCircuitStore.getState();
      const sim = simulate(state.circuit);
      return {
        components: state.circuit.components,
        wires: state.circuit.wires,
        values: sim.values,
        wireValues: sim.wireValues,
        issues: sim.issues,
        exampleName: state.exampleName,
      };
    },
  });

  useWebMCP({
    name: "list_examples",
    description: "List the built-in example circuits (id, name, description) available to load_example.",
    inputSchema: { type: "object", properties: {} } as const,
    annotations: { readOnlyHint: true },
    execute: async () => EXAMPLES.map(({ id, name, description }) => ({ id, name, description })),
  });

  useWebMCP({
    name: "load_example",
    description: "Replace the current circuit on the canvas with one of the built-in examples. Use list_examples to see valid ids.",
    inputSchema: {
      type: "object",
      properties: { exampleId: { type: "string", description: "Example id, e.g. 'half-adder'." } },
      required: ["exampleId"],
    } as const,
    execute: async ({ exampleId }: { exampleId: string }) => {
      const example = getExample(exampleId);
      if (!example) {
        return {
          ok: false,
          error: `Unknown example id "${exampleId}". Valid ids: ${EXAMPLES.map((e) => e.id).join(", ")}.`,
        };
      }
      const circuit = example.build();
      useCircuitStore.getState().loadCircuit(circuit, example.name);
      useCircuitStore.getState().markAiTouched(
        circuit.components.map((c) => c.id),
        circuit.wires.map((w) => w.id),
      );
      return { ok: true, name: example.name, componentCount: circuit.components.length };
    },
  });

  useWebMCP({
    name: "add_component",
    description:
      "Place a new component on the canvas: an INPUT (a toggleable source bit), an OUTPUT (a display terminal), or a gate (AND, OR, NOT, XOR, NAND, NOR). Returns the new component's id, which you'll use with connect_components.",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: GATE_TYPES, description: "Component type to place." },
        x: { type: "number", description: "Canvas x position in pixels." },
        y: { type: "number", description: "Canvas y position in pixels." },
        label: { type: "string", description: "Optional human-readable label, e.g. 'A' or 'Sum'." },
      },
      required: ["type", "x", "y"],
    } as const,
    execute: async ({ type, x, y, label }: { type: GateType; x: number; y: number; label?: string }) => {
      // The declared JSON-Schema `enum` documents valid values but isn't enforced by the
      // caller — re-check here so a hallucinated/mistyped type gets a clean, actionable
      // error instead of ever reaching the store (simulate() also defends against this
      // independently, but the tool boundary is where a useful message belongs).
      if (!GATE_TYPES.includes(type)) {
        return { ok: false, error: `Unknown type "${type}". Valid types: ${GATE_TYPES.join(", ")}.` };
      }
      if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) {
        return { ok: false, error: "x and y must be finite numbers." };
      }
      const id = useCircuitStore.getState().addComponent(type, { x, y }, label);
      useCircuitStore.getState().markAiTouched([id], []);
      return { ok: true, id };
    },
  });

  useWebMCP({
    name: "update_component",
    description:
      "Update an existing component: reposition it (x/y), rename it (label), or — for INPUT components only — set its value (inputValue: 0 or 1).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        x: { type: "number" },
        y: { type: "number" },
        label: { type: "string" },
        inputValue: { type: "integer", enum: [0, 1] },
      },
      required: ["id"],
    } as const,
    execute: async (input: { id: string; x?: number; y?: number; label?: string; inputValue?: Bit }) => {
      const { id, x, y, label, inputValue } = input;
      if (inputValue !== undefined && inputValue !== 0 && inputValue !== 1) {
        return { ok: false, error: `inputValue must be 0 or 1, got ${inputValue}.` };
      }
      const patch: { position?: { x: number; y: number }; label?: string; inputValue?: Bit } = {};
      if (x !== undefined && y !== undefined) patch.position = { x, y };
      if (label !== undefined) patch.label = label;
      if (inputValue !== undefined) patch.inputValue = inputValue;
      const result = useCircuitStore.getState().updateComponent(id, patch);
      if (result.ok) useCircuitStore.getState().markAiTouched([id], []);
      return result;
    },
  });

  useWebMCP({
    name: "remove_component",
    description: "Delete a component from the canvas. Any wires attached to it are removed too.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } as const,
    execute: async ({ id }: { id: string }) => useCircuitStore.getState().removeComponent(id),
  });

  useWebMCP({
    name: "connect_components",
    description:
      "Connect the output of one component to an input port of another. Gates with two inputs (AND/OR/XOR/NAND/NOR) use toPort 0 or 1; NOT and OUTPUT have a single input port, toPort 0. An input port can only carry one wire — disconnect_components first if it's already driven.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Id of the component driving the wire (its output)." },
        to: { type: "string", description: "Id of the component receiving the wire." },
        toPort: { type: "integer", minimum: 0, maximum: 1, description: "Input port index on `to`." },
      },
      required: ["from", "to", "toPort"],
    } as const,
    execute: async ({ from, to, toPort }: { from: string; to: string; toPort: number }) => {
      const result = useCircuitStore.getState().connect(from, to, toPort);
      if (result.ok && result.wireId) useCircuitStore.getState().markAiTouched([], [result.wireId]);
      return result;
    },
  });

  useWebMCP({
    name: "disconnect_components",
    description: "Delete a single wire by id (from get_circuit_state's wires list).",
    inputSchema: { type: "object", properties: { wireId: { type: "string" } }, required: ["wireId"] } as const,
    execute: async ({ wireId }: { wireId: string }) => useCircuitStore.getState().disconnect(wireId),
  });

  useWebMCP({
    name: "set_input",
    description: "Set an INPUT component to 0 (LOW) or 1 (HIGH).",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, value: { type: "integer", enum: [0, 1] } },
      required: ["id", "value"],
    } as const,
    execute: async ({ id, value }: { id: string; value: Bit }) => {
      if (value !== 0 && value !== 1) {
        return { ok: false, error: `value must be 0 or 1, got ${value}.` };
      }
      return useCircuitStore.getState().setInput(id, value);
    },
  });

  useWebMCP({
    name: "simulate",
    description:
      "Recompute every signal in the circuit from the current INPUT values and return the resulting value on each component and wire, plus any wiring issues found (feedback loops, floating inputs, doubled drivers). Call after making changes to see the effect.",
    inputSchema: { type: "object", properties: {} } as const,
    annotations: { readOnlyHint: true },
    execute: async () => {
      const state = useCircuitStore.getState();
      const sim = simulate(state.circuit);
      return { values: sim.values, wireValues: sim.wireValues, issues: sim.issues, labels: labelsOf(state) };
    },
  });

  useWebMCP({
    name: "generate_truth_table",
    description:
      "Exercise every combination of the circuit's INPUT components (2^n rows) and report the resulting OUTPUT values for each — the deterministic way to see everything a circuit does at once, instead of toggling inputs one at a time.",
    inputSchema: { type: "object", properties: {} } as const,
    annotations: { readOnlyHint: true },
    execute: async () => {
      const state = useCircuitStore.getState();
      const table = generateTruthTable(state.circuit);
      return { ...table, labels: labelsOf(state) };
    },
  });

  useWebMCP({
    name: "validate_circuit",
    description:
      "Check whether the circuit correctly implements a named function (AND, OR, NOT, XOR, NAND, NOR, HALF_ADDER, FULL_ADDER) across every input combination. The comparison is exact, code-computed truth-table matching — not a guess — and returns the specific input rows where the circuit's behavior diverges from the expected function, so you can pinpoint what's wrong.",
    inputSchema: {
      type: "object",
      properties: { targetFunction: { type: "string", enum: KNOWN_FUNCTIONS } },
      required: ["targetFunction"],
    } as const,
    annotations: { readOnlyHint: true },
    execute: async ({ targetFunction }: { targetFunction: KnownFunction }) =>
      validateAgainstKnownFunction(useCircuitStore.getState().circuit, targetFunction),
  });

  useWebMCP({
    name: "highlight_component",
    description:
      "Draw the student's eye to specific components and/or wires with a reason string (e.g. 'this AND gate should be an OR gate'). Used while diagnosing a broken circuit. Call clear_highlights when done.",
    inputSchema: {
      type: "object",
      properties: {
        componentIds: { type: "array", items: { type: "string" } },
        wireIds: { type: "array", items: { type: "string" } },
        reason: { type: "string" },
      },
      required: ["reason"],
    } as const,
    execute: async ({
      componentIds = [],
      wireIds = [],
      reason,
    }: {
      componentIds?: string[];
      wireIds?: string[];
      reason: string;
    }) => {
      useCircuitStore.getState().highlight(componentIds, wireIds, reason);
      return { ok: true };
    },
  });

  useWebMCP({
    name: "clear_highlights",
    description: "Remove every debugging highlight currently shown on the canvas.",
    inputSchema: { type: "object", properties: {} } as const,
    execute: async () => {
      useCircuitStore.getState().clearHighlights();
      return { ok: true };
    },
  });

  useWebMCP({
    name: "reset_circuit",
    description: "Remove every component and wire, returning to a blank canvas.",
    inputSchema: { type: "object", properties: {} } as const,
    execute: async () => {
      useCircuitStore.getState().clearCircuit();
      return { ok: true };
    },
  });

  return null;
}
