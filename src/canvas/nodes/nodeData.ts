import type { Node } from "@xyflow/react";
import type { Bit, GateType } from "../../logic/types";

/** Shared `data` payload every LogicLab flow node carries, derived fresh from
 * the circuit + simulation result on every render (see Canvas.tsx). */
export interface LogicNodeData extends Record<string, unknown> {
  gateType: GateType;
  label?: string;
  /** Live simulated output value of this component (0/1). */
  value: Bit;
  aiTouched?: boolean;
  highlighted?: boolean;
  highlightReason?: string;
}

/** Flow node type used for every LogicLab node — one shared `data` shape, the
 * `gateType` field inside it selects which visual is drawn (see nodeTypes in index.ts). */
export type LogicFlowNode = Node<LogicNodeData, "logic">;

