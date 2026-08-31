import { nanoid } from "nanoid";
import type { Circuit, CircuitComponent, GateType, Wire } from "../logic/types";

function c(id: string, type: GateType, x: number, y: number, label?: string, inputValue?: 0 | 1): CircuitComponent {
  return { id, type, position: { x, y }, label, inputValue: type === "INPUT" ? (inputValue ?? 0) : undefined };
}
function w(from: string, to: string, toPort: number): Wire {
  return { id: `wire_${nanoid(6)}`, from, to, toPort };
}

export interface ExampleCircuit {
  id: string;
  name: string;
  description: string;
  build: () => Circuit;
}

const andGate: ExampleCircuit = {
  id: "and-gate",
  name: "AND Gate",
  description: "The simplest circuit: two inputs feeding a single AND gate.",
  build: () => ({
    components: [
      c("a", "INPUT", 0, 0, "A"),
      c("b", "INPUT", 0, 140, "B"),
      c("g", "AND", 260, 70, "AND"),
      c("y", "OUTPUT", 520, 70, "Y"),
    ],
    wires: [w("a", "g", 0), w("b", "g", 1), w("g", "y", 0)],
  }),
};

const xorGate: ExampleCircuit = {
  id: "xor-gate",
  name: "XOR Gate",
  description: "Two inputs feeding a single XOR gate. Output is HIGH only when inputs differ.",
  build: () => ({
    components: [
      c("a", "INPUT", 0, 0, "A"),
      c("b", "INPUT", 0, 140, "B"),
      c("g", "XOR", 260, 70, "XOR"),
      c("y", "OUTPUT", 520, 70, "Y"),
    ],
    wires: [w("a", "g", 0), w("b", "g", 1), w("g", "y", 0)],
  }),
};

const halfAdder: ExampleCircuit = {
  id: "half-adder",
  name: "Half Adder",
  description: "Adds two single bits: Sum = A XOR B, Carry = A AND B.",
  build: () => ({
    components: [
      c("a", "INPUT", 0, 0, "A"),
      c("b", "INPUT", 0, 200, "B"),
      c("xor", "XOR", 300, 20, "XOR"),
      c("and", "AND", 300, 180, "AND"),
      c("sum", "OUTPUT", 600, 20, "Sum"),
      c("carry", "OUTPUT", 600, 180, "Carry"),
    ],
    wires: [w("a", "xor", 0), w("b", "xor", 1), w("a", "and", 0), w("b", "and", 1), w("xor", "sum", 0), w("and", "carry", 0)],
  }),
};

const fullAdder: ExampleCircuit = {
  id: "full-adder",
  name: "Full Adder",
  description: "Adds two bits plus a carry-in: built from two half adders and an OR gate.",
  build: () => ({
    components: [
      c("a", "INPUT", 0, 0, "A"),
      c("b", "INPUT", 0, 160, "B"),
      c("cin", "INPUT", 0, 340, "Cin"),
      c("xor1", "XOR", 260, 40, "XOR 1"),
      c("and1", "AND", 260, 200, "AND 1"),
      c("xor2", "XOR", 520, 40, "XOR 2"),
      c("and2", "AND", 520, 200, "AND 2"),
      c("or1", "OR", 780, 260, "OR"),
      c("sum", "OUTPUT", 900, 40, "Sum"),
      c("cout", "OUTPUT", 1040, 260, "Cout"),
    ],
    wires: [
      w("a", "xor1", 0),
      w("b", "xor1", 1),
      w("a", "and1", 0),
      w("b", "and1", 1),
      w("xor1", "xor2", 0),
      w("cin", "xor2", 1),
      w("xor1", "and2", 0),
      w("cin", "and2", 1),
      w("and1", "or1", 0),
      w("and2", "or1", 1),
      w("xor2", "sum", 0),
      w("or1", "cout", 0),
    ],
  }),
};

const mux2to1: ExampleCircuit = {
  id: "mux-2to1",
  name: "2:1 Multiplexer",
  description: "Selects between A and B based on Sel: Y = Sel ? B : A.",
  build: () => ({
    components: [
      c("a", "INPUT", 0, 0, "A"),
      c("b", "INPUT", 0, 160, "B"),
      c("sel", "INPUT", 0, 320, "Sel"),
      c("notsel", "NOT", 260, 320, "NOT"),
      c("and1", "AND", 520, 40, "AND 1"),
      c("and2", "AND", 520, 200, "AND 2"),
      c("or1", "OR", 780, 120, "OR"),
      c("y", "OUTPUT", 1040, 120, "Y"),
    ],
    wires: [
      w("sel", "notsel", 0),
      w("a", "and1", 0),
      w("notsel", "and1", 1),
      w("b", "and2", 0),
      w("sel", "and2", 1),
      w("and1", "or1", 0),
      w("and2", "or1", 1),
      w("or1", "y", 0),
    ],
  }),
};

const decoder2to4: ExampleCircuit = {
  id: "decoder-2to4",
  name: "2-to-4 Decoder",
  description: "Two select bits A,B activate exactly one of four outputs Y0..Y3.",
  build: () => ({
    components: [
      c("a", "INPUT", 0, 100, "A"),
      c("b", "INPUT", 0, 300, "B"),
      c("nota", "NOT", 260, 40, "NOT A"),
      c("notb", "NOT", 260, 360, "NOT B"),
      c("y0", "AND", 560, 0, "AND (Y0)"),
      c("y1", "AND", 560, 160, "AND (Y1)"),
      c("y2", "AND", 560, 320, "AND (Y2)"),
      c("y3", "AND", 560, 480, "AND (Y3)"),
      c("out0", "OUTPUT", 860, 0, "Y0"),
      c("out1", "OUTPUT", 860, 160, "Y1"),
      c("out2", "OUTPUT", 860, 320, "Y2"),
      c("out3", "OUTPUT", 860, 480, "Y3"),
    ],
    wires: [
      w("a", "nota", 0),
      w("b", "notb", 0),
      // Y0 = notA . notB
      w("nota", "y0", 0),
      w("notb", "y0", 1),
      // Y1 = notA . B
      w("nota", "y1", 0),
      w("b", "y1", 1),
      // Y2 = A . notB
      w("a", "y2", 0),
      w("notb", "y2", 1),
      // Y3 = A . B
      w("a", "y3", 0),
      w("b", "y3", 1),
      w("y0", "out0", 0),
      w("y1", "out1", 0),
      w("y2", "out2", 0),
      w("y3", "out3", 0),
    ],
  }),
};

export const EXAMPLES: ExampleCircuit[] = [andGate, xorGate, halfAdder, fullAdder, mux2to1, decoder2to4];

export function getExample(id: string): ExampleCircuit | undefined {
  return EXAMPLES.find((e) => e.id === id);
}
