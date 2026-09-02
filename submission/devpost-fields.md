# Devpost Submission — Copy-Paste-Ready Fields

Challenge: **The WebMCP Challenge** (webmcp.devpost.com, hackathon id 31011)
Deadline: **September 3, 2026, 4:00 PM EDT / 1:00 PM PDT**
[USER MUST FILL] You are not logged into Devpost in the browsers this session could check — log in yourself and paste the fields below into the submission form at https://webmcp.devpost.com (click **Join hackathon**, then **My projects** → start/edit your submission).

The challenge's own rules require your text description to explicitly cover four things (quoted from the official requirements page). Devpost's submission form uses its standard section layout (Elevator pitch, About/Inspiration, What it does, How built, Challenges, Accomplishments, What we learned, What's next, Built With, links) — the content below is written to satisfy the four required points *within* that layout, and each Devpost-standard section is labeled so you can paste directly regardless of the exact labels your form shows.

---

## Project Name

```
LogicLab
```

## Tagline / Elevator Pitch

```
A digital logic workspace where you and your AI agent build, test, debug, and understand the same live circuit — through WebMCP.
```

## Links

```
Live demo: https://reddynitish.github.io/logiclab/
GitHub:    https://github.com/reddynitish/logiclab
```

## Built With (tags)

```
typescript, react, vite, webmcp, model-context-protocol, zustand, react-flow, xyflow, vitest, github-pages, github-actions
```

---

## Inspiration / About

```
Circuit simulators for intro digital-design courses (Logisim-web ports, CircuitJS-derived tools) are entirely manual — there's no way to ask them anything. Bolting a chatbot next to one doesn't fix that: the chatbot can describe your circuit in words, but it can't reach in and fix a wire. WebMCP changes the shape of that problem — instead of a chatbot guessing through screenshots and pixel coordinates, a website can expose exactly the structured actions an agent needs. We wanted to build the smallest thing that makes that difference undeniable: a real editing tool where a human and an agent operate on the literal same piece of state, live, side by side.
```

## What it does

```
LogicLab is a digital-logic circuit editor. A student drags gates onto a canvas, wires them, toggles inputs, and watches signals propagate — fully usable with no AI at all. The same circuit is also addressable by any WebMCP-capable agent through 15 structured tools (add_component, connect_components, set_input, simulate, generate_truth_table, validate_circuit, highlight_component, and more), all operating on the exact zustand store the canvas renders from. Ask an agent to "build and test a half adder" and it appears on screen, gate by gate, with a violet pulse marking each thing it just touched. Wire something wrong yourself and ask "why isn't this working?" — the agent inspects the real circuit, runs the real truth table, and highlights the real faulty gate with a plain-English reason, then can repair it and re-verify. A visible "WebMCP: Ready · 15 tools" badge with a live tool-call activity feed proves, in real time, that changes are coming through WebMCP rather than simulated clicking.

Why it's a strong fit for WebMCP: digital logic is exactly the kind of domain where an agent needs precise structured state (component types, ports, wire endpoints, signal values) rather than a screenshot — a single misread pixel is a wrong wire. WebMCP is what lets the agent read and write that structure directly.

How it creates a better user experience: the student never has to translate between "what the agent said" and "what's actually on my screen" — there's only one circuit, and both parties see every edit the instant it happens, including edits made by the other party mid-task.

What people and agents can do together that was difficult or impossible before: precise, verifiable collaborative editing of a structured artifact — build together, debug together, and get an agent's fix that is provably correct (validate_circuit re-checks against a deterministic reference implementation, never an LLM's guess at Boolean algebra) instead of an answer that merely sounds right.
```

## How we built it

```
Client-only TypeScript/React app, no backend. The circuit is deterministic, tested logic (src/logic/): a topologically-sorted simulator with cycle/floating-input/multiple-driver detection, a truth-table generator, and a known-function validator (AND..NOR, half/full adder, 2:1 mux, 2-to-4 decoder) — 90+ Vitest cases, zero reliance on any LLM for correctness. A single zustand store (src/store/) is the one source of truth both the React Flow canvas (src/canvas/) and every WebMCP tool (src/webmcp/tools.tsx) read and write, via document.modelContext.registerTool() per the W3C WebMCP draft (using @mcp-b/react-webmcp's useWebMCP hook and @mcp-b/global's polyfill for browsers without native support yet). Every tool call is logged to a small in-app activity feed so a human can watch WebMCP calls happen in real time. Deployed as a static build to GitHub Pages via GitHub Actions on every push; WebMCP's SecureContext requirement is satisfied by GitHub Pages' default HTTPS.
```

## Challenges we ran into

```
Proving WebMCP actually worked end to end, not just "the tools render." Calling document.modelContext.getTools()/executeTool() from inside the same page is trivially self-consistent, so we went further: bridged the app's registered tools through @mcp-b/webmcp-local-relay (a third-party WebMCP-to-stdio-MCP bridge) and drove them with a completely independent @modelcontextprotocol/sdk client process — a real external MCP client discovering and calling LogicLab's tools with zero shared code — and confirmed the resulting circuit change on screen. Separately, an adversarial pass found that a WebMCP tool's declared JSON-Schema `enum` isn't actually enforced by the runtime — a caller-supplied type outside the valid set reached the simulator unguarded and threw inside a render path with no ErrorBoundary, which would have white-screened the app on a single bad agent call. Fixed by validating at the tool boundary and making the simulator itself degrade unknown input to a reported issue instead of throwing, plus an ErrorBoundary as defense in depth.
```

## Accomplishments that we're proud of

```
A genuinely deterministic core: digital-logic correctness is proven by 90+ unit tests and never delegated to an LLM, so every WebMCP tool is a thin, low-risk wrapper around already-correct logic. A debug flow that's real, not scripted: the agent diagnoses a broken circuit by actually running its truth table against a known function and reports the exact failing input rows, then highlights the exact faulty component. Live, on-screen proof that WebMCP — not mouse automation — is doing the work, via a status badge and real-time tool-call feed anyone can watch during a demo.
```

## What we learned

```
Building the deterministic simulator and its tests before writing a single WebMCP tool paid off directly: every tool became a thin, already-tested wrapper instead of a place where logic bugs could hide. We also learned that "the API is implemented correctly" and "an agent can discover and use it" are different claims that need different proof — self-invocation from the page's own JS console isn't enough; independent verification (an unrelated MCP client, over a real protocol, through a third-party relay) is what actually closes the loop.
```

## What's next

```
Sequential logic (flip-flops, counters, a clock signal), Karnaugh-map assistance for minimization, shareable circuit links, and a guided "challenge mode" where an agent grades a student's circuit against a hidden spec using the same validate_circuit machinery already built.
```

---

## Additional / WebMCP-specific notes field (if the form has one)

```
Repository contains document.modelContext.registerTool() calls per the WebMCP spec — see src/webmcp/tools.tsx (15 tools) and src/main.tsx (@mcp-b/global polyfill import). Test locally: open the live app in ChatGPT's in-app browser, or Chrome with chrome://flags/#enable-webmcp-testing enabled, and ask "Build and test a half adder" — or run `(await document.modelContext.getTools()).length` in the console (expect 15). No authentication/credentials are required to use the app.
```

## Category / Track

```
[USER MUST FILL] — select whichever track(s) the submission form offers if the challenge has sub-tracks; none were listed as required on the public rules page at time of writing (single open challenge, no sub-category selection mentioned).
```

## Team / eligibility fields

```
[USER MUST FILL] — team members, country of residence / eligibility confirmation, and any legal certification checkboxes are yours to complete; only you can attest to these.
```

## Demo video URL

```
[USER MUST FILL] — record and upload per submission/demo-script.md, publish publicly on YouTube (<3 minutes, with audio), then paste the URL here.
```
