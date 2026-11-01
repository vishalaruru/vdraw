import React from 'react';
import { Flame, Square, AlertOctagon, CheckCircle2, AlertTriangle } from 'lucide-react';
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
  if (!isActive) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-rose-500/50 z-40 flex flex-col md:flex-row items-center gap-3.5 animate-in slide-in-from-top-3 duration-200 text-xs max-w-4xl w-[92vw]">
      {/* Title & Live Status */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center animate-pulse">
          <Flame className="w-4 h-4 fill-white" />
        </div>
        <div>
          <span className="font-bold text-[12px] text-rose-300 flex items-center gap-1.5">
            <span>Chaos Monkey &bull; Blast Radius Simulator</span>
          </span>
          <div className="text-[10px] text-slate-400">Injecting failure to test cascading outages</div>
        </div>
      </div>

      <div className="hidden md:block h-6 w-[1px] bg-slate-700" />

      {/* Target Selector */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-400 font-semibold">Crash Target:</span>
        <select
          value={selectedNodeId}
          onChange={(e) => onSelectNode(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
        >
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label} ({n.type})
            </option>
          ))}
        </select>
      </div>

      {/* Metrics Banner */}
      {result && (
        <div className="flex items-center gap-2 text-[11px] bg-slate-800/90 px-3 py-1 rounded-xl border border-slate-700 flex-1 justify-around">
          <div className="flex items-center gap-1">
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

          <div className="flex items-center gap-1 text-rose-400 font-semibold">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{result.failedNodes.length} Failed</span>
          </div>

          <div className="flex items-center gap-1 text-amber-400 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{result.degradedNodes.length} Degraded</span>
          </div>

          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{result.resilientNodes.length} Resilient</span>
          </div>
        </div>
      )}

      {/* Stop Button */}
      <button
        type="button"
        onClick={onStop}
        className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-colors flex-shrink-0"
      >
        <Square className="w-3 h-3 fill-white" />
        <span>Exit Chaos</span>
      </button>
    </div>
  );
};
