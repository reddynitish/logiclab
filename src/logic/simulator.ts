import type { Bit, Circuit, CircuitComponent, GateType, Wire } from "./types";
import { GATE_INPUT_COUNT } from "./types";

export interface SimIssue {
  type: "cycle" | "floating-input" | "multiple-drivers" | "no-output" | "unknown-type";
  message: string;
  componentIds: string[];
  wireIds: string[];
}

export interface SimulationResult {
  /** Computed output value for every component that drives a signal (INPUT + gates). OUTPUT nodes get their fed-in value. */
  values: Record<string, Bit>;
  /** Signal value carried by each wire (== output value of the wire's source component). */
  wireValues: Record<string, Bit>;
  issues: SimIssue[];
}

function evalGate(type: GateType, inputs: Bit[]): Bit {
  switch (type) {
    case "AND":
      return inputs[0] && inputs[1] ? 1 : 0;
    case "OR":
      return inputs[0] || inputs[1] ? 1 : 0;
    case "NOT":
      return inputs[0] ? 0 : 1;
    case "XOR":
      return inputs[0] !== inputs[1] ? 1 : 0;
    case "NAND":
      return inputs[0] && inputs[1] ? 0 : 1;
    case "NOR":
      return inputs[0] || inputs[1] ? 0 : 1;
    default:
      // Unreachable for any well-typed GateType — evaluate() below never calls this for
      // types outside GATE_INPUT_COUNT, so this only guards against a future gate type
      // being added to the union without an evalGate case.
      return 0;
  }
}

/**
 * Deterministic combinational-circuit simulator. Topologically sorts components
 * by wire dependency and evaluates each in order. Never guesses: a wiring problem
 * (cycle, floating input, doubled driver) is reported as a structured issue rather
 * than silently producing a plausible-looking wrong answer.
 */
export function simulate(circuit: Circuit): SimulationResult {
  const byId = new Map<string, CircuitComponent>(circuit.components.map((c) => [c.id, c]));
  const issues: SimIssue[] = [];

  // Detect input ports fed by more than one wire.
  const driversByPort = new Map<string, Wire[]>();
  for (const w of circuit.wires) {
    const key = `${w.to}:${w.toPort}`;
    const list = driversByPort.get(key) ?? [];
    list.push(w);
    driversByPort.set(key, list);
  }
  for (const [key, wires] of driversByPort) {
    if (wires.length > 1) {
      const [compId] = key.split(":");
      issues.push({
        type: "multiple-drivers",
        message: `Component ${compId} has more than one wire feeding the same input port.`,
        componentIds: [compId],
        wireIds: wires.map((w) => w.id),
      });
    }
  }

  // Build dependency graph: component depends on the components driving its input wires.
  const dependsOn = new Map<string, Set<string>>();
  for (const c of circuit.components) dependsOn.set(c.id, new Set());
  for (const w of circuit.wires) {
    if (!byId.has(w.from) || !byId.has(w.to)) continue;
    dependsOn.get(w.to)?.add(w.from);
  }

  // Kahn's algorithm for topological order.
  const inDegree = new Map<string, number>();
  for (const [id, deps] of dependsOn) inDegree.set(id, deps.size);
  const dependents = new Map<string, string[]>();
  for (const c of circuit.components) dependents.set(c.id, []);
  for (const [id, deps] of dependsOn) {
    for (const dep of deps) dependents.get(dep)?.push(id);
  }

  const queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
  const order: string[] = [];
  const remaining = new Map(inDegree);
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const dep of dependents.get(id) ?? []) {
      const next = (remaining.get(dep) ?? 0) - 1;
      remaining.set(dep, next);
      if (next === 0) queue.push(dep);
    }
  }

  if (order.length !== circuit.components.length) {
    const cyclic = circuit.components.map((c) => c.id).filter((id) => !order.includes(id));
    issues.push({
      type: "cycle",
      message: `Circuit contains a feedback loop through: ${cyclic.join(", ")}. This simulator only supports combinational (loop-free) circuits.`,
      componentIds: cyclic,
      wireIds: circuit.wires
        .filter((w) => cyclic.includes(w.from) && cyclic.includes(w.to))
        .map((w) => w.id),
    });
  }

  const values: Record<string, Bit> = {};
  const wireValues: Record<string, Bit> = {};

  const inputWireForPort = (compId: string, port: number): Wire | undefined =>
    circuit.wires.find((w) => w.to === compId && w.toPort === port);

  for (const id of order) {
    const comp = byId.get(id)!;
    if (comp.type === "INPUT") {
      values[id] = comp.inputValue ?? 0;
      continue;
    }
    // Defense-in-depth: `type` ultimately comes from data (the WebMCP add_component tool
    // accepts a caller-supplied string), so a value outside GateType must degrade to a
    // reported issue rather than an out-of-bounds lookup / thrown exception reaching the
    // render tree — the tool layer also validates this, but simulate() never trusts it.
    if (!(comp.type in GATE_INPUT_COUNT)) {
      issues.push({
        type: "unknown-type",
        message: `Component ${id} has unrecognized type "${comp.type}"; treated as producing LOW.`,
        componentIds: [id],
        wireIds: [],
      });
      values[id] = 0;
      continue;
    }
    const portCount = GATE_INPUT_COUNT[comp.type];
    const inputs: Bit[] = [];
    for (let port = 0; port < portCount; port++) {
      const w = inputWireForPort(id, port);
      if (!w) {
        issues.push({
          type: "floating-input",
          message: `${comp.label ?? comp.type} (${id}) input ${port} is not connected; treated as LOW.`,
          componentIds: [id],
          wireIds: [],
        });
        inputs.push(0);
        continue;
      }
      inputs.push(values[w.from] ?? 0);
    }
    values[id] = comp.type === "OUTPUT" ? inputs[0] ?? 0 : evalGate(comp.type, inputs);
  }

  // Components that were skipped because they're part of a cycle: mark undefined-safe 0
  // so the UI never reads `undefined` as truthy/falsy in a confusing way.
  for (const c of circuit.components) {
    if (!(c.id in values)) values[c.id] = 0;
  }

  for (const w of circuit.wires) {
    wireValues[w.id] = values[w.from] ?? 0;
  }

  return { values, wireValues, issues };
}

