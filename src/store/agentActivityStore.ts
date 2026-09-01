import { create } from "zustand";

export type WebMCPStatus = "checking" | "ready" | "unavailable";

export interface AgentLogEntry {
  id: number;
  at: number;
  tool: string;
  argsSummary: string;
  ok: boolean;
  resultSummary: string;
}

const LOG_LIMIT = 50;
let nextId = 1;

interface AgentActivityState {
  status: WebMCPStatus;
  toolCount: number;
  detail: string;
  log: AgentLogEntry[];
  setStatus: (status: WebMCPStatus, toolCount: number, detail?: string) => void;
  logCall: (entry: Omit<AgentLogEntry, "id" | "at">) => void;
  clearLog: () => void;
}

/**
 * Tracks WebMCP's actual runtime status (verified by calling document.modelContext.getTools()
 * after registration, not assumed from "the React component mounted") and a rolling feed of
 * every tool invocation, so a human watching the UI can see — not just trust — that an agent
 * is driving the circuit through WebMCP rather than through synthetic mouse/keyboard events.
 */
export const useAgentActivityStore = create<AgentActivityState>((set) => ({
  status: "checking",
  toolCount: 0,
  detail: "Checking document.modelContext…",
  log: [],

  setStatus: (status, toolCount, detail = "") => set({ status, toolCount, detail }),

  logCall: (entry) =>
    set((s) => ({
      log: [{ id: nextId++, at: Date.now(), ...entry }, ...s.log].slice(0, LOG_LIMIT),
    })),

  clearLog: () => set({ log: [] }),
}));
