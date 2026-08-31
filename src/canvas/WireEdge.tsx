import { BaseEdge, EdgeLabelRenderer, getBezierPath, type Edge, type EdgeProps } from "@xyflow/react";
import clsx from "clsx";
import "./WireEdge.css";

export interface WireEdgeData extends Record<string, unknown> {
  high: boolean;
  aiTouched?: boolean;
  highlighted?: boolean;
  highlightReason?: string;
}

export type WireFlowEdge = Edge<WireEdgeData, "wire">;

/** A wire rendered as a bezier path whose color/thickness/animation reflect its live
 * simulated value: dim gray-blue + static when LOW, bright cyan + flowing dashes when HIGH.
 * Selection (for delete) is React Flow's built-in edge selection. */
export function WireEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<WireFlowEdge>) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const high = !!data?.high;
  const aiTouched = !!data?.aiTouched;
  const highlighted = !!data?.highlighted;
  const reason = data?.highlightReason;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        className={clsx(
          "wire-edge",
          high && "is-high",
          selected && "is-selected",
          aiTouched && "is-ai-touched",
          highlighted && "is-highlighted",
        )}
        style={{ strokeWidth: high ? 3 : 2 }}
      />
      {highlighted && reason && (
        <EdgeLabelRenderer>
          <div
            className="wire-edge__reason"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {reason}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
