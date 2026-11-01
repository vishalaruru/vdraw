import React, { useState } from 'react';
import { Cloud, Layers, Plus, Search, X } from 'lucide-react';
import { CLOUD_COMPONENTS, CloudComponentItem } from '../services/cloudComponents';

interface CloudComponentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComponent: (comp: CloudComponentItem) => void;
}

export const CloudComponentDrawer: React.FC<CloudComponentDrawerProps> = ({
  isOpen,
  onClose,
  onSelectComponent,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const providers = ['All', 'AWS', 'GCP', 'Azure', 'Kubernetes', 'Database', 'DevOps'];

  const filtered = CLOUD_COMPONENTS.filter((c) => {
    const matchesProvider = selectedProvider === 'All' || c.provider === selectedProvider;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.defaultLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvider && matchesSearch;
  });

  return (
    <div className="fixed top-14 right-0 bottom-0 w-84 bg-white border-l border-slate-200 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">Cloud Components</h3>
            <p className="text-[10px] text-slate-500">Click to append to canvas</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search AWS, GCP, Azure, K8s..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Provider Tabs */}
      <div className="flex overflow-x-auto gap-1 p-2 border-b border-slate-100 bg-slate-50/50 text-[11px] scrollbar-none">
        {providers.map((p) => (
          <button
            key={p}
            onClick={() => setSelectedProvider(p)}
            className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
              selectedProvider === p
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Component Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
          {filtered.length} World-Class Components
        </div>

        <div className="grid grid-cols-1 gap-2">
          {filtered.map((comp) => (
            <button
              key={comp.id}
              onClick={() => onSelectComponent(comp)}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] text-white shadow-xs flex-shrink-0"
                  style={{ backgroundColor: comp.badgeColor }}
                >
                  {comp.provider === 'Kubernetes' ? 'K8s' : comp.provider.substring(0, 3)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {comp.name}
                  </div>
                  <div className="text-[10px] text-slate-400">{comp.provider} &bull; Component</div>
                </div>
              </div>

              <div className="w-6 h-6 rounded-md bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-indigo-500" />
        <span>Canvas auto-expands & appends down smoothly.</span>
      </div>
    </div>
  );
};

