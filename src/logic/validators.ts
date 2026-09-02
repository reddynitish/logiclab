import type { Bit, Circuit } from "./types";
import { generateTruthTable } from "./simulator";

export type KnownFunction =
  | "AND"
  | "OR"
  | "NOT"
  | "XOR"
  | "NAND"
  | "NOR"
  | "HALF_ADDER"
  | "FULL_ADDER"
  | "MUX_2TO1"
  | "DECODER_2TO4";

interface CanonicalSpec {
  inputNames: string[];
  outputNames: string[];
  /** Deterministic reference implementation — never delegated to an LLM. */
  eval: (inputs: Bit[]) => Bit[];
}

const b = (v: boolean): Bit => (v ? 1 : 0);

export const CANONICAL_FUNCTIONS: Record<KnownFunction, CanonicalSpec> = {
  AND: { inputNames: ["A", "B"], outputNames: ["Y"], eval: ([a, x]) => [b(!!a && !!x)] },
  OR: { inputNames: ["A", "B"], outputNames: ["Y"], eval: ([a, x]) => [b(!!a || !!x)] },
  NOT: { inputNames: ["A"], outputNames: ["Y"], eval: ([a]) => [b(!a)] },
  XOR: { inputNames: ["A", "B"], outputNames: ["Y"], eval: ([a, x]) => [b(!!a !== !!x)] },
  NAND: { inputNames: ["A", "B"], outputNames: ["Y"], eval: ([a, x]) => [b(!(a && x))] },
  NOR: { inputNames: ["A", "B"], outputNames: ["Y"], eval: ([a, x]) => [b(!(a || x))] },
  HALF_ADDER: {
    inputNames: ["A", "B"],
    outputNames: ["Sum", "Carry"],
    eval: ([a, x]) => [b(!!a !== !!x), b(!!a && !!x)],
  },
  FULL_ADDER: {
    inputNames: ["A", "B", "Cin"],
    outputNames: ["Sum", "Cout"],
    eval: ([a, x, cin]) => {
      const axorb = !!a !== !!x;
      return [b(axorb !== !!cin), b((!!a && !!x) || (!!cin && axorb))];
    },
  },
  MUX_2TO1: {
    inputNames: ["A", "B", "Sel"],
    outputNames: ["Y"],
    eval: ([a, x, sel]) => [sel ? x : a],
  },
  DECODER_2TO4: {
    inputNames: ["A", "B"],
    outputNames: ["Y0", "Y1", "Y2", "Y3"],
    eval: ([a, x]) => [b(!a && !x), b(!a && !!x), b(!!a && !x), b(!!a && !!x)],
  },
};

export interface ValidationMismatch {
  inputs: Record<string, Bit>;
  expected: Record<string, Bit>;
  actual: Record<string, Bit>;
}

export interface ValidationResult {
  matches: boolean;
  targetFunction: KnownFunction;
  reason?: string;
  totalCases: number;
  mismatches: ValidationMismatch[];
}

/**
 * Maps a circuit's INPUT/OUTPUT components onto a canonical function's named ports.
 * Prefers exact (case-insensitive) label matches — e.g. a component labeled "Cin" maps
 * to the full adder's carry-in — and falls back to declaration order when labels don't
 * cover every port, so unlabeled circuits (built by dragging from the palette) still validate.
 */
function mapPorts(
  componentIds: string[],
  labels: Record<string, string | undefined>,
  names: string[],
): string[] | null {
  const byLabel = new Map<string, string>();
  for (const id of componentIds) {
    const l = labels[id]?.trim().toLowerCase();
    if (l) byLabel.set(l, id);
  }
  const explicit = names.map((n) => byLabel.get(n.toLowerCase()));
  if (explicit.every((id): id is string => !!id)) return explicit;
  if (componentIds.length !== names.length) return null;
  return componentIds;
}

/**
 * Tests a circuit against a known Boolean function across every input combination.
 * Digital-logic correctness is computed by CANONICAL_FUNCTIONS (plain deterministic
 * code), never inferred by the calling agent — this tool exists so "does my circuit
 * implement XOR" gets a precise, code-verified yes/no plus the exact failing rows.
 */
export function validateAgainstKnownFunction(circuit: Circuit, target: KnownFunction): ValidationResult {
  const spec = CANONICAL_FUNCTIONS[target];
  const inputComponents = circuit.components.filter((c) => c.type === "INPUT");
  const outputComponents = circuit.components.filter((c) => c.type === "OUTPUT");
  const labels: Record<string, string | undefined> = {};
  for (const c of circuit.components) labels[c.id] = c.label;

  if (inputComponents.length !== spec.inputNames.length) {
    return {
      matches: false,
      targetFunction: target,
      reason: `${target} needs exactly ${spec.inputNames.length} input(s) (${spec.inputNames.join(", ")}), but the circuit has ${inputComponents.length}.`,
      totalCases: 0,
      mismatches: [],
    };
  }
  if (outputComponents.length !== spec.outputNames.length) {
    return {
      matches: false,
      targetFunction: target,
      reason: `${target} needs exactly ${spec.outputNames.length} output(s) (${spec.outputNames.join(", ")}), but the circuit has ${outputComponents.length}.`,
      totalCases: 0,
      mismatches: [],
    };
  }

  const inputOrder = mapPorts(
    inputComponents.map((c) => c.id),
    labels,
    spec.inputNames,
  );
  const outputOrder = mapPorts(
    outputComponents.map((c) => c.id),
    labels,
    spec.outputNames,
  );
  if (!inputOrder || !outputOrder) {
    return {
      matches: false,
      targetFunction: target,
      reason: "Could not unambiguously map circuit inputs/outputs to the expected ports.",
      totalCases: 0,
      mismatches: [],
    };
  }

  const table = generateTruthTable(circuit);
  const mismatches: ValidationMismatch[] = [];

  for (const row of table.rows) {
    const orderedInputs = inputOrder.map((id) => row.inputs[id]);
    const expectedOutputs = spec.eval(orderedInputs);
    const expected: Record<string, Bit> = {};
    const actual: Record<string, Bit> = {};
    let rowMatches = true;
    outputOrder.forEach((id, i) => {
      expected[id] = expectedOutputs[i];
      actual[id] = row.outputs[id];
      if (expected[id] !== actual[id]) rowMatches = false;
    });
    if (!rowMatches) {
      mismatches.push({ inputs: row.inputs, expected, actual });
    }
  }

  return {
    matches: mismatches.length === 0 && table.issues.length === 0,
    targetFunction: target,
    reason: table.issues.length > 0 ? table.issues.map((i) => i.message).join(" ") : undefined,
    totalCases: table.rows.length,
    mismatches,
  };
}
