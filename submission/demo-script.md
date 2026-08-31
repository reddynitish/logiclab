# LogicLab — 3-Minute Demo Script

**Setup before recording:** browser open to https://reddynitish.github.io/logiclab/, a WebMCP-aware agent (ChatGPT with WebMCP/site tools, or an MCP client pointed at the page) connected and ready to prompt. Canvas empty or on the landing page.

---

### 0:00–0:15 — The problem, fast
> "Digital logic students spend half their time on wiring mechanics, not logic. A chatbot next to a circuit simulator can talk about your circuit — it can't touch it. LogicLab is a circuit editor where an AI agent has real hands on the same canvas you do, through WebMCP."

Click **Open Lab**. Show the empty canvas, palette, and truth table panel for 3 seconds — this is a real, usable editor with nothing running yet.

### 0:15–0:35 — Prove it's a real manual editor first
Drag an AND gate and two INPUT terminals onto the canvas by hand. Wire them. Toggle both inputs to 1, show the output LED light up. This establishes: *no AI required to be useful.*

Clear the canvas (Reset button).

### 0:35–1:10 — Demo A: Build
Prompt the agent: **"Build a half adder."**

Narrate while it runs: watch gates appear on the canvas one at a time with a violet pulse — that's the agent's `add_component`/`connect_components` calls landing on the exact same store the canvas renders from, live, not a replay. When it finishes, the agent calls `generate_truth_table` and reports all 4 rows correct (00→0,0 / 01→1,0 / 10→1,0 / 11→0,1). Point at the truth table panel updating on screen simultaneously.

### 1:10–1:35 — Demo B: Build something bigger
Prompt: **"Now build a full adder next to it."**

Let it run largely unnarrated — 10 components, 12 wires — then cut to the finished, tested circuit. Mention: "This is still fully yours — drag any gate right now and the agent will see the new position on its next read."

### 1:35–2:20 — Demo C: Debug (the headline moment)
Manually break something: disconnect a wire on the half adder, or swap a gate (e.g. delete the XOR, add an OR in its place, rewire it in). Prompt: **"Why isn't my half adder working?"**

Narrate the agent's process as it happens: it calls `get_circuit_state`, calls `generate_truth_table`, spots the mismatching rows, calls `highlight_component` — show the faulty gate glow amber on screen — and explains the specific error in plain language ("the Sum gate is OR, but Sum should be XOR — OR gives 1 when both inputs are 1, XOR should give 0"). Ask: **"Fix it."** Watch it repair the gate and re-verify with `generate_truth_table`, now passing.

### 2:20–2:45 — Demo D: Validate
Prompt: **"Does this circuit implement XOR?"** on a different, freshly-loaded circuit (e.g. load the AND-gate example). Agent calls `validate_circuit({targetFunction:"XOR"})`, reports **FAIL** with the exact mismatching input rows, computed against a hand-written deterministic reference implementation — not an LLM guess at Boolean algebra.

### 2:45–3:00 — Close
> "Every gate evaluation and every validation in LogicLab is plain, tested TypeScript — the AI never calculates logic, it only acts on a circuit that's always correct. WebMCP is what lets it act at all. That's LogicLab."

Show the landing page one last time with the headline: *Build circuits with your AI.*
