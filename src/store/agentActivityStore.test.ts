import { beforeEach, describe, expect, it } from "vitest";
import { useAgentActivityStore } from "./agentActivityStore";

beforeEach(() => {
  useAgentActivityStore.setState({ status: "checking", toolCount: 0, detail: "", log: [] });
});

describe("agentActivityStore", () => {
  it("starts in checking state with an empty log", () => {
    const s = useAgentActivityStore.getState();
    expect(s.status).toBe("checking");
    expect(s.log).toHaveLength(0);
  });

  it("setStatus records the verified tool count, never assumed", () => {
    useAgentActivityStore.getState().setStatus("ready", 15);
    expect(useAgentActivityStore.getState().status).toBe("ready");
    expect(useAgentActivityStore.getState().toolCount).toBe(15);
  });

  it("setStatus can report unavailable with a reason", () => {
    useAgentActivityStore.getState().setStatus("unavailable", 0, "document.modelContext is not available.");
    const s = useAgentActivityStore.getState();
    expect(s.status).toBe("unavailable");
    expect(s.detail).toMatch(/not available/);
  });

  it("logCall prepends newest-first and caps at 50 entries", () => {
    for (let i = 0; i < 55; i++) {
      useAgentActivityStore.getState().logCall({ tool: `tool_${i}`, argsSummary: "{}", ok: true, resultSummary: "{}" });
    }
    const log = useAgentActivityStore.getState().log;
    expect(log).toHaveLength(50);
    expect(log[0].tool).toBe("tool_54");
  });

  it("clearLog empties the feed", () => {
    useAgentActivityStore.getState().logCall({ tool: "x", argsSummary: "", ok: true, resultSummary: "" });
    useAgentActivityStore.getState().clearLog();
    expect(useAgentActivityStore.getState().log).toHaveLength(0);
  });
});
