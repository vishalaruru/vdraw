import React, { useState, useEffect } from 'react';
import {
  Coins,
  TrendingDown,
  Copy,
  Check,
  Download,
  X,
  Sparkles,
} from 'lucide-react';
import {
  estimateDiagramCost,
  CostEstimateResult,
  CloudProvider,
} from '../services/costEstimator';

interface CostEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  xml: string;
}

export const CostEstimatorModal: React.FC<CostEstimatorModalProps> = ({
  isOpen,
  onClose,
  xml,
}) => {
  const [provider, setProvider] = useState<CloudProvider>('aws');
  const [region, setRegion] = useState<string>('us-east-1');
  const [activeTab, setActiveTab] = useState<'breakdown' | 'finops'>('breakdown');
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<CostEstimateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const loadCostEstimate = async (p: CloudProvider, r: string) => {
    setIsLoading(true);
    try {
      const res = await estimateDiagramCost(xml, p, r);
      setEstimate(res);
    } catch (err) {
      console.error('Failed to estimate cost:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCostEstimate(provider, region);
    }
  }, [isOpen, provider, region]);

  if (!isOpen) return null;

  const totalSavings =
    estimate?.savingsTips?.reduce((acc, tip) => acc + tip.estimatedMonthlySavings, 0) || 0;

  const handleCopyMarkdown = () => {
    if (!estimate) return;
    let md = `# Cloud Cost & FinOps Estimate (${estimate.provider.toUpperCase()} - ${estimate.region})\n\n`;
    md += `**Monthly Estimated Run-Rate:** $${estimate.monthlyTotal.toFixed(2)} USD\n`;
    md += `**Annual Projected Spend:** $${estimate.annualTotal.toFixed(2)} USD\n`;
    md += `**Identified FinOps Monthly Savings:** -$${totalSavings.toFixed(2)} USD\n\n`;
    md += `## Resource Line-Item Breakdown\n\n`;
    md += `| Component | Cloud Service | Sizing / Tier | Category | Monthly Cost |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    estimate.lineItems.forEach((item) => {
      md += `| ${item.componentName} | ${item.cloudService} | ${item.instanceTypeOrTier} | ${item.category} | $${item.monthlyCost.toFixed(2)} |\n`;
    });
    md += `\n## FinOps Optimization Opportunities\n\n`;
    estimate.savingsTips.forEach((tip) => {
      md += `### 💡 ${tip.title} (Save ~$${tip.estimatedMonthlySavings}/mo)\n`;
      md += `- **Difficulty:** ${tip.difficulty}\n`;
      md += `- **Action:** ${tip.description}\n\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    if (!estimate) return;
    let md = `# Cloud Cost & FinOps Estimate (${estimate.provider.toUpperCase()} - ${estimate.region})\n\n`;
    md += `**Monthly Estimated Run-Rate:** $${estimate.monthlyTotal.toFixed(2)} USD\n`;
    md += `**Annual Projected Spend:** $${estimate.annualTotal.toFixed(2)} USD\n\n`;
    md += `| Component | Cloud Service | Sizing / Tier | Category | Monthly Cost |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    estimate.lineItems.forEach((item) => {
      md += `| ${item.componentName} | ${item.cloudService} | ${item.instanceTypeOrTier} | ${item.category} | $${item.monthlyCost.toFixed(2)} |\n`;
    });
    md += `\n## FinOps Optimization Opportunities\n\n`;
    estimate.savingsTips.forEach((tip) => {
      md += `### 💡 ${tip.title} (Save ~$${tip.estimatedMonthlySavings}/mo)\n${tip.description}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloud_cost_estimate_${estimate.provider}_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Cloud Cost &amp; FinOps Estimator
              </h3>
              <p className="text-[11px] text-slate-500">
                Component-level cloud retail pricing, sizing &amp; cost-reduction analytics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Controls: Cloud Provider & Region Selector */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Provider Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200">
            {[
              { id: 'aws', label: 'AWS' },
              { id: 'gcp', label: 'Google Cloud (GCP)' },
              { id: 'azure', label: 'Microsoft Azure' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id as CloudProvider)}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  provider === p.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Region Dropdown */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-slate-500">Target Region:</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="us-east-1">us-east-1 (N. Virginia)</option>
              <option value="us-west-2">us-west-2 (Oregon)</option>
              <option value="eu-west-1">eu-west-1 (Ireland)</option>
              <option value="ap-south-1">ap-south-1 (Mumbai)</option>
              <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
            </select>
          </div>
        </div>

        {/* KPI Cards Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 via-emerald-50/20 to-teal-50/20 border-b border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Monthly Total */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Monthly Run-Rate
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ${estimate ? estimate.monthlyTotal.toFixed(2) : '0.00'}
                <span className="text-xs font-semibold text-slate-500 font-normal"> / mo</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Based on continuous 730 hrs/month
              </div>
            </div>

            {/* Annual Total */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Annual Projected Spend
              </div>
              <div className="text-2xl font-black text-slate-700 mt-1">
                ${estimate ? estimate.annualTotal.toFixed(2) : '0.00'}
                <span className="text-xs font-semibold text-slate-500 font-normal"> / yr</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Standard On-Demand retail baseline
              </div>
            </div>

            {/* FinOps Potential Savings */}
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Identified FinOps Savings</span>
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                -${totalSavings.toFixed(2)}
                <span className="text-xs font-semibold text-emerald-600 font-normal"> / mo</span>
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">
                Up to {estimate && estimate.monthlyTotal > 0 ? Math.round((totalSavings / estimate.monthlyTotal) * 100) : 0}% potential budget reduction
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-6 border-b border-slate-100 bg-white gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('breakdown')}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === 'breakdown'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Resource Line Items ({estimate?.lineItems?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finops')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'finops'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>FinOps Optimization Tips ({estimate?.savingsTips?.length || 0})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-600 font-semibold">
                Estimating cloud pricing &amp; sizing across {provider.toUpperCase()} catalog...
              </p>
            </div>
          ) : activeTab === 'breakdown' ? (
            /* Line Items Table */
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Diagram Component</th>
                    <th className="py-2.5 px-3">Mapped Cloud Service</th>
                    <th className="py-2.5 px-3">Sizing / Tier</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Est. Monthly</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {estimate?.lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.componentName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{item.cloudService}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                        {item.instanceTypeOrTier}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-semibold">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                        ${item.monthlyCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* FinOps Optimization Tips */
            <div className="space-y-3">
              {estimate?.savingsTips.map((tip) => (
                <div
                  key={tip.id}
                  className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        💡
                      </div>
                      <h4 className="font-bold text-xs text-slate-900">{tip.title}</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px] border border-emerald-200">
                      Save ~${tip.estimatedMonthlySavings}/mo
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed pl-8">
                    {tip.description}
                  </p>

                  <div className="pl-8 pt-1 flex items-center gap-2 text-[10px]">
                    <span className="text-slate-400 font-semibold uppercase">Effort:</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                      {tip.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            Retail pricing estimates exclude network egress &amp; dynamic request spikes.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              disabled={isLoading || !estimate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Copy Breakdown'}</span>
            </button>
            <button
              onClick={handleDownloadReport}
              disabled={isLoading || !estimate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report (.md)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
