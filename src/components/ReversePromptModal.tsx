import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  X,
  Play,
  RotateCw,
  GitFork,
  FileCode,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ArchitecturePromptResult,
  generateReversePromptFromDiagram,
} from '../services/architectureToPrompt';
import { generateDiagramFromPrompt } from '../services/promptDiagramGenerator';

interface ReversePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  xml: string;
  onInsertDiagram: (xml: string, mode: 'replace' | 'merge') => void;
}

export const ReversePromptModal: React.FC<ReversePromptModalProps> = ({
  isOpen,
  onClose,
  xml,
  onInsertDiagram,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'spec' | 'mermaid'>('prompt');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ArchitecturePromptResult | null>(null);
  const [editablePrompt, setEditablePrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [reSynthesizing, setReSynthesizing] = useState(false);
  const [resynthesizeStatus, setResynthesizeStatus] = useState<string | null>(null);

  const fetchPrompt = async () => {
    setIsLoading(true);
    setResynthesizeStatus(null);
    try {
      const res = await generateReversePromptFromDiagram(xml);
      setResult(res);
      setEditablePrompt(res.reconstructionPrompt);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPrompt();
    }
  }, [isOpen, xml]);

  if (!isOpen) return null;

  const currentContent =
    activeTab === 'prompt'
      ? editablePrompt
      : activeTab === 'spec'
      ? result?.systemSpecMarkdown || ''
      : result?.mermaidSyntax || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = activeTab === 'mermaid' ? 'mmd' : 'md';
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result?.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'architecture_prompt'}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTestReSynthesize = async () => {
    if (!editablePrompt.trim()) return;

    setReSynthesizing(true);
    setResynthesizeStatus('Synthesizing diagram layout from prompt...');

    try {
      const { xml: generatedXml } = await generateDiagramFromPrompt(
        editablePrompt,
        'modern-indigo'
      );
      onInsertDiagram(generatedXml, 'replace');
      setResynthesizeStatus('Success! Architecture re-synthesized on canvas.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setResynthesizeStatus(
        err instanceof Error ? `Failed: ${err.message}` : 'Failed to re-synthesize diagram'
      );
    } finally {
      setReSynthesizing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-purple-50/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-slate-900 leading-tight">
                  Architecture → AI Prompt (Reverse Engineering)
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-purple-100 text-purple-700 uppercase tracking-wider">
                  {result?.isAiGenerated ? 'Gemini AI Synthesized' : 'Deterministic Engine'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Generate reproducible, unambiguous natural language prompts & specifications from canvas nodes & data flows
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPrompt}
              disabled={isLoading}
              title="Regenerate from canvas"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats & Title Bar */}
        {result && (
          <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[12px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-slate-800 truncate">{result.title}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 truncate text-[11px] hidden sm:inline">{result.summary}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200/60 text-blue-700 font-semibold text-[11px]">
                {result.nodeCount} Components
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200/60 text-emerald-700 font-semibold text-[11px]">
                {result.edgeCount} Data Hops
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200/60 text-amber-700 font-semibold text-[11px]">
                {result.tiers.length} Tiers
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3 py-2 text-[12px] font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'prompt'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Generator Prompt
            </button>
            <button
              onClick={() => setActiveTab('spec')}
              className={`px-3 py-2 text-[12px] font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'spec'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              System Spec (RFC)
            </button>
            <button
              onClick={() => setActiveTab('mermaid')}
              className={`px-3 py-2 text-[12px] font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'mermaid'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              Mermaid Flowchart
            </button>
          </div>

          <div className="flex items-center gap-2 pb-1.5">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 min-h-[320px]">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-[12px] font-medium text-slate-600">
                Analyzing canvas topology, classifying components & synthesizing prompt...
              </p>
            </div>
          ) : activeTab === 'prompt' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  Reproducible AI Generation Prompt (Editable)
                </span>
                <span className="text-[11px] text-slate-400">
                  Paste this into any LLM or click 'Test & Re-Synthesize' below
                </span>
              </div>
              <textarea
                value={editablePrompt}
                onChange={(e) => setEditablePrompt(e.target.value)}
                rows={12}
                className="w-full p-4 rounded-xl border border-slate-200 bg-white font-mono text-[12px] text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-y shadow-xs"
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs overflow-x-auto">
              <pre className="font-mono text-[12px] text-slate-800 whitespace-pre-wrap leading-relaxed">
                {currentContent}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {resynthesizeStatus && (
              <div className="flex items-center gap-1.5 text-[12px]">
                {resynthesizeStatus.startsWith('Success') ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : resynthesizeStatus.startsWith('Failed') ? (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                ) : (
                  <RotateCw className="w-4 h-4 text-purple-600 animate-spin" />
                )}
                <span
                  className={
                    resynthesizeStatus.startsWith('Success')
                      ? 'text-emerald-700 font-semibold'
                      : resynthesizeStatus.startsWith('Failed')
                      ? 'text-rose-700 font-semibold'
                      : 'text-slate-600'
                  }
                >
                  {resynthesizeStatus}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 text-[12px] font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleTestReSynthesize}
              disabled={reSynthesizing || !editablePrompt.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[12px] font-bold shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${reSynthesizing ? 'animate-pulse' : ''}`} />
              <span>{reSynthesizing ? 'Synthesizing...' : 'Test & Re-Synthesize on Canvas'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
