import React, { useState } from 'react';
import { Code2, Copy, Check, X, FileTerminal, Box } from 'lucide-react';
import { generateMermaidJs, generateTerraform, generateDockerCompose } from '../services/codeGenerators';

interface ExportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  xml: string;
}

export const ExportCodeModal: React.FC<ExportCodeModalProps> = ({ isOpen, onClose, xml }) => {
  const [activeTab, setActiveTab] = useState<'mermaid' | 'terraform' | 'docker'>('mermaid');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getCode = () => {
    switch (activeTab) {
      case 'mermaid':
        return generateMermaidJs(xml);
      case 'terraform':
        return generateTerraform(xml);
      case 'docker':
        return generateDockerCompose(xml);
    }
  };

  const codeContent = getCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 leading-tight">
                Export to Infrastructure &amp; Code
              </h3>
              <p className="text-[11px] text-slate-500">
                Transform current diagram into Mermaid.js, Terraform, or Docker Compose
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 pt-2 gap-2 text-[12px]">
          <button
            onClick={() => setActiveTab('mermaid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'mermaid'
                ? 'border-[#f08705] text-[#f08705] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Mermaid.js (Markdown)</span>
          </button>

          <button
            onClick={() => setActiveTab('terraform')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'terraform'
                ? 'border-[#f08705] text-[#f08705] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileTerminal className="w-3.5 h-3.5" />
            <span>Terraform (IaC)</span>
          </button>

          <button
            onClick={() => setActiveTab('docker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'docker'
                ? 'border-[#f08705] text-[#f08705] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Docker Compose</span>
          </button>
        </div>

        {/* Code Content Box */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-900 text-slate-200 relative group font-mono text-[11px] leading-relaxed">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
          <pre className="overflow-x-auto whitespace-pre-wrap">{codeContent}</pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>Ready to paste directly into README.md or your infra repository.</span>
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

