import { useCircuitStore } from "../store/circuitStore";
import "./Inspector.css";

function Legend() {
  return (
    <div className="legend">
      <h3 className="inspector__heading">Nothing selected</h3>
      <p className="legend__hint">Click a gate, terminal, or wire to inspect it. Color language used on the canvas:</p>
      <ul className="legend__list">
        <li>
          <span className="legend__swatch legend__swatch--high" /> HIGH signal (1)
        </li>
        <li>
          <span className="legend__swatch legend__swatch--low" /> LOW signal (0)
        </li>
        <li>
          <span className="legend__swatch legend__swatch--ai" /> Agent just changed this
        </li>
        <li>
          <span className="legend__swatch legend__swatch--highlight" /> Flagged for debugging
        </li>
        <li>
          <span className="legend__swatch legend__swatch--selection" /> Selected
        </li>
      </ul>
    </div>
  );
}

export function Inspector() {
  const selectedId = useCircuitStore((s) => s.selectedId);
  const circuit = useCircuitStore((s) => s.circuit);

  const component = circuit.components.find((c) => c.id === selectedId);
  const wire = circuit.wires.find((w) => w.id === selectedId);

  if (!selectedId || (!component && !wire)) {
    return (
      <div className="inspector">
        <Legend />
      </div>
    );
  }

  if (component) {
    // Uncontrolled + keyed on id:label so an external (agent-driven) relabel is
    // reflected immediately without needing an effect to resync local draft state.
    const commitLabel = (value: string) => {
      if (value !== (component.label ?? "")) {
        useCircuitStore.getState().updateComponent(component.id, { label: value || undefined });
      }
    };
    return (
      <div className="inspector">
        <h3 className="inspector__heading">{component.type}</h3>
        <dl className="inspector__facts">
          <dt>id</dt>
          <dd>{component.id}</dd>
          <dt>position</dt>
          <dd>
            {Math.round(component.position.x)}, {Math.round(component.position.y)}
          </dd>
        </dl>

        <label className="inspector__field">
          <span>Label</span>
          <input
            key={`${component.id}:${component.label ?? ""}`}
            type="text"
            defaultValue={component.label ?? ""}
            placeholder={component.type}
            onBlur={(e) => commitLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        </label>

        {component.type === "INPUT" && (
          <label className="inspector__field inspector__field--row">
            <span>Value</span>
            <button
              type="button"
              className="inspector__toggle"
              onClick={() => useCircuitStore.getState().toggleInput(component.id)}
              aria-pressed={component.inputValue === 1}
            >
              {component.inputValue === 1 ? "HIGH (1)" : "LOW (0)"}
            </button>
          </label>
        )}

        <button
          type="button"
          className="inspector__delete"
          onClick={() => useCircuitStore.getState().removeComponent(component.id)}
        >
          Delete
        </button>
      </div>
    );
  }

  // wire
  return (
    <div className="inspector">
      <h3 className="inspector__heading">Wire</h3>
      <dl className="inspector__facts">
        <dt>id</dt>
        <dd>{wire!.id}</dd>
        <dt>from</dt>
        <dd>{wire!.from}</dd>
        <dt>to</dt>
        <dd>
          {wire!.to} (port {wire!.toPort})
        </dd>
      </dl>
      <button
        type="button"
        className="inspector__delete"
        onClick={() => useCircuitStore.getState().disconnect(wire!.id)}
      >
        Delete
      </button>
    </div>
  );
}
