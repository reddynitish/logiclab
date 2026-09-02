# LogicLab — Demo Video Script (target: 2:30–2:50)

Devpost requires a public YouTube video, under 3 minutes, with audio, covering what you built and how you used WebMCP. This script is timed to land comfortably under that limit.

**Setup before recording:**
- Live app open: https://reddynitish.github.io/logiclab/
- A WebMCP-capable client ready in the same window — ChatGPT's in-app browser (or the desktop app pointed at the page), or Chrome with `chrome://flags/#enable-webmcp-testing` enabled.
- Screen recorder with system + mic audio armed.
- Rehearse once — the agent's exact wording back to you will vary run to run; the visuals below don't.

---

### 0:00–0:15 — Problem (voice over the landing page)
> "Circuit simulators for digital logic are entirely manual — there's no way to ask them anything. And a chatbot next to one can't actually touch your circuit. LogicLab fixes that: it's a circuit editor where an AI agent has real hands on the same canvas you do, through WebMCP."

Show the landing page for a beat — headline, the 3-step explainer, the "Ask your agent" line.

### 0:15–0:30 — Prove it's a real editor, WebMCP is live
Click **Open Lab**. Point out the **WebMCP: Ready · 15 tools** badge top-right. Click it briefly to show the empty activity feed — "nothing's happened yet, this updates live."

### 0:30–1:10 — Build (through WebMCP only)
Type into your agent, in the same window:
```
Using LogicLab's WebMCP tools, build a half adder and prove it works.
```
Narrate while it runs: gates and wires appear on the canvas with a violet pulse — that's `add_component`/`connect_components` landing on the exact store the canvas renders from, live. Cut to the activity feed drawer open, scrolling as calls come in.

### 1:10–1:35 — Truth table
The agent calls `generate_truth_table`; show the panel filling in — all 4 rows (00→0,0 / 01→1,0 / 10→1,0 / 11→0,1), correct.

### 1:35–2:05 — Break it, then debug (through WebMCP only)
Manually swap a gate or disconnect a wire on the half adder (mouse click — show it's really you, not the agent). Then type:
```
Why isn't my half adder working? Diagnose it and fix it.
```
Show, in order: the agent reading `get_circuit_state`/`validate_circuit`, the faulty gate glowing amber via `highlight_component` with its reason text, then the repair landing (`remove_component`/`add_component`/`connect_components`) and `validate_circuit` running again — narrate that its returned result (visible in the chat reply, and logged in the activity drawer) already says `matches: true`.

### 2:05–2:25 — Validate again, show PASS
Now click the Truth Table panel's **Validate against → HALF_ADDER** dropdown yourself — this is the same check, but instant and human-driven, so the audience sees the **PASS — matches HALF_ADDER** banner appear live on screen, not just described in the agent's chat reply. Point out: exact code-computed truth-table matching, not an LLM's guess, and anyone watching the circuit — human or agent — gets the same answer.

### 2:25–2:45 — Close
> "Every gate evaluation in LogicLab is plain, tested TypeScript — the agent never calculates logic, it only acts on a circuit that's always correct. WebMCP is what lets it act at all, on the exact same canvas you're looking at. That's LogicLab."

Show the landing page one last time: **Build circuits with your AI.**

---

## Exact prompts to type during recording

1. `Using LogicLab's WebMCP tools, build a half adder and prove it works.`
2. *(after manually breaking the circuit)* `Why isn't my half adder working? Diagnose it and fix it.`
3. Optional stretch, if time allows in a longer cut: `Does this circuit implement XOR?` on a circuit that doesn't, to show `validate_circuit`'s FAIL path with exact failing rows.

## After recording

1. Upload to YouTube as **Public** (not Unlisted — Devpost requires a public video).
2. Paste the URL into `submission/devpost-fields.md` → Demo video URL, and into the Devpost submission form.
