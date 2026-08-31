// Small hand-rolled inline SVG icons — no icon library dependency.
import type { SVGProps } from "react";

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

/** LogicLab wordmark glyph: a stylized AND-gate chip. */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" width={24} height={24} aria-hidden="true" {...props}>
      <path
        d="M6 6 H16 A10 10 0 0 1 16 26 H6 Z"
        fill="none"
        stroke="var(--signal-high)"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <circle cx={4} cy={11} r={1.8} fill="var(--signal-high)" />
      <circle cx={4} cy={21} r={1.8} fill="var(--signal-high)" />
      <circle cx={28} cy={16} r={1.8} fill="var(--signal-high)" />
      <line x1={4} y1={11} x2={7} y2={11} stroke="var(--signal-high)" strokeWidth={2} />
      <line x1={4} y1={21} x2={7} y2={21} stroke="var(--signal-high)" strokeWidth={2} />
      <line x1={22} y1={16} x2={28} y2={16} stroke="var(--signal-high)" strokeWidth={2} />
    </svg>
  );
}

export function IconUndo(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 8h8a5 5 0 0 1 0 10H9" />
      <path d="M8 4 4 8l4 4" />
    </Icon>
  );
}

export function IconRedo(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M16 8H8a5 5 0 0 0 0 10h3" />
      <path d="M12 4l4 4-4 4" />
    </Icon>
  );
}

export function IconSave(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 4h9l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M7 4v5h6V4" />
      <path d="M6 12h8v4H6z" />
    </Icon>
  );
}

export function IconLoad(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 8V5a1 1 0 0 1 1-1h4l2 2h6a1 1 0 0 1 1 1v2" />
      <path d="M3 8h14l-1.4 7.2a1 1 0 0 1-1 .8H5.4a1 1 0 0 1-1-.8L3 8Z" />
    </Icon>
  );
}

export function IconReset(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M16 10a6 6 0 1 1-2-4.5" />
      <path d="M16 3v4h-4" />
    </Icon>
  );
}