export type InputAssignment = Record<string, Bit>;

/** All 2^n input combinations for the given INPUT component ids, in ascending binary order. */
export function allInputCombinations(inputIds: string[]): InputAssignment[] {
  const n = inputIds.length;
  const combos: InputAssignment[] = [];
  for (let mask = 0; mask < 2 ** n; mask++) {
    const assignment: InputAssignment = {};
    inputIds.forEach((id, i) => {
      assignment[id] = ((mask >> (n - 1 - i)) & 1) as Bit;
    });
    combos.push(assignment);
  }
  return combos;
}

export interface TruthTableRow {
  inputs: InputAssignment;
  outputs: Record<string, Bit>;
}

export interface TruthTable {
  inputIds: string[];
  outputIds: string[];
  rows: TruthTableRow[];
  issues: SimIssue[];
}

/** Runs every input combination against the circuit and reports the resulting truth table. */
export function generateTruthTable(circuit: Circuit): TruthTable {
  const inputIds = circuit.components.filter((c) => c.type === "INPUT").map((c) => c.id);
  const outputIds = circuit.components.filter((c) => c.type === "OUTPUT").map((c) => c.id);
  const combos = allInputCombinations(inputIds);
  const rows: TruthTableRow[] = [];
  const allIssues: SimIssue[] = [];

  for (const assignment of combos) {
    const patched: Circuit = {
      components: circuit.components.map((c) =>
        c.type === "INPUT" ? { ...c, inputValue: assignment[c.id] } : c,
      ),
      wires: circuit.wires,
    };
    const result = simulate(patched);
    const outputs: Record<string, Bit> = {};
    for (const id of outputIds) outputs[id] = result.values[id];
    rows.push({ inputs: assignment, outputs });
    allIssues.push(...result.issues);
  }

  // Issues are identical across rows for a static wiring problem; dedupe by message.
  const seen = new Set<string>();
  const issues = allIssues.filter((i) => {
    if (seen.has(i.message)) return false;
    seen.add(i.message);
    return true;
  });

  return { inputIds, outputIds, rows, issues };
}
