import React, { useState } from 'react';
import { FileText, Copy, Check, Download, X } from 'lucide-react';

interface TechSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdownDoc: string;
  isLoading: boolean;
}

export const TechSpecModal: React.FC<TechSpecModalProps> = ({
  isOpen,
  onClose,
  markdownDoc,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownDoc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownDoc], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture_spec_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 leading-tight">
                System Architecture Specification (ADR &amp; Tech Spec)
              </h3>
              <p className="text-[11px] text-slate-500">
                Auto-generated documentation ready for Notion, Confluence, and GitHub
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

        {/* Body */}
        <div className="flex-1 p-5 overflow-y-auto bg-slate-50 font-mono text-[12px] leading-relaxed text-slate-800">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-sans">
                Synthesizing architectural data dictionary, lifecycle, and threat models...
              </p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-xs bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              {markdownDoc}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-100 bg-white flex items-center justify-between text-[11px] text-slate-500">
          <span>Formatted in clean GitHub Markdown.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={isLoading || !markdownDoc}
              className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={isLoading || !markdownDoc}
              className="flex items-center gap-1 px-3 py-1 bg-[#f08705] hover:bg-[#e07b04] text-white rounded text-xs font-semibold disabled:opacity-40 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

