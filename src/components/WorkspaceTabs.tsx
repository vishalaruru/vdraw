import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, FileText, Pencil } from 'lucide-react';
import { DiagramTab } from '../types/features';

interface WorkspaceTabsProps {
  tabs: DiagramTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onNewTab: () => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
  onRenameTab?: (id: string, newTitle: string) => void;
  className?: string;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onNewTab,
  onCloseTab,
  onRenameTab,
  className = '',
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  const handleStartRename = (tab: DiagramTab, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTabId(tab.id);
    setEditingTitle(tab.title);
  };

  const handleCommitRename = (id: string) => {
    const trimmed = editingTitle.trim();
    if (trimmed && onRenameTab) {
      onRenameTab(id, trimmed);
    }
    setEditingTabId(null);
  };

  const handleKeyDown = (id: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommitRename(id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingTabId(null);
    }
  };

  return (
    <div className={`flex items-center gap-1 overflow-x-auto select-none scrollbar-none ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isEditing = editingTabId === tab.id;

        return (
          <div
            key={tab.id}
            onClick={() => {
              if (!isEditing) onSelectTab(tab.id);
            }}
            onDoubleClick={(e) => handleStartRename(tab, e)}
            title={isEditing ? 'Editing name...' : `${tab.title} (Double-click to rename)`}
            className={`group h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[11px] font-medium cursor-pointer transition-all border shrink-0 ${
              isActive
                ? 'bg-white border-slate-300 text-slate-900 shadow-2xs font-semibold'
                : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-200/60 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3 h-3 text-[#f08705] flex-shrink-0" />

            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => handleCommitRename(tab.id)}
                onKeyDown={(e) => handleKeyDown(tab.id, e)}
                onClick={(e) => e.stopPropagation()}
                className="h-5 px-1 text-[11px] font-semibold bg-white border border-[#f08705] rounded text-slate-900 outline-none w-[110px] shadow-2xs"
              />
            ) : (
              <span className="truncate max-w-[130px]">{tab.title}</span>
            )}

            {/* Quick Rename Pencil on Hover */}
            {!isEditing && (
              <button
                type="button"
                onClick={(e) => handleStartRename(tab, e)}
                title="Rename diagram tab"
                className="w-3.5 h-3.5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-slate-200 text-slate-400 hover:text-[#f08705] transition-opacity"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
            )}

            {/* Close Tab Button */}
            {tabs.length > 1 && !isEditing && (
              <button
                type="button"
                onClick={(e) => onCloseTab(tab.id, e)}
                title="Close diagram tab"
                className="w-3.5 h-3.5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-slate-200 text-slate-400 hover:text-rose-600 transition-opacity ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        );
      })}

      {/* New Tab Button */}
      <button
        type="button"
        onClick={onNewTab}
        title="Create new diagram tab"
        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition-colors ml-0.5 shrink-0 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};



