# LogicLab — Project Description

## Problem

Introductory digital-design students (the CMPEN 270 / intro-logic-design audience) spend a disproportionate amount of time on mechanics that have nothing to do with learning Boolean logic: dragging gates precisely, remembering which port is which, toggling every input combination by hand, and — worst of all — staring at a wrong output with no fast path to *why*. Existing browser circuit simulators (Logisim-web ports, CircuitJS/Falstad-derived tools) are capable but entirely manual: there is no way to ask them anything. Bolting a chatbot next to one doesn't help, because the chatbot can only describe the circuit back to you in words — it can't reach in and fix a wire.

## Solution

LogicLab is a circuit editor where the circuit itself is addressable by an AI agent through WebMCP, not just visible to one. The same `zustand` store that the React Flow canvas renders from is the store every WebMCP tool reads and writes. Concretely: `add_component`, `connect_components`, `set_input`, `remove_component`, `disconnect_components`, `update_component`, `reset_circuit` let an agent build and edit; `get_circuit_state`, `simulate`, `generate_truth_table` let it read exact structured state instead of inferring it from a screenshot; `validate_circuit` runs a circuit against a hand-written deterministic reference implementation of a target function (AND, OR, NOT, XOR, NAND, NOR, HALF_ADDER, FULL_ADDER) and returns the exact input rows where it diverges; `highlight_component`/`clear_highlights` let it point at a specific gate or wire while explaining a problem, visible to the human in real time.

The result: a student can say "build a full adder" and watch it appear, gate by gate, with each new piece briefly pulsing violet so they can see what the agent just did. They can wire something incorrectly themselves and ask "why isn't this working," and the agent inspects the actual circuit, runs the actual truth table, and highlights the actual faulty gate — not a plausible-sounding guess.

## Why human + agent beats either alone

A human-only editor requires the student to already know what's wrong before they can fix it — which is exactly the skill they're still building. An agent-only / chat-only tool can explain digital logic in the abstract but never touches the artifact the student is graded on. LogicLab keeps the human in the driver's seat of their own circuit (drag, wire, toggle, inspect — everything works with the mouse and no AI involved) while giving the agent the same hands on the same circuit, so the two can genuinely collaborate: the student directs, the agent executes structural changes and precise verification, and both watch the same canvas update.

## Technical implementation

- **Deterministic core** (`src/logic/`): a topologically-sorted combinational-circuit simulator with cycle/floating-input/multiple-driver detection, a truth-table generator, and a known-function validator — plain TypeScript, unit-tested (52+ vitest cases), with zero dependency on the UI or on any LLM. Digital logic correctness is never delegated to a language model.
- **Single source of truth** (`src/store/`): a zustand store holding the circuit; every mutation (mouse-driven or agent-driven) goes through the same action functions, so the human and the agent are structurally incapable of diverging.
- **WebMCP layer** (`src/webmcp/tools.tsx`): 15 tools registered via `@mcp-b/react-webmcp`'s `useWebMCP` hook against `document.modelContext`, implementing the [W3C WebMCP draft](https://webmachinelearning.github.io/webmcp/). Every tool has a structured JSON-Schema input, a structured return value, and fails with a specific error string rather than throwing — an agent gets an actionable message ("Input 1 of `and_gate` is already driven by wire `wire_ab12cd`") instead of a stack trace.
- **Canvas** (`src/canvas/`): React Flow (`@xyflow/react`) with custom SVG gate-symbol nodes and a custom animated wire edge, so HIGH signals visibly flow and an agent's edits get a distinct, temporary highlight separate from the HIGH-signal color.
- **No backend.** The whole app is a static bundle; WebMCP tool calls happen entirely client-side against in-memory state.

## Challenges

- **Ambiguity in port mapping for validation.** `validate_circuit` needs to know which INPUT component is "A" and which is "B" (order matters for e.g. a half adder's Sum/Carry). Solved by matching on component `label` first (case-insensitive), falling back to declaration order only when labels don't cover every port — verified with dedicated tests for both paths.
- **Distinguishing "the AI did this" from "this is HIGH."** Both needed persistent-feeling visual state on the same nodes/wires. Solved with two deliberately distinct accent colors (violet pulse vs. cyan/green signal) rather than overloading one.
- **Keeping the simulator honest under bad wiring.** Early versions were tempted to just default a cyclic circuit's outputs to 0 silently. Instead, `simulate()` returns a structured `issues[]` array (cycle / floating-input / multiple-drivers) that both the UI and the agent can act on, so "why is this wrong" always has a real answer instead of a silent wrong number.

## What we learned

Building the agent tools *after* the deterministic core (not before) made the whole system more trustworthy: because `simulate`/`generateTruthTable`/`validateAgainstKnownFunction` were fully tested before a single WebMCP tool existed, every tool is a thin, low-risk wrapper around already-correct logic rather than a place where bugs could hide. WebMCP's value became obvious once the tools were real: the difference between "an agent that can talk about your circuit" and "an agent that can fix your circuit" is not a matter of a smarter model — it's a matter of the model having hands.

## Future direction

Sequential logic (flip-flops, counters, a clock signal) is the natural next step, along with Karnaugh-map assistance for minimization, shareable circuit links, and a guided "challenge mode" where the agent grades a student's attempt against a hidden spec using the same `validate_circuit` machinery already built.
