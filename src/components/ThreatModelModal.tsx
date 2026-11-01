import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Copy,
  Check,
  Download,
  X,
  ArrowUpRight,
} from 'lucide-react';
import {
  generateThreatModel,
  ThreatModelReport,
} from '../services/threatModeler';

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  xml: string;
}

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({
  isOpen,
  onClose,
  xml,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<ThreatModelReport | null>(null);
  const [copied, setCopied] = useState(false);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const res = await generateThreatModel(xml);
      setReport(res);
    } catch (err) {
      console.error('Failed to generate threat model:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReport();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const threats = report?.threats || [];
  const filtered =
    filterCategory === 'all'
      ? threats
      : threats.filter((t) => t.category === filterCategory);

  const handleCopyMarkdown = () => {
    if (!report) return;
    let md = `# STRIDE Threat Modeling & Attack Surface Report\n\n`;
    md += `**Overall System Risk Rating:** ${report.overallRisk}\n`;
    md += `**Total Threat Scenarios Identified:** ${report.totalThreats} (${report.criticalCount} Critical)\n\n`;
    md += `> ${report.summary}\n\n`;
    md += `| Category | Threat Scenario | Severity | Threat Actor | Affected Components | Mitigation Control |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    report.threats.forEach((t) => {
      md += `| ${t.category} | ${t.title} | ${t.severity} | ${t.threatActor} | ${t.affectedComponents.join(', ')} | ${t.mitigation} |\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    if (!report) return;
    let md = `# STRIDE Threat Modeling & Attack Surface Report\n\n`;
    md += `**Overall System Risk Rating:** ${report.overallRisk}\n`;
    md += `**Total Threat Scenarios Identified:** ${report.totalThreats} (${report.criticalCount} Critical)\n\n`;
    md += `> ${report.summary}\n\n`;
    md += `## Detailed Threat Assessment Matrix\n\n`;
    report.threats.forEach((t) => {
      md += `### [${t.category.toUpperCase()}] ${t.title} (${t.severity} Severity)\n`;
      md += `- **Threat Actor:** ${t.threatActor}\n`;
      md += `- **Affected Components:** ${t.affectedComponents.join(', ')}\n`;
      md += `- **Scenario:** ${t.threatDescription}\n`;
      md += `- **Mitigation Control:** ${t.mitigation}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat_model_stride_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'Critical') return 'bg-rose-100 text-rose-800 border-rose-300';
    if (risk === 'High') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                STRIDE Threat Modeling &amp; Attack Surface Analyzer
              </h3>
              <p className="text-[11px] text-slate-500">
                Evaluation for Spoofing, Tampering, Repudiation, Information Disclosure, DoS &amp; Privilege Escalation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Risk Summary Bar */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-slate-50 via-rose-50/20 to-red-50/20 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(
                report?.overallRisk || 'Medium'
              )}`}
            >
              System Risk: {report?.overallRisk || 'Assessing...'}
            </span>
            <span className="text-xs text-slate-600 font-medium">
              Found <strong className="text-slate-900">{report?.totalThreats || 0}</strong> attack vectors (
              <strong className="text-rose-600">{report?.criticalCount || 0} Critical</strong>)
            </span>
          </div>

          <div className="text-[11px] text-slate-500 max-w-md line-clamp-1">
            {report?.summary}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex px-6 py-2 border-b border-slate-100 bg-white gap-1.5 text-xs overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: `All (${threats.length})` },
            { id: 'Spoofing', label: 'Spoofing' },
            { id: 'Tampering', label: 'Tampering' },
            { id: 'Repudiation', label: 'Repudiation' },
            { id: 'Information Disclosure', label: 'Info Disclosure' },
            { id: 'Denial of Service', label: 'DoS' },
            { id: 'Elevation of Privilege', label: 'Privilege Escalation' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                filterCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Threats List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-600 font-semibold">
                Synthesizing STRIDE attack trees and security vulnerability vectors...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No threat scenarios found under this category.
            </div>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 border text-slate-700">
                      {t.category}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900">{t.title}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskColor(
                      t.severity
                    )}`}
                  >
                    {t.severity} Severity
                  </span>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-600">{t.threatDescription}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10px]">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="font-bold text-slate-700">Threat Actor:</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border">
                      {t.threatActor}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-500">
                    <span className="font-bold text-slate-700">Affects:</span>
                    {t.affectedComponents.map((comp, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.2 rounded bg-slate-50 border text-slate-700 font-medium"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mitigation Box */}
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-1.5 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-900">Security Control Mitigation: </span>
                    <span>{t.mitigation}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            STRIDE threat mapping complies with ISO 27001 &amp; SOC2 Type II threat documentation requirements.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              disabled={isLoading || !report}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Matrix'}</span>
            </button>
            <button
              onClick={handleDownloadReport}
              disabled={isLoading || !report}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Threat Report (.md)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
