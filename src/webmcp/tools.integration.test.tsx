import "@mcp-b/global";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { WebMCPTools } from "./tools";
import { useCircuitStore } from "../store/circuitStore";

// This suite drives LogicLab's WebMCP tools the way a real, independent external MCP
// client does: through `navigator.modelContextTesting.executeTool`, the testing shim
// @mcp-b/global installs on top of the same polyfill a browser extension or native
// implementation would provide. Unlike store/webmcp unit tests, nothing here imports
// tool internals — every call is raw tool-name + JSON string, exactly what an agent
// sends, and the polyfill performs NO schema validation of its own (confirmed by
// reading @mcp-b/webmcp-polyfill's #invokeToolByName: it parses JSON and calls
// execute() directly) — so this is the layer that actually proves malformed input is
// handled by LogicLab's own tools, not by the transport.
//
// executeTool() resolves to a JSON *string* wrapping the full MCP tool-result envelope
// — {content:[{type:"text",text:"<result JSON>"}], structuredContent:<result>,
// isError}. `structuredContent` is already the parsed tool return value (matches what
// `document.modelContext.executeTool` yields in a real browser, verified manually
// against production), so use that directly instead of double-parsing `content[0].text`.
async function callTool(name: string, args: unknown): Promise<any> {
  const testing = (navigator as unknown as { modelContextTesting: { executeTool: (n: string, a: string) => Promise<string | null> } })
    .modelContextTesting;
  const json = await testing.executeTool(name, JSON.stringify(args));
  if (json === null) return undefined;
  const envelope = JSON.parse(json);
  return envelope.structuredContent ?? JSON.parse(envelope.content[0].text);
}

function resetStore() {
  useCircuitStore.setState({
    circuit: { components: [], wires: [] },
    selectedId: null,
    exampleName: null,
    past: [],
    future: [],
  });
}

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  cleanup();
});

describe("WebMCP: real external-consumer invocation", () => {
  it("discovery: every tool is reachable via document.modelContext.getTools() with a real schema", async () => {
    render(<WebMCPTools />);
    const tools = await waitFor(async () => {
      const t = await document.modelContext!.getTools();
      expect(t.length).toBe(15);
      return t;
    });
    const names = tools.map((t) => t.name).sort();
    expect(names).toContain("get_circuit_state");
    expect(names).toContain("validate_circuit");
    expect(names).toContain("connect_components");
    // Every registered tool must carry a real (non-empty) description — that's the
    // whole point of discovery for an agent deciding what to call.
    for (const t of tools) expect(t.description.length).toBeGreaterThan(10);
  });

  it("happy path: add two inputs, an AND gate, wire them, and simulate — end to end through the tool boundary only", async () => {
    render(<WebMCPTools />);
    await waitFor(async () => expect((await document.modelContext!.getTools()).length).toBe(15));

    const a = await callTool("add_component", { type: "INPUT", x: 0, y: 0, label: "A" });
    const b = await callTool("add_component", { type: "INPUT", x: 0, y: 100, label: "B" });
    const g = await callTool("add_component", { type: "AND", x: 200, y: 50 });
    expect(a.ok && b.ok && g.ok).toBe(true);

    expect((await callTool("connect_components", { from: a.id, to: g.id, toPort: 0 })).ok).toBe(true);
    expect((await callTool("connect_components", { from: b.id, to: g.id, toPort: 1 })).ok).toBe(true);
    expect((await callTool("set_input", { id: a.id, value: 1 })).ok).toBe(true);
    expect((await callTool("set_input", { id: b.id, value: 1 })).ok).toBe(true);

    const sim = await callTool("simulate", {});
    expect(sim.values[g.id]).toBe(1);

    const table = await callTool("generate_truth_table", {});
    expect(table.rows).toHaveLength(4);
  });

  it("malformed call: connect_components missing toPort is rejected, not silently corrupted", async () => {
    render(<WebMCPTools />);
    await waitFor(async () => expect((await document.modelContext!.getTools()).length).toBe(15));

    const a = await callTool("add_component", { type: "INPUT", x: 0, y: 0 });
    const g = await callTool("add_component", { type: "AND", x: 100, y: 0 });
    const result = await callTool("connect_components", { from: a.id, to: g.id });
    expect(result.ok).toBe(false);
    const state = await callTool("get_circuit_state", {});
    expect(state.wires).toHaveLength(0);
  });

  it("malformed call: add_component with a hallucinated type degrades to a clean error, not a crash", async () => {
    render(<WebMCPTools />);
    await waitFor(async () => expect((await document.modelContext!.getTools()).length).toBe(15));

    const result = await callTool("add_component", { type: "FLIP_FLOP", x: 0, y: 0 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unknown type/);
  });

  it("malformed call: update_component can't sneak an inputValue onto a gate through the tool boundary", async () => {
    render(<WebMCPTools />);
    await waitFor(async () => expect((await document.modelContext!.getTools()).length).toBe(15));

    const g = await callTool("add_component", { type: "OR", x: 0, y: 0 });
    const result = await callTool("update_component", { id: g.id, inputValue: 1 });
    expect(result.ok).toBe(false);
  });

  it("unknown tool name is rejected by the transport instead of hanging", async () => {
    render(<WebMCPTools />);
    await waitFor(async () => expect((await document.modelContext!.getTools()).length).toBe(15));
    await expect(callTool("delete_universe", {})).rejects.toThrow();
  });
});
