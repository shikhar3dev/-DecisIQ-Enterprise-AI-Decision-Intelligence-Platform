import React, { useState } from 'react';
import { 
  Users, Search, Sparkles, Filter, X
} from 'lucide-react';

export default function Customer360({ segmentation, churnData, onAskAI }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  if (!segmentation || !churnData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-emerald border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-sm font-mono">Synthesizing Customer 360 & ML Churn Scores...</span>
        </div>
      </div>
    );
  }

  const segmentColors = {
    "Champions": "#10B981",
    "Loyal": "#06B6D4",
    "Potential": "#F59E0B",
    "At-Risk": "#F43F5E",
    "Lost": "#64748B"
  };

  const highRiskCustomers = churnData.high_risk_customers || [];
  const filteredCustomers = highRiskCustomers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.customer_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = selectedSegment === 'All' || c.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & RFM Segmentation Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-brand-cyan mb-1">
            <Users className="w-5 h-5" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Predictive Customer Intelligence</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customer 360 & ML Churn Defense Radar</h2>
          <p className="text-xs text-slate-400 mt-1">
            RFM segmentation and supervised Random Forest churn scoring across {segmentation.total_customers?.toLocaleString()} enterprise accounts. Click any tier below to filter win-back accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Revenue at High Risk</span>
            <span className="text-lg font-bold font-mono text-rose-400">
              ₹{(churnData.total_at_risk_revenue / 100000).toFixed(1)} Lakhs
            </span>
          </div>
        </div>
      </div>

      {/* 2. RFM Tier Cards (Interactive Filter) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {segmentation.segments?.map((seg, idx) => {
          const color = segmentColors[seg.segment] || "#10B981";
          const isSelected = selectedSegment === seg.segment;
          return (
            <button
              key={idx}
              onClick={() => setSelectedSegment(isSelected ? 'All' : seg.segment)}
              title={`Click to filter win-back roster by ${seg.segment}`}
              className={`glass-panel p-5 rounded-2xl space-y-3 relative overflow-hidden border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-brand-cyan border-brand-cyan/50 bg-white/10 shadow-glow-cyan'
                  : 'border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  {seg.segment}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                  {seg.revenue_share}% Rev
                </span>
              </div>

              <div>
                <div className="text-2xl font-bold text-white font-mono">
                  {seg.count?.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Avg Spend: <strong className="text-slate-200">₹{seg.aov?.toLocaleString()}</strong>
                </div>
              </div>

              <div className="text-xs text-slate-400 pt-2 border-t border-white/5 space-y-1">
                <p className="text-[11px] text-slate-300 line-clamp-2">{seg.strategy}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-brand-cyan">
                    Via {seg.recommended_channel}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-mono text-brand-cyan font-semibold">
                      [Active Filter]
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Churn Risk Drivers & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">ML Churn Feature Importance</h3>
              <p className="text-xs text-slate-400">Random Forest behavioral indicators (AUC: {churnData.model_metrics?.roc_auc})</p>
            </div>
          </div>

          <div className="space-y-3">
            {churnData.feature_importances?.map((feat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{feat.feature}</span>
                  <span className="text-brand-emerald font-mono font-semibold">{feat.importance}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-emerald rounded-full"
                    style={{ width: `${feat.importance * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Risk Customer Roster Table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white">High-Risk Customer Win-Back Queue</h3>
              <p className="text-xs text-slate-400">Prioritized by account value and ML churn probability</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedSegment !== 'All' && (
                <div className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-brand-cyan/15 border border-brand-cyan/30 text-brand-cyan font-mono">
                  <span>Segment: <strong>{selectedSegment}</strong></span>
                  <button 
                    onClick={() => setSelectedSegment('All')}
                    title="Clear segment filter"
                    className="hover:text-white ml-1 p-0.5 rounded hover:bg-white/10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-obsidian-800 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-brand-cyan"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-obsidian-800 text-slate-400 font-mono border-b border-white/10">
                <tr>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Segment</th>
                  <th className="p-2.5">Total Spend</th>
                  <th className="p-2.5">Inactivity</th>
                  <th className="p-2.5">Churn Score</th>
                  <th className="p-2.5">Primary Driver</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-mono text-xs">
                      No accounts matched the selected segment ({selectedSegment}) or search query.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.slice(0, 15).map((c, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-medium text-white">
                        <div>{c.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{c.customer_id}</div>
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {c.segment}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-200">
                        ₹{c.total_spend?.toLocaleString()}
                      </td>
                      <td className="p-2.5 font-mono text-slate-400">
                        {c.recency_days}d ago
                      </td>
                      <td className="p-2.5">
                        <span className="font-mono font-bold text-rose-400">
                          {c.churn_score}%
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-300">
                        {c.primary_driver}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="px-2.5 py-1 rounded bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald font-medium text-[11px] border border-brand-emerald/30 transition-colors"
                        >
                          Playbook
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Customer Detail & Retention Playbook Modal / Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full space-y-4 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedCustomer.name}</h3>
                <span className="text-xs font-mono text-slate-400">{selectedCustomer.customer_id} • {selectedCustomer.region}</span>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-obsidian-800 border border-white/5">
                <span className="text-slate-400 block">Total Lifetime Value</span>
                <strong className="text-sm font-mono text-emerald-400">₹{selectedCustomer.total_spend?.toLocaleString()}</strong>
              </div>
              <div className="p-3 rounded-xl bg-obsidian-800 border border-white/5">
                <span className="text-slate-400 block">Predicted Churn Score</span>
                <strong className="text-sm font-mono text-rose-400">{selectedCustomer.churn_score}%</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <h4 className="text-xs font-bold text-brand-emerald uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Prescribed Retention Strategy
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                {selectedCustomer.recommended_action}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  onAskAI(`Generate a personalized VIP win-back email for customer ${selectedCustomer.name} (${selectedCustomer.customer_id}) who is at risk due to ${selectedCustomer.primary_driver}.`);
                  setSelectedCustomer(null);
                }}
                className="px-4 py-2 rounded-xl bg-brand-emerald text-obsidian-900 font-semibold text-xs flex items-center gap-1.5 shadow-glow-emerald"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate VIP Win-Back Flow in AI</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
