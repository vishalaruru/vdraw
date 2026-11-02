import React, { useState, useMemo } from 'react';
import { MessagesSquare, X, CornerDownLeft, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { modifyDiagramWithCopilot } from '../services/diagramCopilot';
import { parseDrawioXmlToDiagram } from '../services/diagramXmlParser';

interface DiagramCopilotBarProps {
  isOpen: boolean;
  onClose: () => void;
  currentXml: string;
  onApplyChanges: (newXml: string, summary: string) => void;
}

export const DiagramCopilotBar: React.FC<DiagramCopilotBarProps> = ({
  isOpen,
  onClose,
  currentXml,
  onApplyChanges,
}) => {
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  // Compute live diagram stats
  const diagramStats = useMemo(() => {
    if (!currentXml) return { nodes: 0, edges: 0 };
    const d = parseDrawioXmlToDiagram(currentXml);
    return { nodes: d.nodes.length, edges: d.edges.length };
  }, [currentXml]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!instruction.trim() || isLoading) return;

    setIsLoading(true);
    setLastAction(null);
    setIsSuccess(null);

    try {
      const { xml, explanation } = await modifyDiagramWithCopilot(currentXml, instruction);
      onApplyChanges(xml, explanation);
      setLastAction(explanation);
      setIsSuccess(true);
      setInstruction('');
    } catch (err) {
      console.error(err);
      setLastAction(err instanceof Error ? err.message : 'Copilot edit failed');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const quickCommands = [
    'Rename Pre MEL Parser to Ingest Parser',
    'Move Ingest below Producers',
    'Add Config below MFL Service',
    'Connect Media Availability API to FIBA Mapper API',
    'Distribute horizontally',
    'Auto-align & beautify',
  ];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[92vw] max-w-3xl bg-white/98 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-2xl z-40 p-3.5 space-y-2.5 animate-in slide-in-from-bottom-3 duration-150">
      <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-2xs">
            <MessagesSquare className="w-3.5 h-3.5" />
          </div>
          <span>Conversational Draw &bull; Evolve Architecture via Natural Language</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-[10px] flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            {diagramStats.nodes} components, {diagramStats.edges} flows
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. 'Add Config below MFL Service', 'Add Redis cache between Gateway and DB', 'Put Cloudflare in front'..."
          disabled={isLoading}
          className="w-full pl-3.5 pr-24 py-2.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium text-slate-800 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!instruction.trim() || isLoading}
          className="absolute right-1.5 flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-all shadow-sm cursor-pointer"
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Apply</span>
              <CornerDownLeft className="w-3 h-3" />
            </>
          )}
        </button>
      </form>

      {/* Quick Suggestions */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] scrollbar-none pt-0.5">
        <span className="text-slate-400 font-bold uppercase tracking-wider flex-shrink-0">
          Try:
        </span>
        {quickCommands.map((cmd, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInstruction(cmd)}
            className="px-2.5 py-1 bg-slate-50 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200 rounded-lg text-slate-600 whitespace-nowrap transition-colors cursor-pointer font-medium"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Status Feedback */}
      {lastAction && (
        <div
          className={`text-[11px] p-2 rounded-xl flex items-center gap-2 border animate-in fade-in duration-100 ${
            isSuccess
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/80 border-rose-200 text-rose-800'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span className="font-medium truncate">{lastAction}</span>
        </div>
      )}
    </div>
  );
};
