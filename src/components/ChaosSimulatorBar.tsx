import React, { useState, useRef, useEffect } from 'react';
import { Flame, Square, AlertOctagon, CheckCircle2, AlertTriangle, GripVertical } from 'lucide-react';
import { BlastRadiusResult } from '../services/chaosSimulator';
import { ParsedTopologyNode } from '../services/architectureAuditor';

interface ChaosSimulatorBarProps {
  isActive: boolean;
  nodes: ParsedTopologyNode[];
  selectedNodeId: string;
  result: BlastRadiusResult | null;
  onSelectNode: (nodeId: string) => void;
  onStop: () => void;
}

export const ChaosSimulatorBar: React.FC<ChaosSimulatorBarProps> = ({
  isActive,
  nodes,
  selectedNodeId,
  result,
  onSelectNode,
  onStop,
}) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number } | null>(null);

  useEffect(() => {
    if (!isActive) {
      setPos(null);
    }
  }, [isActive]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('select, button, a, input, option')) return;

    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: rect.left,
      elemY: rect.top,
    };
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.mouseX;
      const dy = moveEvent.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(12, Math.min(window.innerWidth - 220, dragStartRef.current.elemX + dx));
      const newY = Math.max(12, Math.min(window.innerHeight - 80, dragStartRef.current.elemY + dy));
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!isActive) return null;

  // Filter out any empty, non-standard, or container entries for clean dropdown display
  const validNodes = nodes.filter(
    (n) => !n.isContainer && n.type !== 'container' && (n.label || '').trim().length > 0
  );

  const containerStyle: React.CSSProperties = pos
    ? {
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: 'none',
        zIndex: 50,
      }
    : {
        position: 'fixed',
        top: '48px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
      };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={containerStyle}
      className={`bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl shadow-2xl border border-rose-500/50 flex flex-wrap md:flex-nowrap items-center gap-2.5 animate-in slide-in-from-top-3 duration-200 text-xs w-auto max-w-[95vw] shrink-0 select-none ${
        isDragging ? 'cursor-grabbing ring-2 ring-rose-400' : 'cursor-grab'
      }`}
      title="Drag to reposition widget anywhere on canvas"
    >
      {/* Drag Grip Handle */}
      <div className="text-slate-500 hover:text-slate-300 transition-colors cursor-grab p-0.5 shrink-0" title="Drag widget">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Title & Live Status */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center animate-pulse">
          <Flame className="w-3.5 h-3.5 fill-white" />
        </div>
        <div className="leading-tight">
          <span className="font-bold text-[11px] text-rose-300 flex items-center gap-1">
            <span>Chaos Simulator</span>
          </span>
          <div className="text-[9px] text-slate-400">Blast radius analysis</div>
        </div>
      </div>

      <div className="hidden sm:block h-5 w-[1px] bg-slate-700 shrink-0" />

      {/* Target Selector */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] text-slate-400 font-semibold shrink-0">Target:</span>
        <select
          value={selectedNodeId}
          onChange={(e) => onSelectNode(e.target.value)}
          className="w-36 sm:w-44 max-w-[190px] bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium truncate shrink-0 cursor-pointer"
          title={validNodes.find((n) => n.id === selectedNodeId)?.label || 'Select crash target'}
        >
          {validNodes.map((n) => {
            const clean = (n.label || '').replace(/[\r\n\t]+/g, ' ').trim();
            const truncated = clean.length > 20 ? clean.slice(0, 18) + '…' : clean;
            return (
              <option key={n.id} value={n.id} title={`${clean} (${n.type})`}>
                {truncated} ({n.type})
              </option>
            );
          })}
        </select>
      </div>

      {/* Metrics Banner */}
      {result && (
        <div className="flex items-center gap-2.5 text-[11px] bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700 shrink-0">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-400">Impact:</span>
            <span
              className={`font-black ${
                result.impactPercentage > 60
                  ? 'text-rose-400'
                  : result.impactPercentage > 30
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {result.impactPercentage}%
            </span>
          </div>

          <div className="flex items-center gap-1 text-rose-400 font-semibold shrink-0" title={`${result.failedNodes.length} Failed`}>
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{result.failedNodes.length} Fail</span>
          </div>

          <div className="flex items-center gap-1 text-amber-400 font-semibold shrink-0" title={`${result.degradedNodes.length} Degraded`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{result.degradedNodes.length} Degr</span>
          </div>

          <div className="flex items-center gap-1 text-emerald-400 font-semibold shrink-0" title={`${result.resilientNodes.length} Resilient`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{result.resilientNodes.length} Safe</span>
          </div>
        </div>
      )}

      {/* Stop Button */}
      <button
        type="button"
        onClick={onStop}
        className="flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shrink-0 ml-auto cursor-pointer"
        title="Exit Chaos Simulation and restore original styling"
      >
        <Square className="w-3 h-3 fill-white" />
        <span>Exit</span>
      </button>
    </div>
  );
};