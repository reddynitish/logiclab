import type { NodeProps } from "@xyflow/react";
import { GateNode } from "./GateNode";
import { InputNode } from "./InputNode";
import { OutputNode } from "./OutputNode";
import type { LogicFlowNode } from "./nodeData";

/** Every gate type routes to the same GateNode (it reads data.gateType to pick a shape);
 * INPUT/OUTPUT get their own dedicated interactive visuals. Registered under a single
 * React Flow node type ("logic") — see nodeTypes in index.tsx. */
export function LogicNode(props: NodeProps<LogicFlowNode>) {
  if (props.data.gateType === "INPUT") return <InputNode {...props} />;
  if (props.data.gateType === "OUTPUT") return <OutputNode {...props} />;
  return <GateNode {...props} />;
}
