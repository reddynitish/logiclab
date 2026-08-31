import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useReactFlow,
  type OnConnect,
  type NodeMouseHandler,
  type OnNodeDrag,
  type EdgeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCircuitStore } from "../store/circuitStore";
import { simulate } from "../logic/simulator";
import { nodeTypes } from "./nodes";
import type { LogicFlowNode } from "./nodes/nodeData";
import { WireEdge, type WireFlowEdge } from "./WireEdge";
import type { GateType } from "../logic/types";
import "./Canvas.css";

const edgeTypes = { wire: WireEdge };

function CanvasInner() {
  const circuit = useCircuitStore((s) => s.circuit);
  const selectedId = useCircuitStore((s) => s.selectedId);
  const exampleName = useCircuitStore((s) => s.exampleName);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const sim = useMemo(() => simulate(circuit), [circuit]);

  const nodes: LogicFlowNode[] = useMemo(
    () =>
      circuit.components.map((c) => ({
        id: c.id,
        type: "logic",
        position: c.position,
        selected: c.id === selectedId,
        data: {
          gateType: c.type,
          label: c.label,
          value: sim.values[c.id] ?? 0,
          aiTouched: c.aiTouched,
          highlighted: c.highlighted,
          highlightReason: c.highlightReason,
        },
      })),
    [circuit.components, sim.values, selectedId],
  );

  const edges: WireFlowEdge[] = useMemo(
    () =>
      circuit.wires.map((w) => ({
        id: w.id,
        type: "wire",
        source: w.from,
        target: w.to,
        targetHandle: `in${w.toPort}`,
        sourceHandle: "out",
        selected: w.id === selectedId,
        data: {
          high: sim.wireValues[w.id] === 1,
          aiTouched: w.aiTouched,
          highlighted: w.highlighted,
          highlightReason: w.highlightReason,
        },
      })),
    [circuit.wires, sim.wireValues, selectedId],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  const onConnect = useCallback<OnConnect>(
    (connection) => {
      const { source, target, targetHandle } = connection;
      if (!source || !target || !targetHandle) return;
      const toPort = Number(targetHandle.replace("in", ""));
      const result = useCircuitStore.getState().connect(source, target, toPort);
      if (!result.ok && result.error) showToast(result.error);
    },
    [showToast],
  );

  const onNodeDragStop = useCallback<OnNodeDrag<LogicFlowNode>>((_event, node) => {
    useCircuitStore.getState().updateComponent(node.id, { position: node.position });
  }, []);

  const onNodeClick = useCallback<NodeMouseHandler<LogicFlowNode>>((_event, node) => {
    useCircuitStore.getState().select(node.id);
  }, []);

  const onEdgeClick = useCallback<EdgeMouseHandler<WireFlowEdge>>((_event, edge) => {
    useCircuitStore.getState().select(edge.id);
  }, []);

  const onPaneClick = useCallback(() => {
    useCircuitStore.getState().select(null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/logiclab-gate-type") as GateType | "";
      if (!type) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = useCircuitStore.getState().addComponent(type, position);
      useCircuitStore.getState().select(id);
    },
    [screenToFlowPosition],
  );

  // fitView on mount and whenever a whole new circuit is loaded (example picker or
  // an agent calling load_example) — not on every incremental edit.
  useEffect(() => {
    const id = window.setTimeout(() => fitView({ duration: 300, padding: 0.2 }), 50);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exampleName]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const state = useCircuitStore.getState();
      if (!state.selectedId) return;
      e.preventDefault();
      if (state.circuit.components.some((c) => c.id === state.selectedId)) {
        state.removeComponent(state.selectedId);
      } else if (state.circuit.wires.some((w) => w.id === state.selectedId)) {
        state.disconnect(state.selectedId);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="lab-canvas" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow<LogicFlowNode, WireFlowEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        deleteKeyCode={null}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={22} size={1.5} color="var(--bg-canvas-grid)" />
        <Controls />
      </ReactFlow>
      {toast && (
        <div className="lab-canvas__toast" role="alert">
          {toast}
        </div>
      )}
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
