import React, { useState, useEffect, useRef } from 'react';
import { Search, Command } from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'AI & Analysis' | 'Simulation & IaC' | 'Documentation' | 'Canvas & Export' | 'History';
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = commands.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.subtitle.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-100 flex items-center gap-3 bg-white">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search action (e.g. Audit, Auto-Align, Traffic, IaC)..."
            className="flex-1 text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-500 font-mono">
            ESC
          </kbd>
        </div>

        {/* Command Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                  selectedIndex === idx
                    ? 'bg-orange-50/80 text-slate-900 border border-orange-200/60'
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      selectedIndex === idx
                        ? 'bg-[#f08705] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold leading-tight">{item.title}</div>
                    <div className="text-[10px] text-slate-400">{item.subtitle}</div>
                  </div>
                </div>

                {item.shortcut && (
                  <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-500 font-mono shadow-2xs">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">↵</kbd> Execute
            </span>
          </div>
          <span className="font-medium text-slate-500 flex items-center gap-1">
            <Command className="w-3 h-3 text-[#f08705]" /> Vdraw Power Architect Palette
          </span>
        </div>
      </div>
    </div>
  );
};
