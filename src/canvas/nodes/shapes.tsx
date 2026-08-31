// Inline SVG bodies for each logic-gate node, drawn as real digital-logic
// symbols (IEC/ANSI style) rather than generic labeled boxes. Every shape
// shares the same 80x56 viewBox so the wrapping node box and handle
// positions line up regardless of which gate is rendered.

export interface ShapeProps {
  /** Stroke/fill color for the gate outline — reflects the live HIGH/LOW output. */
  stroke: string;
  fill: string;
}

const STROKE_WIDTH = 2.5;

/** Short pin stubs so handles (at the node's outer edge) visually connect to the gate body,
 * matching how real schematic symbols draw input/output leads. */
function TwoInputStubs({ stroke, bodyLeft }: { stroke: string; bodyLeft: number }) {
  return (
    <>
      <line x1={0} y1={17} x2={bodyLeft} y2={17} stroke={stroke} strokeWidth={STROKE_WIDTH} />
      <line x1={0} y1={39} x2={bodyLeft} y2={39} stroke={stroke} strokeWidth={STROKE_WIDTH} />
    </>
  );
}
function OneInputStub({ stroke, bodyLeft }: { stroke: string; bodyLeft: number }) {
  return <line x1={0} y1={28} x2={bodyLeft} y2={28} stroke={stroke} strokeWidth={STROKE_WIDTH} />;
}
function OutputStub({ stroke, bodyRight }: { stroke: string; bodyRight: number }) {
  return <line x1={bodyRight} y1={28} x2={80} y2={28} stroke={stroke} strokeWidth={STROKE_WIDTH} />;
}

export function AndShape({ stroke, fill }: ShapeProps) {
  return (
    <svg viewBox="0 0 80 56" className="gate-shape" aria-hidden="true">
      <TwoInputStubs stroke={stroke} bodyLeft={10} />
      <OutputStub stroke={stroke} bodyRight={58} />
      <path
        d="M10 6 H38 A20 20 0 0 1 38 50 H10 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NandShape({ stroke, fill }: ShapeProps) {
  return (
    <svg viewBox="0 0 80 56" className="gate-shape" aria-hidden="true">
      <TwoInputStubs stroke={stroke} bodyLeft={10} />
      <OutputStub stroke={stroke} bodyRight={65} />
      <path
        d="M10 6 H34 A20 20 0 0 1 34 50 H10 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <circle cx={60} cy={28} r={5} fill={fill} stroke={stroke} strokeWidth={STROKE_WIDTH} />
    </svg>
  );
}

const OR_BODY = "M10 6 Q46 4 66 28 Q46 52 10 50 Q22 28 10 6 Z";
const NOR_BODY = "M10 6 Q42 4 58 28 Q42 52 10 50 Q22 28 10 6 Z";

export function OrShape({ stroke, fill }: ShapeProps) {
  return (
    <svg viewBox="0 0 80 56" className="gate-shape" aria-hidden="true">
      <TwoInputStubs stroke={stroke} bodyLeft={9} />
      <OutputStub stroke={stroke} bodyRight={66} />
      <path d={OR_BODY} fill={fill} stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
    </svg>
  );
}

export function NorShape({ stroke, fill }: ShapeProps) {
  return (
    <svg viewBox="0 0 80 56" className="gate-shape" aria-hidden="true">
      <TwoInputStubs stroke={stroke} bodyLeft={9} />
      <OutputStub stroke={stroke} bodyRight={69} />
      <path d={NOR_BODY} fill={fill} stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <circle cx={64} cy={28} r={5} fill={fill} stroke={stroke} strokeWidth={STROKE_WIDTH} />
    </svg>
  );
}

export function XorShape({ stroke, fill }: ShapeProps) {
  return (
    <svg viewBox="0 0 80 56" className="gate-shape" aria-hidden="true">
      <TwoInputStubs stroke={stroke} bodyLeft={9} />
      <OutputStub stroke={stroke} bodyRight={66} />
      <path
        d="M4 6 Q16 28 4 50"
        fill="none"
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
      <path d={OR_BODY} fill={fill} stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
    </svg>
  );
}

export function NotShape({ stroke, fill }: ShapeProps) {
  return (
    <svg viewBox="0 0 80 56" className="gate-shape" aria-hidden="true">
      <OneInputStub stroke={stroke} bodyLeft={10} />
      <OutputStub stroke={stroke} bodyRight={70} />
      <path
        d="M10 6 L10 50 L58 28 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <circle cx={65} cy={28} r={5} fill={fill} stroke={stroke} strokeWidth={STROKE_WIDTH} />
    </svg>
  );
}
