// Circuit data model. Every circuit is plain, serializable data — no class instances,
// no functions — so it can be sent whole to a WebMCP tool caller and round-tripped
// through JSON without loss.

export type GateType =
  | "INPUT"
  | "OUTPUT"
  | "AND"
  | "OR"
  | "NOT"
  | "XOR"
  | "NAND"
  | "NOR";

export type Bit = 0 | 1;

export interface Position {
  x: number;
  y: number;
}

export interface CircuitComponent {
  id: string;
  type: GateType;
  position: Position;
  /** Only meaningful for type === "INPUT": the value the student/agent toggles. */
  inputValue?: Bit;
  /** Optional human label, e.g. "A", "Sum", "Cin". Shown on the node and in reports. */
  label?: string;
  /** True while this node should render the "AI just touched this" pulse. */
  aiTouched?: boolean;
  /** True while this node should render the debugging highlight. */
  highlighted?: boolean;
  highlightReason?: string;
}

export interface Wire {
  id: string;
  /** Component id the wire starts at (its single output port). */
  from: string;
  /** Component id the wire ends at. */
  to: string;
  /** Which input port of `to` this wire feeds, 0-indexed. NOT/OUTPUT have 1 port, others 2. */
  toPort: number;
  aiTouched?: boolean;
  highlighted?: boolean;
  highlightReason?: string;
}

export interface Circuit {
  components: CircuitComponent[];
  wires: Wire[];
}

export const GATE_INPUT_COUNT: Record<GateType, number> = {
  INPUT: 0,
  OUTPUT: 1,
  NOT: 1,
  AND: 2,
  OR: 2,
  XOR: 2,
  NAND: 2,
  NOR: 2,
};

export const GATE_HAS_OUTPUT: Record<GateType, boolean> = {
  INPUT: true,
  OUTPUT: false,
  NOT: true,
  AND: true,
  OR: true,
  XOR: true,
  NAND: true,
  NOR: true,
};

export function emptyCircuit(): Circuit {
  return { components: [], wires: [] };
}
