import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  X,
  Layers,
  ShieldCheck,
  Search,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react';
import { IconMatchItem } from '../services/iconBeautifier';

interface IconBeautifierModalProps {
  isOpen: boolean;
  matches: IconMatchItem[];
  onClose: () => void;
  onApply: (selectedIds: string[]) => void;
}

export const IconBeautifierModal: React.FC<IconBeautifierModalProps> = ({
  isOpen,
  matches,
  onClose,
  onApply,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(matches.map((m) => m.id)));
  const [activeProvider, setActiveProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync selected IDs whenever matches change
  React.useEffect(() => {
    setSelectedIds(new Set(matches.map((m) => m.id)));
  }, [matches]);

  const providers = useMemo(() => {
    const counts = new Map<string, number>();
    matches.forEach((m) => {
      counts.set(m.provider, (counts.get(m.provider) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([provider, count]) => ({
      provider,
      count,
    }));
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (activeProvider !== 'all' && m.provider !== activeProvider) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.originalLabel.toLowerCase().includes(q) ||
          m.matchedTechnology.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [matches, activeProvider, searchQuery]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    setSelectedIds(new Set(matches.map((m) => m.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleApply = () => {
    onApply(Array.from(selectedIds));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Icon Beautifier</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-100 text-purple-700 rounded-full">
                  Official Cloud & Infra Icons
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Replace generic boxes with official AWS, GCP, Azure, Kubernetes, and database stencil icons
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Provider Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => setActiveProvider('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeProvider === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({matches.length})
            </button>
            {providers.map((p) => (
              <button
                key={p.provider}
                type="button"
                onClick={() => setActiveProvider(p.provider)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeProvider === p.provider
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p.provider} ({p.count})
              </button>
            ))}
          </div>

          {/* Quick Select & Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search components..."
                className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-700"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={selectAll}
                className="px-2 py-1 text-[11px] font-medium text-purple-700 hover:bg-purple-50 rounded transition-colors cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="px-6 py-4 overflow-y-auto flex-1 divide-y divide-slate-100">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Layers className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
              <div className="text-sm font-semibold text-slate-600">No components match this filter</div>
              <div className="text-xs text-slate-400 mt-1">Try selecting 'All' or clearing your search query.</div>
            </div>
          ) : (
            filteredMatches.map((item) => {
              const isChecked = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`py-3 px-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-purple-50/40 hover:bg-purple-50/70 border border-purple-200/50'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className="text-purple-600 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(item.id);
                      }}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-purple-600 fill-purple-100" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate" title={item.originalLabel}>
                          {item.originalLabel}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: item.badgeColor }}
                          />
                          <span>{item.matchedTechnology}</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-slate-500">{item.provider}</span>
                        <span>&bull;</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: item.badgeColor }}
                    >
                      {item.provider}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Arrows and layout connections remain 100% undisturbed</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleApply}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:from-purple-800 active:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply {selectedIds.size} Icons</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

