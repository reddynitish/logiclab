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
