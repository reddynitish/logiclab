import clsx from "clsx";
import { useCircuitStore } from "../store/circuitStore";
import { simulate } from "../logic/simulator";
import "./StatusBar.css";

export function StatusBar() {
  const circuit = useCircuitStore((s) => s.circuit);
  const exampleName = useCircuitStore((s) => s.exampleName);
  const { issues } = simulate(circuit);

  return (
    <footer className="statusbar">
      <span className={clsx("statusbar__issues", issues.length > 0 ? "is-warn" : "is-ok")}>
        <span className="statusbar__dot" aria-hidden="true" />
        {issues.length === 0
          ? "No issues"
          : `${issues.length} issue${issues.length > 1 ? "s" : ""}: ${issues[0].message}`}
      </span>

      {exampleName && <span className="statusbar__example">{exampleName}</span>}

      <span className="statusbar__hints">
        <kbd>Delete</kbd> remove selection · <kbd>Ctrl+Z</kbd> undo · <kbd>Ctrl+Shift+Z</kbd> redo
      </span>
    </footer>
  );
}
