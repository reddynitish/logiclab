import { describe, expect, it } from "vitest";
import { generateTruthTable } from "../logic/simulator";
import { validateAgainstKnownFunction, type KnownFunction } from "../logic/validators";
import { EXAMPLES, getExample } from "./index";

// The built-in examples are what a judge sees first (landing page CTA, example picker).
// If one of these were mis-wired the whole demo would be undermined, so every example
// is checked for clean wiring, and the four with a canonical Boolean function are
// checked for exact correctness the same way validate_circuit checks a student's work.
describe("built-in examples", () => {
  it("every example simulates with zero wiring issues", () => {
    for (const example of EXAMPLES) {
      const table = generateTruthTable(example.build());
      expect(table.issues, `${example.name} should have no wiring issues`).toHaveLength(0);
    }
  });

  it.each<[string, KnownFunction]>([
    ["and-gate", "AND"],
    ["xor-gate", "XOR"],
    ["half-adder", "HALF_ADDER"],
    ["full-adder", "FULL_ADDER"],
  ])("%s matches the canonical %s function", (id, fn) => {
    const example = getExample(id)!;
    const result = validateAgainstKnownFunction(example.build(), fn);
    expect(result.matches, result.reason ?? JSON.stringify(result.mismatches)).toBe(true);
  });

  it("2:1 mux selects A when Sel=0 and B when Sel=1", () => {
    const example = getExample("mux-2to1")!;
    const table = generateTruthTable(example.build());
    const outId = example.build().components.find((c) => c.type === "OUTPUT")!.id;
    for (const row of table.rows) {
      const expected = row.inputs["sel"] ? row.inputs["b"] : row.inputs["a"];
      expect(row.outputs[outId]).toBe(expected);
    }
  });

  it("2-to-4 decoder activates exactly one output per input combination", () => {
    const example = getExample("decoder-2to4")!;
    const table = generateTruthTable(example.build());
    for (const row of table.rows) {
      const activeCount = Object.values(row.outputs).filter((v) => v === 1).length;
      expect(activeCount).toBe(1);
    }
    // Y3 (A.B) should be the only active output when A=1, B=1.
    const allOneRow = table.rows.find((r) => r.inputs["a"] === 1 && r.inputs["b"] === 1)!;
    expect(allOneRow.outputs["out3"]).toBe(1);
  });
});
