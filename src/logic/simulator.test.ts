import { describe, expect, it } from "vitest";
import type { Bit, Circuit, GateType } from "./types";
import { generateTruthTable, simulate } from "./simulator";

function comp(id: string, type: GateType, inputValue?: Bit) {
  return { id, type, position: { x: 0, y: 0 }, inputValue };
}
function wire(id: string, from: string, to: string, toPort: number) {
  return { id, from, to, toPort };
}

/** Builds a single binary-gate circuit: IN_A, IN_B -> GATE -> OUT. */
function binaryGateCircuit(type: GateType): Circuit {
  return {
    components: [comp("a", "INPUT"), comp("b", "INPUT"), comp("g", type), comp("out", "OUTPUT")],
    wires: [wire("w1", "a", "g", 0), wire("w2", "b", "g", 1), wire("w3", "g", "out", 0)],
  };
}

function unaryGateCircuit(type: GateType): Circuit {
  return {
    components: [comp("a", "INPUT"), comp("g", type), comp("out", "OUTPUT")],
    wires: [wire("w1", "a", "g", 0), wire("w2", "g", "out", 0)],
  };
}

function run(circuit: Circuit, inputs: Record<string, Bit>): Bit {
  const patched: Circuit = {
    components: circuit.components.map((c) =>
      c.type === "INPUT" ? { ...c, inputValue: inputs[c.id] } : c,
    ),
    wires: circuit.wires,
  };
  return simulate(patched).values["out"];
}

describe("basic gates", () => {
  it("AND", () => {
    const c = binaryGateCircuit("AND");
    expect(run(c, { a: 0, b: 0 })).toBe(0);
    expect(run(c, { a: 0, b: 1 })).toBe(0);
    expect(run(c, { a: 1, b: 0 })).toBe(0);
    expect(run(c, { a: 1, b: 1 })).toBe(1);
  });

  it("OR", () => {
    const c = binaryGateCircuit("OR");
    expect(run(c, { a: 0, b: 0 })).toBe(0);
    expect(run(c, { a: 0, b: 1 })).toBe(1);
    expect(run(c, { a: 1, b: 0 })).toBe(1);
    expect(run(c, { a: 1, b: 1 })).toBe(1);
  });

  it("NOT", () => {
    const c = unaryGateCircuit("NOT");
    expect(run(c, { a: 0 })).toBe(1);
    expect(run(c, { a: 1 })).toBe(0);
  });

  it("XOR", () => {
    const c = binaryGateCircuit("XOR");
    expect(run(c, { a: 0, b: 0 })).toBe(0);
    expect(run(c, { a: 0, b: 1 })).toBe(1);
    expect(run(c, { a: 1, b: 0 })).toBe(1);
    expect(run(c, { a: 1, b: 1 })).toBe(0);
  });

  it("NAND", () => {
    const c = binaryGateCircuit("NAND");
    expect(run(c, { a: 0, b: 0 })).toBe(1);
    expect(run(c, { a: 0, b: 1 })).toBe(1);
    expect(run(c, { a: 1, b: 0 })).toBe(1);
    expect(run(c, { a: 1, b: 1 })).toBe(0);
  });

  it("NOR", () => {
    const c = binaryGateCircuit("NOR");
    expect(run(c, { a: 0, b: 0 })).toBe(1);
    expect(run(c, { a: 0, b: 1 })).toBe(0);
    expect(run(c, { a: 1, b: 0 })).toBe(0);
    expect(run(c, { a: 1, b: 1 })).toBe(0);
  });
});

/** A XOR B = Sum, A AND B = Carry */
function halfAdder(): Circuit {
  return {
    components: [
      comp("a", "INPUT"),
      comp("b", "INPUT"),
      comp("xor", "XOR"),
      comp("and", "AND"),
      comp("sum", "OUTPUT"),
      comp("carry", "OUTPUT"),
    ],
    wires: [
      wire("w1", "a", "xor", 0),
      wire("w2", "b", "xor", 1),
      wire("w3", "a", "and", 0),
      wire("w4", "b", "and", 1),
      wire("w5", "xor", "sum", 0),
      wire("w6", "and", "carry", 0),
    ],
  };
}

describe("half adder", () => {
  const table: [Bit, Bit, Bit, Bit][] = [
    [0, 0, 0, 0],
    [0, 1, 1, 0],
    [1, 0, 1, 0],
    [1, 1, 0, 1],
  ];

  it.each(table)("A=%i B=%i -> Sum=%i Carry=%i", (a, b, sum, carry) => {
    const result = simulate({
      components: halfAdder().components.map((c) =>
        c.id === "a" ? { ...c, inputValue: a } : c.id === "b" ? { ...c, inputValue: b } : c,
      ),
      wires: halfAdder().wires,
    });
    expect(result.values["sum"]).toBe(sum);
    expect(result.values["carry"]).toBe(carry);
    expect(result.issues).toHaveLength(0);
  });
});

