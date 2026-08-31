import { describe, expect, it } from "vitest";
import type { Circuit } from "./types";
import { validateAgainstKnownFunction } from "./validators";
import { binaryGateCircuit, fullAdder, halfAdder } from "./simulator.test";

describe("validateAgainstKnownFunction", () => {
  it("confirms a correct XOR circuit", () => {
    const result = validateAgainstKnownFunction(binaryGateCircuit("XOR"), "XOR");
    expect(result.matches).toBe(true);
    expect(result.mismatches).toHaveLength(0);
    expect(result.totalCases).toBe(4);
  });

  it("rejects an AND circuit when asked to validate against XOR, with exact failing rows", () => {
    const result = validateAgainstKnownFunction(binaryGateCircuit("AND"), "XOR");
    expect(result.matches).toBe(false);
    // AND vs XOR differ on (0,1),(1,0),(1,1) -> 3 of 4 rows mismatch.
    expect(result.mismatches.length).toBe(3);
  });

  it("confirms a correctly wired half adder", () => {
    const result = validateAgainstKnownFunction(halfAdder(), "HALF_ADDER");
    expect(result.matches).toBe(true);
  });

  it("confirms a correctly wired full adder", () => {
    const result = validateAgainstKnownFunction(fullAdder(), "FULL_ADDER");
    expect(result.matches).toBe(true);
  });

  it("reports arity mismatch instead of guessing when input count is wrong", () => {
    const circuit: Circuit = {
      components: [
        { id: "a", type: "INPUT", position: { x: 0, y: 0 }, inputValue: 0 },
        { id: "g", type: "NOT", position: { x: 0, y: 0 } },
        { id: "y", type: "OUTPUT", position: { x: 0, y: 0 } },
      ],
      wires: [
        { id: "w1", from: "a", to: "g", toPort: 0 },
        { id: "w2", from: "g", to: "y", toPort: 0 },
      ],
    };
    const result = validateAgainstKnownFunction(circuit, "XOR");
    expect(result.matches).toBe(false);
    expect(result.reason).toMatch(/needs exactly 2 input/);
  });

  it("maps ports by label when present, in any declaration order", () => {
    const circuit: Circuit = {
      components: [
        { id: "x1", type: "INPUT", position: { x: 0, y: 0 }, inputValue: 0, label: "B" },
        { id: "x2", type: "INPUT", position: { x: 0, y: 0 }, inputValue: 0, label: "A" },
        { id: "g", type: "NAND", position: { x: 0, y: 0 } },
        { id: "y", type: "OUTPUT", position: { x: 0, y: 0 }, label: "Y" },
      ],
      wires: [
        { id: "w1", from: "x2", to: "g", toPort: 0 },
        { id: "w2", from: "x1", to: "g", toPort: 1 },
        { id: "w3", from: "g", to: "y", toPort: 0 },
      ],
    };
    const result = validateAgainstKnownFunction(circuit, "NAND");
    expect(result.matches).toBe(true);
  });
});
