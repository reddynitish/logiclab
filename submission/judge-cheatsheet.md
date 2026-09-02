# LogicLab — Judge Cheat Sheet

**Live app:** https://reddynitish.github.io/logiclab/
**Repo:** https://github.com/reddynitish/logiclab

## 30-second version

Open the link. Click **Open Lab**, or **Try Half Adder Demo** to see a working circuit immediately. Connect a WebMCP-aware agent (e.g. ChatGPT with site tools) to the page and type:

```
Build and test a half adder.
```

Watch gates appear on the canvas live, with a short violet pulse marking exactly what the agent just touched. The truth table panel fills in automatically. That's the whole idea: the agent isn't chatting about the circuit, it's editing the same one you can see and touch.

**Note on browsers/agents:** WebMCP requires a client that actually supports it — today that's ChatGPT's in-app browser (built-in support), or Chrome with `chrome://flags/#enable-webmcp-testing` enabled. If you test with a browsing agent that doesn't have WebMCP support yet, it will fall back to clicking around like a human — that's a client capability gap, not a LogicLab bug. The **WebMCP: Ready · 15 tools** badge (top-right of the lab view, click to expand) is real-time, verified proof of what's actually happening: it only says "Ready" after the page has genuinely confirmed all 15 tools via `document.modelContext.getTools()`, and every entry in its activity feed is a real tool call, not a script.

## Things worth trying

1. **"Build a full adder."** — 10 components, 12 wires, built and verified in one go.
2. Manually break a circuit (delete a wire, swap a gate), then ask **"why isn't this working?"** — watch the agent inspect, test, and highlight the exact faulty gate with a plain-English reason.
3. **"Does my circuit implement XOR?"** on a circuit that doesn't — watch it report the exact failing input rows instead of a vague "looks wrong."
4. Move a gate yourself with the mouse while the agent is mid-task — its next read of the circuit sees your change; there's no separate "agent's copy" to go stale.
5. Everything works with no agent at all: drag gates from the palette, wire them, toggle inputs, generate a truth table, load any of the 6 built-in examples (AND, XOR, half adder, full adder, 2:1 mux, 2-to-4 decoder), undo/redo, save/load locally.
6. Open the browser console and run `(await document.modelContext.getTools()).length` — should print `15`. This is the exact discovery call any WebMCP consumer makes; it's the ground truth behind the badge.

## What to look at in the code

- `src/webmcp/tools.tsx` — all 15 WebMCP tools, each with a structured JSON-Schema input and a structured return value.
- `src/logic/simulator.ts` and `src/logic/validators.ts` — the deterministic circuit engine; `src/logic/*.test.ts` — 90+ passing tests. Digital logic is never computed by an LLM here, only acted on.
- `src/store/circuitStore.ts` — the single zustand store both the canvas and every WebMCP tool read/write, which is *why* human and agent edits stay in sync.

## Judging-criteria map

| Criterion | Where to look |
|---|---|
| Usefulness | Real intro-digital-design workflow (build/test/debug/validate), not a toy |
| Originality | Human and agent editing the *same live circuit*, not chat-about-a-circuit |
| Execution | 90+ unit tests on the deterministic core, CI on every push, deployed build |
| Thoughtful WebMCP use | 15 purposeful tools, structured I/O, graceful errors, live UI sync — see `src/webmcp/tools.tsx` |
| Human+agent experience | Try scenario 4 above — move a gate while the agent is working |
