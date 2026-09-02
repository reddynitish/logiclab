import { useMemo, useState } from "react";
import clsx from "clsx";
import { useCircuitStore } from "../store/circuitStore";
import { generateTruthTable, type TruthTable } from "../logic/simulator";
import { validateAgainstKnownFunction, KNOWN_FUNCTIONS, type KnownFunction, type ValidationResult } from "../logic/validators";
import "./TruthTablePanel.css";

interface Computed<T> {
  structureVersion: number;
  value: T;
}

export function TruthTablePanel() {
  const circuit = useCircuitStore((s) => s.circuit);
  const structureVersion = useCircuitStore((s) => s.structureVersion);
  const [open, setOpen] = useState(true);
  const [computedTable, setComputedTable] = useState<Computed<TruthTable> | null>(null);
  const [computedValidation, setComputedValidation] = useState<Computed<ValidationResult> | null>(null);
  const [target, setTarget] = useState<KnownFunction | "">("");

  // A structural edit (topology, an INPUT's value, undo/redo — anything that could change
  // what simulate() reports) invalidates a previously generated result. Keying off
  // structureVersion rather than `circuit` object identity matters: highlight_component/
  // clearHighlights/markAiTouched all replace the circuit object too (cosmetic flags live
  // on the same components), so identity comparison would hide a still-accurate PASS/FAIL
  // banner the moment an agent highlights the very gate the banner is talking about —
  // exactly what happens in the debug demo this app is built around.
  const table = computedTable?.structureVersion === structureVersion ? computedTable.value : null;
  const validation = computedValidation?.structureVersion === structureVersion ? computedValidation.value : null;

  const labelOf = (id: string) => circuit.components.find((c) => c.id === id)?.label || id;

  const onGenerate = () => {
    setComputedTable({ structureVersion, value: generateTruthTable(circuit) });
  };

  const onValidate = (value: string) => {
    const fn = value as KnownFunction | "";
    setTarget(fn);
    if (!fn) {
      setComputedValidation(null);
      return;
    }
    setComputedValidation({ structureVersion, value: validateAgainstKnownFunction(circuit, fn) });
    setComputedTable({ structureVersion, value: generateTruthTable(circuit) });
  };

  const mismatchKeys = useMemo(() => {
    if (!validation) return new Set<string>();
    return new Set(validation.mismatches.map((m) => JSON.stringify(m.inputs)));
  }, [validation]);

  const hasContent = table && table.inputIds.length + table.outputIds.length > 0;

  return (
    <div className="truth-panel">
      <button type="button" className="truth-panel__header" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>Truth Table</span>
        <span className="truth-panel__chevron" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="truth-panel__body">
          <div className="truth-panel__actions">
            <button type="button" className="truth-panel__generate" onClick={onGenerate}>
              Generate Truth Table
            </button>
            <label className="truth-panel__validate">
              <span>Validate against</span>
              <select value={validation ? target : ""} onChange={(e) => onValidate(e.target.value)}>
                <option value="">Select function…</option>
                {KNOWN_FUNCTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {validation && (
            <div className={clsx("truth-panel__banner", validation.matches ? "is-pass" : "is-fail")}>
              <strong>
                {validation.matches ? "PASS" : "FAIL"} — {validation.matches ? "matches" : "does not match"}{" "}
                {validation.targetFunction}
              </strong>
              {!validation.matches && (
                <p>
                  {validation.reason ??
                    `${validation.mismatches.length} of ${validation.totalCases} input combination(s) produce the wrong output.`}
                </p>
              )}
            </div>
          )}

          {table && table.issues.length > 0 && (
            <div className="truth-panel__issues">
              {table.issues.map((issue, i) => (
                <p key={i}>{issue.message}</p>
              ))}
            </div>
          )}

          {hasContent ? (
            <div className="truth-table__scroll">
              <table className="truth-table">
                <thead>
                  <tr>
                    {table!.inputIds.map((id) => (
                      <th key={id}>{labelOf(id)}</th>
                    ))}
                    {table!.outputIds.map((id) => (
                      <th key={id} className="truth-table__out-col">
                        {labelOf(id)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table!.rows.map((row, i) => {
                    const mismatched = mismatchKeys.has(JSON.stringify(row.inputs));
                    return (
                      <tr key={i} className={mismatched ? "is-mismatch" : undefined}>
                        {table!.inputIds.map((id) => (
                          <td key={id} className={row.inputs[id] === 1 ? "is-high" : undefined}>
                            {row.inputs[id]}
                          </td>
                        ))}
                        {table!.outputIds.map((id) => (
                          <td
                            key={id}
                            className={clsx("truth-table__out-col", row.outputs[id] === 1 && "is-high")}
                          >
                            {row.outputs[id]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : table ? (
            <p className="truth-panel__empty">No INPUT/OUTPUT components on the canvas yet.</p>
          ) : (
            <p className="truth-panel__empty">Click "Generate Truth Table" to see every input/output combination.</p>
          )}
        </div>
      )}
    </div>
  );
}
