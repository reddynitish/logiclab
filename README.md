# LogicLab

**Build circuits with your AI.**

LogicLab is a digital logic workspace where a student and an AI agent work on the *same live circuit* — the human drags gates and wires on a canvas, the agent manipulates the exact same canvas through [WebMCP](https://webmachinelearning.github.io/webmcp/), and both sides see every change instantly. Built for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/).

**Live app:** https://reddynitish.github.io/logiclab/

```
Ask your agent: "Build and test a half adder."
```

---

## The problem

Wiring a circuit by hand is slow and the failure mode is opaque: a student toggles inputs one at a time, watches an LED that's the wrong color, and has no fast way to find *which* gate or wire is wrong. A chatbot bolted onto a circuit simulator doesn't fix this — it can talk about Boolean algebra, but it can't touch the circuit on your screen.

## The solution

LogicLab exposes the circuit itself as a set of WebMCP tools: `add_component`, `connect_components`, `set_input`, `simulate`, `generate_truth_table`, `validate_circuit`, `highlight_component`, and more. An agent (ChatGPT, or any WebMCP-aware client) doesn't describe changes — it *makes* them, on the same `zustand` store the canvas renders from. Move a gate with your mouse and the agent's next `get_circuit_state` call sees the new position. Have the agent build a full adder and it appears on your screen, gate by gate, wire by wire, with a brief violet pulse marking exactly what it just touched.

That shared, live state — not a chat transcript describing a circuit — is the thing a chatbot-next-to-a-simulator can't do.

## Demo scenarios

- **Build** — "Build a half adder." The agent places an XOR and an AND gate, wires both inputs to both gates, wires Sum and Carry to outputs, then calls `generate_truth_table` to prove all 4 rows are correct.
- **Build more** — "Build a full adder." Same idea, 10 components, 12 wires, tested and left on the canvas for you to keep experimenting with.
- **Debug** — Wire something wrong yourself, then ask "why isn't this working?" The agent reads the circuit, runs the truth table, spots the mismatching rows, calls `highlight_component` to point at the faulty gate with a plain-English reason, and can fix it if you ask.
- **Validate** — "Does my circuit implement XOR?" `validate_circuit` runs all 4 input combinations through a hand-written, deterministic reference implementation of XOR and reports the exact rows that disagree — never an LLM's guess at Boolean algebra.

## How to use LogicLab with an AI agent

Open the [live app](https://reddynitish.github.io/logiclab/) in a **WebMCP-aware client** — today that's ChatGPT's in-app browser (built-in support), or Chrome with `chrome://flags/#enable-webmcp-testing` enabled. Then just ask it normally, in the same window the page is open in:

```
Build and test a half adder.
```

There's nothing to install and no API key — the moment a WebMCP-capable agent looks at the page, `document.modelContext.getTools()` returns LogicLab's 15 tools and it can start calling them. If your current browser/agent doesn't support WebMCP yet, LogicLab still works as a fully manual circuit editor — see [Features](#features) below.

## How to verify WebMCP is active

The lab view has a small badge in the top-right: **● WebMCP: Ready · 15 tools**. It only ever says "Ready" after the page has actually called `document.modelContext.getTools()` and confirmed all 15 came back — never assumed from the app having loaded. Click it to open a live feed of every real tool call as it happens (`Agent → add_component({"type":"AND",...}) · just now`); if you don't see entries appear while an agent is "working" on the circuit, it isn't going through WebMCP.

You can also check it by hand in the browser console on the live page:

```js
(await document.modelContext.getTools()).length // -> 15
```

**Advanced: verify with a real external MCP client (not just page JS).** Run LogicLab in dev mode (`npm run dev`), open it as `http://localhost:5173/?webmcp-relay=1`, and start [`@mcp-b/webmcp-local-relay`](https://docs.mcp-b.ai/packages/webmcp-local-relay/reference) (`npx @mcp-b/webmcp-local-relay`) — a third-party bridge that turns whatever a browser tab registers on `document.modelContext` into a real MCP server over stdio. Point any MCP client (Claude Desktop, Claude Code, or the SDK directly) at it and call `list_tools`/`call_tool` — LogicLab's 15 tools show up alongside the relay's own 3 management tools, fully callable, with every call also appearing in the in-app agent-activity feed. This is the exact mechanism this repo used to independently confirm discovery + invocation end-to-end (a separate MCP SDK process, over stdio, through a third-party relay, into a real browser tab) rather than relying on the page calling its own API.

## Why WebMCP, specifically

Digital logic is deterministic. Every gate evaluation, every truth table, every "does this implement XOR" check in LogicLab is plain TypeScript (`src/logic/`), unit-tested, and never delegated to an LLM. WebMCP is the layer that lets an agent *act* on that deterministic model — read exact structured state, make exact structured edits — instead of reasoning about a textual description of it and hoping the description was complete.

## Features

**Human-first editor**
- Drag gates from the palette onto a canvas; wire them by dragging between ports.
- Toggle inputs, watch signals propagate and light up live.
- Move, relabel, and delete components and wires; undo/redo; zoom/pan.
- One-click truth table generation and validation against a known Boolean function.
- Six built-in examples: AND, XOR, half adder, full adder, 2:1 multiplexer, 2-to-4 decoder.
- Save/load a circuit to `localStorage`.

**Agent-first tools (WebMCP)** — see [`src/webmcp/tools.tsx`](src/webmcp/tools.tsx)

| Tool | Purpose |
|---|---|
| `get_circuit_state` | Read every component, wire, and live signal value. |
| `list_examples` / `load_example` | Discover and load a built-in circuit. |
| `add_component` / `update_component` / `remove_component` | Place, move/relabel/retoggle, or delete a gate/terminal. |
| `connect_components` / `disconnect_components` | Wire or unwire two components. |
| `set_input` | Drive an INPUT high or low. |
| `simulate` | Recompute every signal and report wiring issues (cycles, floating inputs, doubled drivers). |
| `generate_truth_table` | Exercise every input combination at once. |
| `validate_circuit` | Compare against a known function (AND, OR, NOT, XOR, NAND, NOR, HALF_ADDER, FULL_ADDER, MUX_2TO1, DECODER_2TO4) with exact failing rows. |
| `highlight_component` / `clear_highlights` | Point at specific gates/wires while explaining a problem. |
| `reset_circuit` | Clear the canvas. |

Every tool reads and writes the same store the canvas renders from — there is no separate "agent's copy" of the circuit to fall out of sync.

## Architecture

```
src/
  logic/         deterministic circuit model + simulator + validators (unit-tested, zero UI dependency)
  store/         zustand store — single source of truth for both the canvas and the WebMCP tools
  webmcp/        WebMCP tool registration (useWebMCP from @mcp-b/react-webmcp)
  examples/      built-in circuits
  canvas/        React Flow canvas, custom gate nodes, custom animated wire edges
  ui/            palette, inspector, truth table panel, top/status bars, landing page
```

No backend. The entire app — human editor and agent tools alike — runs client-side; `document.modelContext` (installed by the [`@mcp-b/global`](https://github.com/WebMCP-org/npm-packages) WebMCP polyfill on browsers without native support yet) is the only integration point an external agent needs.

### Reused open source

- [`@xyflow/react`](https://reactflow.dev/) (MIT) — canvas, pan/zoom, node/edge rendering.
- [`zustand`](https://github.com/pmndrs/zustand) (MIT) — state store.
- [`@mcp-b/global`](https://github.com/WebMCP-org/npm-packages) / [`@mcp-b/react-webmcp`](https://github.com/WebMCP-org/npm-packages) (MIT) — WebMCP polyfill and React hook bindings implementing the [W3C WebMCP draft](https://webmachinelearning.github.io/webmcp/).
- `nanoid`, `clsx` (MIT) — small utilities.

## Local setup

```bash
npm install
npm run dev       # http://localhost:5173
```

## Testing

```bash
npx vitest run    # 90+ tests: every gate, half/full adder, cycle/floating-input/multiple-driver
                   # detection, truth-table generation, known-function validation, store actions,
                   # built-in example correctness, and the agent-activity feed
npx tsc -b --noEmit
npm run build
```

## Deployment

Static build (`npm run build`) deployed to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`. HTTPS is required for WebMCP (`[SecureContext]`); GitHub Pages provides it by default.

## Hackathon context

Built for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/) (Sept 2026). See [`/submission`](submission/) for the project description, demo script, and judge cheat sheet.

## License

MIT — see [LICENSE](LICENSE).
