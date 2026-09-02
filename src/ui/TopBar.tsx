import { useState } from "react";
import { useCircuitStore } from "../store/circuitStore";
import { EXAMPLES } from "../examples";
import type { Circuit } from "../logic/types";
import { LogoMark, IconUndo, IconRedo, IconSave, IconLoad, IconReset } from "./icons";
import { AgentPanel } from "./AgentPanel";
import "./TopBar.css";

const STORAGE_KEY = "logiclab:circuit";

export function TopBar({ onGoHome }: { onGoHome: () => void }) {
  const past = useCircuitStore((s) => s.past);
  const future = useCircuitStore((s) => s.future);
  const [flash, setFlash] = useState<string | null>(null);
  // Bumped on every pick to remount the <select> back to its placeholder afterward — a
  // plain HTML select doesn't fire onChange when you pick the option that's already
  // selected, so without this a student who breaks the loaded example can't reload the
  // same one from the dropdown a second time.
  const [pickKey, setPickKey] = useState(0);

  const say = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2000);
  };

  const onExamplePick = (id: string) => {
    if (!id) return;
    const example = EXAMPLES.find((e) => e.id === id);
    if (!example) return;
    useCircuitStore.getState().loadCircuit(example.build(), example.name);
    setPickKey((k) => k + 1);
  };

  const onSave = () => {
    const circuit = useCircuitStore.getState().circuit;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(circuit));
    say("Saved");
  };

  const onLoad = () => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      say("No saved circuit found");
      return;
    }
    try {
      const circuit = JSON.parse(raw) as Circuit;
      useCircuitStore.getState().loadCircuit(circuit);
      say("Loaded");
    } catch {
      say("Saved circuit is corrupted");
    }
  };

  return (
    <header className="topbar">
      <button type="button" className="topbar__brand" onClick={onGoHome} aria-label="LogicLab home">
        <LogoMark />
        <span>LogicLab</span>
      </button>

      <label className="topbar__examples">
        <span>Example</span>
        <select key={pickKey} defaultValue="" onChange={(e) => onExamplePick(e.target.value)}>
          <option value="">Load example…</option>
          {EXAMPLES.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </label>

      <div className="topbar__group">
        <button
          type="button"
          className="topbar__btn"
          onClick={() => useCircuitStore.getState().undo()}
          disabled={past.length === 0}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          <IconUndo />
        </button>
        <button
          type="button"
          className="topbar__btn"
          onClick={() => useCircuitStore.getState().redo()}
          disabled={future.length === 0}
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
        >
          <IconRedo />
        </button>
      </div>

      <div className="topbar__group">
        <button type="button" className="topbar__btn" onClick={onSave} aria-label="Save circuit" title="Save to browser storage">
          <IconSave />
        </button>
        <button type="button" className="topbar__btn" onClick={onLoad} aria-label="Load circuit" title="Load from browser storage">
          <IconLoad />
        </button>
        <button
          type="button"
          className="topbar__btn topbar__btn--danger"
          onClick={() => useCircuitStore.getState().clearCircuit()}
          aria-label="Reset circuit"
          title="Clear the canvas"
        >
          <IconReset />
        </button>
      </div>

      {flash && <span className="topbar__flash">{flash}</span>}
      <AgentPanel />
    </header>
  );
}
