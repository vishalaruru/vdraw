import React from 'react';
import { History, RotateCcw, Clock, Trash2, X } from 'lucide-react';
import { DiagramVersionSnapshot } from '../types/features';
import { clearAllVersions } from '../services/versionHistory';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DiagramVersionSnapshot[];
  onRestoreVersion: (xml: string) => void;
  onRefreshVersions: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  versions,
  onRestoreVersion,
  onRefreshVersions,
}) => {
  if (!isOpen) return null;

  const handleClear = () => {
    if (confirm('Clear all revision history snapshots?')) {
      clearAllVersions();
      onRefreshVersions();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 leading-tight">
                Revision &amp; Version History
              </h3>
              <p className="text-[11px] text-slate-500">
                Snapshots captured before imports, generations, and edits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshot List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {versions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No version snapshots recorded yet.
            </div>
          ) : (
            versions.map((ver) => (
              <div
                key={ver.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-150 hover:border-slate-300 bg-slate-50/60 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                    {ver.nodeCount}n
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-slate-800">
                      {ver.label}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span>&bull;</span>
                      <span>{ver.nodeCount} shapes</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onRestoreVersion(ver.xml);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 rounded text-[11px] font-semibold text-slate-700 shadow-2xs transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <button
            onClick={handleClear}
            disabled={versions.length === 0}
            className="flex items-center gap-1 text-slate-400 hover:text-rose-600 disabled:opacity-40"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear History</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium text-[12px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

