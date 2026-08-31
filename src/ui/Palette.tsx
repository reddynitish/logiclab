import type { DragEvent } from "react";
import { useCircuitStore } from "../store/circuitStore";
import type { GateType } from "../logic/types";
import { AndShape, NandShape, NorShape, NotShape, OrShape, XorShape } from "../canvas/nodes/shapes";
import "./Palette.css";

const DRAG_MIME = "application/logiclab-gate-type";

interface PaletteItem {
  type: GateType;
  description: string;
}

const GATES: PaletteItem[] = [
  { type: "AND", description: "HIGH only if both inputs are HIGH" },
  { type: "OR", description: "HIGH if either input is HIGH" },
  { type: "NOT", description: "Inverts its single input" },
  { type: "XOR", description: "HIGH only if inputs differ" },
  { type: "NAND", description: "AND, inverted" },
  { type: "NOR", description: "OR, inverted" },
];

const TERMINALS: PaletteItem[] = [
  { type: "INPUT", description: "Toggleable source bit" },
  { type: "OUTPUT", description: "Display terminal" },
];

const PREVIEW_STROKE = "var(--text-secondary)";
const PREVIEW_FILL = "var(--bg-inset)";

function GatePreview({ type }: { type: GateType }) {
  const shapes: Partial<Record<GateType, typeof AndShape>> = {
    AND: AndShape,
    OR: OrShape,
    NOT: NotShape,
    XOR: XorShape,
    NAND: NandShape,
    NOR: NorShape,
  };
  const Shape = shapes[type];
  if (Shape) return <Shape stroke={PREVIEW_STROKE} fill={PREVIEW_FILL} />;
  if (type === "INPUT") {
    return (
      <svg viewBox="0 0 80 56" className="gate-shape" aria-hidden="true">
        <rect x={16} y={18} width={48} height={20} rx={10} fill={PREVIEW_FILL} stroke={PREVIEW_STROKE} strokeWidth={2.5} />
        <circle cx={28} cy={28} r={7} fill={PREVIEW_STROKE} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 56" className="gate-shape" aria-hidden="true">
      <circle cx={40} cy={28} r={14} fill={PREVIEW_FILL} stroke={PREVIEW_STROKE} strokeWidth={2.5} />
    </svg>
  );
}

/** Fans successive click-to-add placements out instead of stacking them exactly,
 * so keyboard/non-drag users placing several components still get a usable layout. */
function nextDefaultPosition(count: number): { x: number; y: number } {
  const col = count % 4;
  const row = Math.floor(count / 4);
  return { x: 320 + col * 140, y: 120 + row * 120 };
}

function PaletteCard({ item }: { item: PaletteItem }) {
  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData(DRAG_MIME, item.type);
    e.dataTransfer.effectAllowed = "move";
  };

  const onAdd = () => {
    const count = useCircuitStore.getState().circuit.components.length;
    const id = useCircuitStore.getState().addComponent(item.type, nextDefaultPosition(count));
    useCircuitStore.getState().select(id);
  };

  return (
    <div className="palette-card" draggable onDragStart={onDragStart} title={item.description}>
      <div className="palette-card__preview">
        <GatePreview type={item.type} />
      </div>
      <div className="palette-card__meta">
        <span className="palette-card__name">{item.type}</span>
        <button type="button" className="palette-card__add" onClick={onAdd} aria-label={`Add ${item.type}`}>
          +
        </button>
      </div>
    </div>
  );
}

export function Palette() {
  return (
    <aside className="palette" aria-label="Component palette">
      <div className="palette__section-title">Terminals</div>
      <div className="palette__grid">
        {TERMINALS.map((item) => (
          <PaletteCard key={item.type} item={item} />
        ))}
      </div>
      <div className="palette__section-title">Gates</div>
      <div className="palette__grid">
        {GATES.map((item) => (
          <PaletteCard key={item.type} item={item} />
        ))}
      </div>
      <p className="palette__hint">Drag onto the canvas, or click + to add.</p>
    </aside>
  );
}
