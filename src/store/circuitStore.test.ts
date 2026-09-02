import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCircuitStore } from "./circuitStore";
import { getExample } from "../examples";

function reset() {
  useCircuitStore.setState({
    circuit: { components: [], wires: [] },
    selectedId: null,
    exampleName: null,
    past: [],
    future: [],
  });
}

beforeEach(() => {
  reset();
});

// This suite exercises the exact store actions that src/webmcp/tools.tsx wraps —
// every WebMCP tool is a thin pass-through to one of these, so correctness here is
// correctness for the agent-facing surface too. `document.modelContext` isn't present
// in jsdom, so the hook layer itself isn't exercised, but its entire behavior lives here.
describe("circuitStore: structural mutation", () => {
  it("adds a component and returns a usable id", () => {
    const id = useCircuitStore.getState().addComponent("AND", { x: 10, y: 20 });
    const comp = useCircuitStore.getState().circuit.components.find((c) => c.id === id);
    expect(comp).toBeDefined();
    expect(comp?.type).toBe("AND");
    expect(comp?.position).toEqual({ x: 10, y: 20 });
  });

  it("removeComponent fails gracefully on unknown id", () => {
    const result = useCircuitStore.getState().removeComponent("does-not-exist");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no component/i);
  });

  it("removeComponent also removes attached wires", () => {
    const { addComponent, connect, removeComponent } = useCircuitStore.getState();
    const a = addComponent("INPUT", { x: 0, y: 0 });
    const g = addComponent("NOT", { x: 100, y: 0 });
    const conn = connect(a, g, 0);
    expect(conn.ok).toBe(true);
    removeComponent(a);
    expect(useCircuitStore.getState().circuit.wires).toHaveLength(0);
  });

  it("connect rejects a missing/non-numeric toPort instead of silently creating a dead wire", () => {
    // Regression: `undefined < 0` and `undefined >= maxPort` are both false, so a caller
    // (e.g. a malformed WebMCP call missing toPort — the polyfill's testing shim invokes
    // execute() with raw, unvalidated JSON, see webmcp/tools.tsx) used to slip past the
    // range check and create a wire with toPort: undefined that never carries a signal.
    const { addComponent, connect } = useCircuitStore.getState();
    const a = addComponent("INPUT", { x: 0, y: 0 });
    const g = addComponent("AND", { x: 100, y: 0 });
    const result = connect(a, g, undefined as unknown as number);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/toPort must be an integer/);
    expect(useCircuitStore.getState().circuit.wires).toHaveLength(0);
  });

  it("connect rejects an out-of-range port", () => {
    const { addComponent, connect } = useCircuitStore.getState();
    const a = addComponent("INPUT", { x: 0, y: 0 });
    const g = addComponent("NOT", { x: 100, y: 0 });
    const result = connect(a, g, 5);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/only has input ports/);
  });

  it("connect rejects a second wire into an already-driven port", () => {
    const { addComponent, connect } = useCircuitStore.getState();
    const a = addComponent("INPUT", { x: 0, y: 0 });
    const b = addComponent("INPUT", { x: 0, y: 50 });
    const g = addComponent("AND", { x: 100, y: 0 });
    expect(connect(a, g, 0).ok).toBe(true);
    const second = connect(b, g, 0);
    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/already driven/);
  });

  it("connect rejects wiring from a component with no output (OUTPUT)", () => {
    const { addComponent, connect } = useCircuitStore.getState();
    const out = addComponent("OUTPUT", { x: 0, y: 0 });
    const g = addComponent("NOT", { x: 100, y: 0 });
    const result = connect(out, g, 0);
    expect(result.ok).toBe(false);
  });

  it("disconnect removes exactly the targeted wire", () => {
    const { addComponent, connect, disconnect } = useCircuitStore.getState();
    const a = addComponent("INPUT", { x: 0, y: 0 });
    const g = addComponent("NOT", { x: 100, y: 0 });
    const { wireId } = connect(a, g, 0);
    expect(useCircuitStore.getState().circuit.wires).toHaveLength(1);
    disconnect(wireId!);
    expect(useCircuitStore.getState().circuit.wires).toHaveLength(0);
  });

  it("setInput rejects non-INPUT components", () => {
    const id = useCircuitStore.getState().addComponent("AND", { x: 0, y: 0 });
    const result = useCircuitStore.getState().setInput(id, 1);
    expect(result.ok).toBe(false);
  });

  it("updateComponent rejects inputValue on non-INPUT components instead of silently ignoring it", () => {
    const { addComponent, updateComponent } = useCircuitStore.getState();
    const id = addComponent("AND", { x: 0, y: 0 });
    const result = updateComponent(id, { inputValue: 1 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not an INPUT/);
    expect(useCircuitStore.getState().circuit.components.find((c) => c.id === id)?.inputValue).toBeUndefined();
  });

  it("updateComponent still allows inputValue on an INPUT component", () => {
    const { addComponent, updateComponent } = useCircuitStore.getState();
    const id = addComponent("INPUT", { x: 0, y: 0 });
    const result = updateComponent(id, { inputValue: 1 });
    expect(result.ok).toBe(true);
    expect(useCircuitStore.getState().circuit.components.find((c) => c.id === id)?.inputValue).toBe(1);
  });

  it("toggleInput flips 0<->1", () => {
    const { addComponent, toggleInput } = useCircuitStore.getState();
    const id = addComponent("INPUT", { x: 0, y: 0 });
    expect(useCircuitStore.getState().circuit.components[0].inputValue).toBe(0);
    toggleInput(id);
    expect(useCircuitStore.getState().circuit.components[0].inputValue).toBe(1);
    toggleInput(id);
    expect(useCircuitStore.getState().circuit.components[0].inputValue).toBe(0);
  });
});

