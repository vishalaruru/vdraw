import React, { useState } from 'react';
import { MessagesSquare, Sparkles, X, CornerDownLeft } from 'lucide-react';
import { modifyDiagramWithCopilot } from '../services/diagramCopilot';

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

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!instruction.trim() || isLoading) return;

    setIsLoading(true);
    setLastAction(null);

    try {
      const { xml, explanation } = await modifyDiagramWithCopilot(currentXml, instruction);
      onApplyChanges(xml, explanation);
      setLastAction(explanation);
      setInstruction('');
    } catch (err) {
      console.error(err);
      setLastAction(err instanceof Error ? err.message : 'Copilot edit failed');
    } finally {
      setIsLoading(false);
    }
  };

  const quickCommands = [
    'Add Redis cache before PostgreSQL DB',
    'Put Cloudflare WAF in front of Web Client',
    'Add an SQS queue between API and worker',
    'Add an alert SNS topic for errors',
  ];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[90vw] max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-2xl z-40 p-3 space-y-2.5 animate-in slide-in-from-bottom-3 duration-150">
      <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <MessagesSquare className="w-4 h-4 text-[#f08705]" />
          <span>Conversational Draw &bull; Evolve Architecture via Natural Language</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
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
          placeholder="e.g. Add Redis cache before PostgreSQL, or put an AWS WAF in front..."
          disabled={isLoading}
          className="w-full pl-3 pr-20 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f08705]"
        />
        <button
          type="submit"
          disabled={!instruction.trim() || isLoading}
          className="absolute right-1.5 flex items-center gap-1 px-3 py-1.5 bg-[#f08705] hover:bg-[#e07b04] text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors shadow-2xs"
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
            className="px-2 py-0.5 bg-slate-100 hover:bg-orange-50 hover:text-[#f08705] border border-slate-200 rounded-md text-slate-600 whitespace-nowrap transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {lastAction && (
        <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
          <span className="truncate">{lastAction}</span>
        </div>
      )}
    </div>
  );
};