/** Sum = A xor B xor Cin, Cout = (A and B) or (Cin and (A xor B)), built from two half adders + OR. */
function fullAdder(): Circuit {
  return {
    components: [
      comp("a", "INPUT"),
      comp("b", "INPUT"),
      comp("cin", "INPUT"),
      comp("xor1", "XOR"),
      comp("and1", "AND"),
      comp("xor2", "XOR"),
      comp("and2", "AND"),
      comp("or1", "OR"),
      comp("sum", "OUTPUT"),
      comp("cout", "OUTPUT"),
    ],
    wires: [
      wire("w1", "a", "xor1", 0),
      wire("w2", "b", "xor1", 1),
      wire("w3", "a", "and1", 0),
      wire("w4", "b", "and1", 1),
      wire("w5", "xor1", "xor2", 0),
      wire("w6", "cin", "xor2", 1),
      wire("w7", "xor1", "and2", 0),
      wire("w8", "cin", "and2", 1),
      wire("w9", "and1", "or1", 0),
      wire("w10", "and2", "or1", 1),
      wire("w11", "xor2", "sum", 0),
      wire("w12", "or1", "cout", 0),
    ],
  };
}

describe("full adder", () => {
  const table: [Bit, Bit, Bit, Bit, Bit][] = [
    [0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0],
    [0, 1, 0, 1, 0],
    [0, 1, 1, 0, 1],
    [1, 0, 0, 1, 0],
    [1, 0, 1, 0, 1],
    [1, 1, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ];

  it.each(table)("A=%i B=%i Cin=%i -> Sum=%i Cout=%i", (a, b, cin, sum, cout) => {
    const base = fullAdder();
    const result = simulate({
      components: base.components.map((c) =>
        c.id === "a"
          ? { ...c, inputValue: a }
          : c.id === "b"
            ? { ...c, inputValue: b }
            : c.id === "cin"
              ? { ...c, inputValue: cin }
              : c,
      ),
      wires: base.wires,
    });
    expect(result.values["sum"]).toBe(sum);
    expect(result.values["cout"]).toBe(cout);
  });
});

describe("wiring problems are reported, never guessed", () => {
  it("detects a feedback cycle instead of infinite-looping", () => {
    const circuit: Circuit = {
      components: [comp("g1", "AND"), comp("g2", "NOT")],
      wires: [wire("w1", "g1", "g2", 0), wire("w2", "g2", "g1", 0)],
    };
    const result = simulate(circuit);
    expect(result.issues.some((i) => i.type === "cycle")).toBe(true);
  });

  it("flags a floating input and treats it as LOW", () => {
    const circuit: Circuit = {
      components: [comp("a", "INPUT", 1), comp("g", "AND"), comp("out", "OUTPUT")],
      wires: [wire("w1", "a", "g", 0), wire("w2", "g", "out", 0)],
    };
    const result = simulate(circuit);
    expect(result.issues.some((i) => i.type === "floating-input")).toBe(true);
    expect(result.values["out"]).toBe(0);
  });

  it("flags two wires driving the same input port", () => {
    const circuit: Circuit = {
      components: [comp("a", "INPUT", 1), comp("b", "INPUT", 0), comp("g", "AND"), comp("out", "OUTPUT")],
      wires: [
        wire("w1", "a", "g", 0),
        wire("w2", "b", "g", 0),
        wire("w3", "g", "out", 0),
      ],
    };
    const result = simulate(circuit);
    expect(result.issues.some((i) => i.type === "multiple-drivers")).toBe(true);
  });
});

describe("generateTruthTable", () => {
  it("produces all 4 rows for a 2-input circuit and matches XOR", () => {
    const c = binaryGateCircuit("XOR");
    const table = generateTruthTable(c);
    expect(table.rows).toHaveLength(4);
    for (const row of table.rows) {
      const expected = row.inputs["a"] !== row.inputs["b"] ? 1 : 0;
      expect(row.outputs["out"]).toBe(expected);
    }
  });

  it("produces all 8 rows for the full adder", () => {
    const table = generateTruthTable(fullAdder());
    expect(table.rows).toHaveLength(8);
  });
});

export { binaryGateCircuit, unaryGateCircuit, halfAdder, fullAdder };
