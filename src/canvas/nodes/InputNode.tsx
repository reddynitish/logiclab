import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { useCircuitStore } from "../../store/circuitStore";
import type { LogicFlowNode } from "./nodeData";
import "./InputNode.css";

/** A compact toggle-switch source terminal. Click flips its value in the store,
 * which is the same action the WebMCP `set_input` tool drives — a human click
 * and an agent call are indistinguishable to the rest of the app. */
function InputNodeImpl({ id, data, selected }: NodeProps<LogicFlowNode>) {
  const { label, value, aiTouched, highlighted, highlightReason } = data;
  const high = value === 1;

  const onToggle = useCallback(() => {
    useCircuitStore.getState().toggleInput(id);
  }, [id]);

  return (
    <div
      className={clsx(
        "input-node",
        selected && "is-selected",
        aiTouched && "is-ai-touched",
        highlighted && "is-highlighted",
      )}
      title={highlighted && highlightReason ? highlightReason : undefined}
    >
      <div className="input-node__label">{label || "IN"}</div>
      <button
        type="button"
        className={clsx("input-node__switch", high && "is-high")}
        onClick={onToggle}
        aria-pressed={high}
        aria-label={`Toggle input ${label ?? id}, currently ${high ? "HIGH" : "LOW"}`}
      >
        <span className="input-node__knob" />
        <span className="input-node__bitval">{value}</span>
      </button>
      <Handle id="out" type="source" position={Position.Right} style={{ top: "50%" }} />
      {highlighted && highlightReason && <div className="input-node__reason">{highlightReason}</div>}
    </div>
  );
}

export const InputNode = memo(InputNodeImpl);
