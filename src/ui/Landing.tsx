import { useCircuitStore } from "../store/circuitStore";
import { getExample } from "../examples";
import { LogoMark } from "./icons";
import "./Landing.css";

interface StepIconProps {
  variant: "you" | "agent" | "sync";
}

function StepIcon({ variant }: StepIconProps) {
  if (variant === "you") {
    return (
      <svg viewBox="0 0 40 40" width={36} height={36} aria-hidden="true">
        <circle cx={20} cy={14} r={7} fill="none" stroke="var(--selection)" strokeWidth={2} />
        <path d="M6 34c1-8 7-12 14-12s13 4 14 12" fill="none" stroke="var(--selection)" strokeWidth={2} strokeLinecap="round" />
      </svg>
    );
  }
  if (variant === "agent") {
    return (
      <svg viewBox="0 0 40 40" width={36} height={36} aria-hidden="true">
        <rect x={8} y={10} width={24} height={18} rx={4} fill="none" stroke="var(--ai-accent)" strokeWidth={2} />
        <circle cx={16} cy={19} r={2} fill="var(--ai-accent)" />
        <circle cx={24} cy={19} r={2} fill="var(--ai-accent)" />
        <path d="M20 10V5" stroke="var(--ai-accent)" strokeWidth={2} strokeLinecap="round" />
        <circle cx={20} cy={4} r={1.6} fill="var(--ai-accent)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" width={36} height={36} aria-hidden="true">
      <circle cx={13} cy={20} r={6} fill="none" stroke="var(--selection)" strokeWidth={2} />
      <circle cx={27} cy={20} r={6} fill="none" stroke="var(--ai-accent)" strokeWidth={2} />
      <path d="M17 16a6 6 0 0 1 0 8" fill="none" stroke="var(--signal-high)" strokeWidth={2} />
    </svg>
  );
}

const STEPS: { variant: StepIconProps["variant"]; title: string; body: string }[] = [
  { variant: "you", title: "You edit the canvas", body: "Drag gates, wire them up, toggle inputs." },
  {
    variant: "agent",
    title: "Your agent edits the same canvas, live",
    body: "Through WebMCP — no copy-pasting circuits back and forth.",
  },
  { variant: "sync", title: "You both see every change instantly", body: "One shared circuit, one shared truth table." },
];

export function Landing({ onOpenLab }: { onOpenLab: () => void }) {
  const onTryDemo = () => {
    const example = getExample("half-adder");
    if (example) useCircuitStore.getState().loadCircuit(example.build(), example.name);
    onOpenLab();
  };

  return (
    <div className="landing">
      <div className="landing__inner">
        <div className="landing__brand">
          <LogoMark />
          <span>LogicLab</span>
        </div>

        <h1 className="landing__headline">Build circuits with your AI.</h1>
        <p className="landing__subhead">
          A digital logic workspace where you and your agent build, test, debug, and understand circuits
          together — through WebMCP.
        </p>

        <div className="landing__cta">
          <button type="button" className="landing__btn landing__btn--primary" onClick={onOpenLab}>
            Open Lab
          </button>
          <button type="button" className="landing__btn landing__btn--secondary" onClick={onTryDemo}>
            Try Half Adder Demo
          </button>
        </div>

        <div className="landing__steps">
          {STEPS.map((step) => (
            <div className="landing__step" key={step.title}>
              <StepIcon variant={step.variant} />
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>

        <p className="landing__prompt">
          Ask your agent: <code>"Build and test a half adder."</code>
        </p>
      </div>
    </div>
  );
}
