import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { GATE_INPUT_COUNT, GATE_HAS_OUTPUT } from "../../logic/types";
import type { LogicFlowNode } from "./nodeData";
import { AndShape, NandShape, NorShape, NotShape, OrShape, XorShape, type ShapeProps } from "./shapes";
import "./GateNode.css";

const SHAPES: Record<string, (p: ShapeProps) => React.ReactElement> = {
  AND: AndShape,
  NAND: NandShape,
  OR: OrShape,
  NOR: NorShape,
  XOR: XorShape,
  NOT: NotShape,
};

/** Vertical handle offsets (px from node top) — must match the pin stubs drawn in shapes.tsx. */
const TWO_INPUT_TOPS = [17, 39];
const ONE_INPUT_TOP = 28;
const OUTPUT_TOP = 28;

function GateNodeImpl({ data, selected }: NodeProps<LogicFlowNode>) {
  const { gateType, label, value, aiTouched, highlighted, highlightReason } = data;
  const Shape = SHAPES[gateType];
  const inputCount = GATE_INPUT_COUNT[gateType];
  const hasOutput = GATE_HAS_OUTPUT[gateType];
  const high = value === 1;
  const color = high ? "var(--signal-high)" : "var(--signal-low)";
  const fill = high ? "var(--signal-high-soft)" : "var(--bg-panel-elevated)";

  return (
    <div
      className={clsx(
        "gate-node",
        selected && "is-selected",
        aiTouched && "is-ai-touched",
        highlighted && "is-highlighted",
      )}
      title={highlighted && highlightReason ? highlightReason : undefined}
    >
      {inputCount === 2 &&
        TWO_INPUT_TOPS.map((top, i) => (
          <Handle key={i} id={`in${i}`} type="target" position={Position.Left} style={{ top }} />
        ))}
      {inputCount === 1 && <Handle id="in0" type="target" position={Position.Left} style={{ top: ONE_INPUT_TOP }} />}

      <div className="gate-node__body">
        {Shape ? <Shape stroke={color} fill={fill} /> : null}
      </div>

      {hasOutput && <Handle id="out" type="source" position={Position.Right} style={{ top: OUTPUT_TOP }} />}

      <div className="gate-node__label" title={label ?? gateType}>
        {label || gateType}
      </div>
      {highlighted && highlightReason && <div className="gate-node__reason">{highlightReason}</div>}
    </div>
  );
}

export const GateNode = memo(GateNodeImpl);
