import React from 'react';
import { Activity, Square } from 'lucide-react';
import { SimulationMode } from '../services/trafficSimulator';

interface TrafficSimulatorBarProps {
  isActive: boolean;
  mode: SimulationMode;
  onModeChange: (mode: SimulationMode) => void;
  onStop: () => void;
}

export const TrafficSimulatorBar: React.FC<TrafficSimulatorBarProps> = ({
  isActive,
  mode,
  onModeChange,
  onStop,
}) => {
  if (!isActive) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl border border-slate-700/80 z-40 flex items-center gap-3.5 animate-in slide-in-from-top-3 duration-200 text-xs">
      {/* Live Pulsing Dot */}
      <div className="flex items-center gap-2 font-bold tracking-tight">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              mode === 'nominal'
                ? 'bg-emerald-400'
                : mode === 'cache_hit'
                ? 'bg-cyan-400'
                : 'bg-orange-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              mode === 'nominal'
                ? 'bg-emerald-500'
                : mode === 'cache_hit'
                ? 'bg-cyan-500'
                : 'bg-orange-500'
            }`}
          />
        </span>
        <span className="text-[12px] text-slate-100 flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Traffic Flow Simulation Active</span>
        </span>
      </div>

      <div className="h-4 w-[1px] bg-slate-700" />

      {/* Traffic Modes */}
      <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-full border border-slate-700">
        <button
          type="button"
          onClick={() => onModeChange('nominal')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
            mode === 'nominal'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Nominal (100 rps)
        </button>

        <button
          type="button"
          onClick={() => onModeChange('cache_hit')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
            mode === 'cache_hit'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Cache-Hit (1k rps)
        </button>

        <button
          type="button"
          onClick={() => onModeChange('surge')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
            mode === 'surge'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Surge (10k rps)
        </button>
      </div>

      <div className="h-4 w-[1px] bg-slate-700" />

      {/* Stop Button */}
      <button
        type="button"
        onClick={onStop}
        className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-full text-[11px] font-bold shadow-xs transition-colors"
      >
        <Square className="w-3 h-3 fill-white" />
        <span>Stop</span>
      </button>
    </div>
  );
};
