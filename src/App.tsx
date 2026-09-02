import { Suspense, lazy, useEffect, useState } from "react";
import { useCircuitStore } from "./store/circuitStore";
import { WebMCPTools } from "./webmcp/tools";
import { Landing } from "./ui/Landing";
import { TopBar } from "./ui/TopBar";
import { StatusBar } from "./ui/StatusBar";
import { Palette } from "./ui/Palette";
import { Inspector } from "./ui/Inspector";
import { TruthTablePanel } from "./ui/TruthTablePanel";
import "./App.css";

// React Flow (~most of the bundle) is only needed once the lab is actually open, so the
// landing page — what a judge sees first — paints without waiting for it.
const Canvas = lazy(() => import("./canvas/Canvas").then((m) => ({ default: m.Canvas })));

type View = "landing" | "lab";

function App() {
  const [view, setView] = useState<View>("landing");

  // If an agent starts building before the human clicks "Open Lab", jump straight
  // to the lab view the moment the circuit stops being empty — that's the "wow"
  // moment even if a judge forgets to click in first.
  useEffect(
    () =>
      useCircuitStore.subscribe((state) => {
        if (state.circuit.components.length > 0) setView((v) => (v === "landing" ? "lab" : v));
      }),
    [],
  );

  // App-wide undo/redo shortcuts (Delete/Backspace for selection deletion is handled
  // in Canvas, where selection meaning — component vs. wire — is resolved).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) useCircuitStore.getState().redo();
      else useCircuitStore.getState().undo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="app">
      <WebMCPTools />
      {view === "landing" ? (
        <Landing onOpenLab={() => setView("lab")} />
      ) : (
        <div className="app__lab">
          <TopBar onGoHome={() => setView("landing")} />
          <div className="app__body">
            <Palette />
            <Suspense fallback={<div className="app__canvas-loading">Loading canvas…</div>}>
              <Canvas />
            </Suspense>
            <div className="app__right">
              <Inspector />
              <TruthTablePanel />
            </div>
          </div>
          <StatusBar />
          <div className="app__narrow-notice">
            <p>
              LogicLab's circuit editor needs more room than this screen has to work with. Try widening
              your browser window, or open it on a laptop or desktop.
            </p>
            <button type="button" className="app__narrow-notice-back" onClick={() => setView("landing")}>
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
