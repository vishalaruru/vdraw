import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  ArrowUpRight,
  Boxes,
  Zap,
  Activity,
} from 'lucide-react';
import { ArchitectureAuditResult, SecurityFinding } from '../services/architectureAuditor';

interface ArchitectureAuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  auditResult: ArchitectureAuditResult | null;
  isLoading: boolean;
  onAutoFix?: (finding: SecurityFinding) => Promise<void> | void;
}

export const ArchitectureAuditDrawer: React.FC<ArchitectureAuditDrawerProps> = ({
  isOpen,
  onClose,
  auditResult,
  isLoading,
  onAutoFix,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [fixingId, setFixingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAutoFix = async (finding: SecurityFinding) => {
    if (!onAutoFix) return;
    setFixingId(finding.id);
    try {
      await onAutoFix(finding);
    } finally {
      setFixingId(null);
    }
  };

  const findings = auditResult?.findings || [];
  const filtered =
    filterCategory === 'all'
      ? findings
      : filterCategory === 'critical'
      ? findings.filter((f) => f.severity === 'critical')
      : filterCategory === 'solid'
      ? findings.filter((f) => f.category === 'SOLID Principles' || f.pillar === 'SOLID')
      : filterCategory === 'security'
      ? findings.filter((f) => f.category === 'Security & Zero-Trust' || f.pillar === 'Security')
      : filterCategory === 'reliability'
      ? findings.filter((f) => f.category === 'Reliability (SPOF)' || f.pillar === 'Reliability')
      : filterCategory === 'performance'
      ? findings.filter((f) => f.category === 'Performance & Scale' || f.pillar === 'Performance')
      : filterCategory === 'well-architected'
      ? findings.filter((f) => f.category === 'Well-Architected' || f.category === 'Performance & Scale')
      : findings;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-300';
    if (score >= 65) return 'text-amber-600 bg-amber-50 border-amber-300';
    return 'text-rose-600 bg-rose-50 border-rose-300';
  };

  const getStatusBadgeColor = (status?: string) => {
    if (status?.includes('Nominal Enterprise')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (status?.includes('Sub-Nominal')) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  const pScores = auditResult?.pillarScores;

  return (
    <div className="fixed top-10 right-0 bottom-0 w-[430px] max-w-[95vw] bg-white border-l border-slate-200 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-slate-800">
              Architecture Security &amp; SOLID Linter
            </h3>
            <p className="text-[10px] text-slate-500">
              Strict Zero-Trust, SOLID Principles &amp; Well-Architected Framework
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="w-9 h-9 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-700 font-semibold">
            Strict Architecture Audit in Progress...
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Evaluating zero-trust perimeters, SOLID component coupling, SPOFs, and Well-Architected Framework compliance.
          </p>
        </div>
      ) : auditResult ? (
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Nominal Status & Score Banner */}
          <div className="p-4 border-b border-slate-100 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nominal Architecture Baseline
                </span>
                <div className="mt-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeColor(
                      auditResult.nominalStatus
                    )}`}
                  >
                    {auditResult.nominalStatus || 'Evaluation Complete'}
                  </span>
                </div>
              </div>

              {/* Numerical Score */}
              <div
                className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center font-black text-xl shadow-xs ${getScoreColor(
                  auditResult.overallScore
                )}`}
              >
                <span>{auditResult.overallScore}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest -mt-1 opacity-70">
                  /100
                </span>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              {auditResult.summary}
            </p>

            {/* 5-Pillar Score Breakdown */}
            {pScores && (
              <div className="pt-1 space-y-1.5 text-[10px]">
                <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                  Pillar Adherence:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-500" /> Security:
                      </span>
                      <span>{pScores.security}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all"
                        style={{ width: `${pScores.security}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-amber-500" /> Reliability:
                      </span>
                      <span>{pScores.reliability}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${pScores.reliability}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Boxes className="w-3 h-3 text-indigo-500" /> SOLID:
                      </span>
                      <span>{pScores.solidPrinciples}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${pScores.solidPrinciples}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-500" /> Performance:
                      </span>
                      <span>{pScores.performance}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${pScores.performance}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Categorical & Severity Filters */}
          <div className="flex px-3 py-2 border-b border-slate-100 bg-slate-50/70 gap-1 text-[11px] overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: `All (${findings.length})` },
              {
                id: 'critical',
                label: `Critical (${findings.filter((f) => f.severity === 'critical').length})`,
              },
              { id: 'security', label: 'Security' },
              { id: 'reliability', label: 'Reliability & DLQ' },
              { id: 'solid', label: 'SOLID' },
              { id: 'performance', label: 'Performance' },
              { id: 'well-architected', label: 'Well-Architected' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-2 py-0.5 rounded capitalize font-semibold whitespace-nowrap transition-colors ${
                  filterCategory === cat.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Findings List */}
          <div className="p-3 space-y-3 flex-1">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No findings in this category.
              </div>
            ) : (
              filtered.map((f) => (
                <div
                  key={f.id}
                  className={`p-3.5 rounded-xl border text-[11px] space-y-2 ${
                    f.severity === 'critical'
                      ? 'border-rose-200 bg-rose-50/30 text-rose-950'
                      : f.severity === 'warning'
                      ? 'border-amber-200 bg-amber-50/30 text-amber-950'
                      : f.severity === 'good'
                      ? 'border-emerald-200 bg-emerald-50/30 text-emerald-950'
                      : 'border-blue-200 bg-blue-50/30 text-blue-950'
                  }`}
                >
                  {/* Top badges: Rule ID & Category */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      {f.severity === 'critical' && (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      )}
                      {f.severity === 'warning' && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      )}
                      {f.severity === 'good' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      )}
                      {f.severity === 'info' && (
                        <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      )}
                      <span className="font-semibold text-slate-900 leading-tight">
                        {f.title}
                      </span>
                    </div>
                    {f.ruleId && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 flex-shrink-0">
                        {f.ruleId}
                      </span>
                    )}
                  </div>

                  {/* Category Pill */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-white/90 border border-slate-200/80 text-slate-600">
                      {f.category}
                    </span>
                    {f.pillar && (
                      <span className="text-[9px] font-medium text-slate-500">
                        &bull; {f.pillar} Pillar
                      </span>
                    )}
                  </div>

                  {/* Specific Technical Description */}
                  <p className="text-[11px] leading-relaxed text-slate-700">
                    {f.description}
                  </p>

                  {/* Affected Component Tags */}
                  {f.affectedComponents && f.affectedComponents.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">
                        Affects:
                      </span>
                      {f.affectedComponents.map((comp, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-medium"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Concrete Actionable Recommendation */}
                  {f.recommendation && (
                    <div className="pt-1 text-[11px] flex items-start gap-1.5 font-medium text-slate-800 bg-white/90 p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                      <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600 mt-0.5" />
                      <div className="leading-snug">
                        <span className="font-bold text-slate-900">Remediation: </span>
                        <span>{f.recommendation}</span>
                      </div>
                    </div>
                  )}

                  {/* Nominal Standard Requirement */}
                  {f.nominalGap && (
                    <div className="text-[10px] text-slate-500 bg-slate-50/80 p-2 rounded border border-slate-200/60 leading-tight">
                      <span className="font-semibold text-slate-700">Nominal Target: </span>
                      <span>{f.nominalGap}</span>
                    </div>
                  )}

                  {/* Auto-Fix Action Button */}
                  {f.severity !== 'good' && onAutoFix && (
                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        disabled={fixingId === f.id}
                        onClick={() => handleAutoFix(f)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[#f08705] hover:bg-[#e07b04] active:bg-[#c96e03] text-white rounded-md text-[11px] font-bold shadow-2xs transition-all disabled:opacity-50"
                      >
                        {fixingId === f.id ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Remediating Diagram...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3 fill-white" />
                            <span>Auto-Fix Architecture</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 p-6 text-center text-xs text-slate-400 flex items-center justify-center">
          Click &quot;Audit&quot; in the top bar to inspect your architecture.
        </div>
      )}
    </div>
  );
};
