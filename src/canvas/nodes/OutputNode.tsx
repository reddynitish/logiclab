import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import type { LogicFlowNode } from "./nodeData";
import "./OutputNode.css";

/** A small LED-style terminal — fills with the HIGH color when lit, dim when LOW. */
function OutputNodeImpl({ data, selected }: NodeProps<LogicFlowNode>) {
  const { label, value, aiTouched, highlighted, highlightReason } = data;
  const high = value === 1;

  return (
    <div
      className={clsx(
        "output-node",
        selected && "is-selected",
        aiTouched && "is-ai-touched",
        highlighted && "is-highlighted",
      )}
      title={highlighted && highlightReason ? highlightReason : undefined}
    >
      <Handle id="in0" type="target" position={Position.Left} style={{ top: "50%" }} />
      <span className={clsx("output-node__led", high && "is-high")} aria-hidden="true" />
      <div className="output-node__label">{label || "OUT"}</div>
      {highlighted && highlightReason && <div className="output-node__reason">{highlightReason}</div>}
    </div>
  );
}

export const OutputNode = memo(OutputNodeImpl);
