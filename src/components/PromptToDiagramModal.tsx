import React, { useState } from 'react';
import { Sparkles, X, Wand2, ArrowRight } from 'lucide-react';
import { generateDiagramFromPrompt } from '../services/promptDiagramGenerator';

interface PromptToDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertDiagram: (xml: string) => void;
}

export const PromptToDiagramModal: React.FC<PromptToDiagramModalProps> = ({
  isOpen,
  onClose,
  onInsertDiagram,
}) => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const quickPrompts = [
    'AWS Serverless API with CloudFront, API Gateway, Lambda, DynamoDB and S3',
    'User Registration & Verification Flow with Password Hashing and Email OTP',
    'Microservices architecture with Kafka Event Bus, Order Service, and Payment Worker',
    'Kubernetes Cluster with Ingress Controller, App Pods, Redis Cache, and PostgreSQL',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setStatus('generating');
    setErrorMessage('');

    try {
      const { xml } = await generateDiagramFromPrompt(prompt, 'modern-indigo');
      onInsertDiagram(xml);
      setStatus('idle');
      onClose();
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Generation failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#f08705] text-white flex items-center justify-center shadow-xs">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 leading-tight">
                Prompt to Architecture Diagram
              </h3>
              <p className="text-[11px] text-slate-500">
                Describe any cloud system, flowchart, or workflow in plain text
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
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-slate-700">
              What do you want to architect?
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. AWS payment system with Stripe webhook, API Gateway, SQS FIFO queue, Go backend worker, and Aurora PostgreSQL database..."
              className="w-full text-[12px] p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f08705] font-sans resize-none"
            />
          </div>

          {/* Quick Examples */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Ideas (1-Click)
            </div>
            <div className="flex flex-col gap-1.5">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(qp)}
                  className="text-left text-[11px] text-slate-600 hover:text-[#f08705] hover:bg-orange-50/60 p-2 rounded-md border border-slate-100 transition-colors flex items-center justify-between"
                >
                  <span className="truncate">{qp}</span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0 opacity-40 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {status === 'error' && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-[12px] text-slate-600 hover:bg-slate-200 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!prompt.trim() || status === 'generating'}
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#f08705] hover:bg-[#e07b04] active:bg-[#c96e03] text-white rounded-md text-[12px] font-semibold disabled:opacity-50 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{status === 'generating' ? 'Synthesizing...' : 'Generate Diagram'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