describe("circuitStore: undo/redo", () => {
  it("undo reverts the last structural change, redo reapplies it", () => {
    const { addComponent, undo, redo } = useCircuitStore.getState();
    addComponent("AND", { x: 0, y: 0 });
    expect(useCircuitStore.getState().circuit.components).toHaveLength(1);
    undo();
    expect(useCircuitStore.getState().circuit.components).toHaveLength(0);
    redo();
    expect(useCircuitStore.getState().circuit.components).toHaveLength(1);
  });

  it("a fresh action after undo clears the redo stack", () => {
    const { addComponent, undo, redo } = useCircuitStore.getState();
    addComponent("AND", { x: 0, y: 0 });
    undo();
    addComponent("OR", { x: 0, y: 0 });
    redo();
    expect(useCircuitStore.getState().circuit.components).toHaveLength(1);
    expect(useCircuitStore.getState().circuit.components[0].type).toBe("OR");
  });
});

describe("circuitStore: structureVersion", () => {
  it("bumps on structural changes (add/connect/setInput/etc)", () => {
    const before = useCircuitStore.getState().structureVersion;
    const id = useCircuitStore.getState().addComponent("INPUT", { x: 0, y: 0 });
    expect(useCircuitStore.getState().structureVersion).toBe(before + 1);
    useCircuitStore.getState().setInput(id, 1);
    expect(useCircuitStore.getState().structureVersion).toBe(before + 2);
  });

  it("does NOT bump on cosmetic-only changes (highlight/clearHighlights/markAiTouched)", () => {
    // Regression: TruthTablePanel used to cache a generated table/validation result keyed
    // by circuit object identity. highlight()/clearHighlights()/markAiTouched() all replace
    // that object too (cosmetic flags live on the same components/wires), which invalidated
    // a still-accurate PASS/FAIL banner the instant an agent called highlight_component —
    // exactly what happens in the headline debug demo. structureVersion must stay put here
    // so a UI keyed off it doesn't throw away a result nothing simulation-relevant changed.
    const id = useCircuitStore.getState().addComponent("AND", { x: 0, y: 0 });
    const before = useCircuitStore.getState().structureVersion;
    useCircuitStore.getState().highlight([id], [], "looks wrong");
    useCircuitStore.getState().clearHighlights();
    useCircuitStore.getState().markAiTouched([id], []);
    useCircuitStore.getState().select(id);
    expect(useCircuitStore.getState().structureVersion).toBe(before);
  });
});

describe("circuitStore: agent presence + highlighting", () => {
  it("markAiTouched sets the flag then clears it after the pulse window", () => {
    vi.useFakeTimers();
    const id = useCircuitStore.getState().addComponent("AND", { x: 0, y: 0 });
    useCircuitStore.getState().markAiTouched([id], []);
    expect(useCircuitStore.getState().circuit.components[0].aiTouched).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(useCircuitStore.getState().circuit.components[0].aiTouched).toBe(false);
    vi.useRealTimers();
  });

  it("highlight sets highlighted + reason; clearHighlights removes both", () => {
    const id = useCircuitStore.getState().addComponent("AND", { x: 0, y: 0 });
    useCircuitStore.getState().highlight([id], [], "this gate looks wrong");
    expect(useCircuitStore.getState().circuit.components[0].highlighted).toBe(true);
    expect(useCircuitStore.getState().circuit.components[0].highlightReason).toBe("this gate looks wrong");
    useCircuitStore.getState().clearHighlights();
    expect(useCircuitStore.getState().circuit.components[0].highlighted).toBe(false);
    expect(useCircuitStore.getState().circuit.components[0].highlightReason).toBeUndefined();
  });
});

describe("circuitStore: examples", () => {
  it("loadCircuit replaces the circuit and records the example name", () => {
    const example = getExample("half-adder")!;
    useCircuitStore.getState().loadCircuit(example.build(), example.name);
    expect(useCircuitStore.getState().circuit.components.length).toBeGreaterThan(0);
    expect(useCircuitStore.getState().exampleName).toBe("Half Adder");
  });

  it("clearCircuit empties the circuit and drops the example name", () => {
    const example = getExample("full-adder")!;
    useCircuitStore.getState().loadCircuit(example.build(), example.name);
    useCircuitStore.getState().clearCircuit();
    expect(useCircuitStore.getState().circuit.components).toHaveLength(0);
    expect(useCircuitStore.getState().circuit.wires).toHaveLength(0);
    expect(useCircuitStore.getState().exampleName).toBeNull();
  });
});
