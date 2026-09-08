import React from 'react';
import { 
  Megaphone, DollarSign, TrendingUp, Filter, AlertCircle, 
  ArrowRight, CheckCircle2, Sparkles, PieChart as PieIcon, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Cell, FunnelChart, Funnel, LabelList 
} from 'recharts';

export default function MarketingAttribution({ marketing, onAskAI, onNavigateTab }) {
  if (!marketing) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-emerald border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-sm font-mono">Calculating Multi-Touch Marketing Attribution & ROAS...</span>
        </div>
      </div>
    );
  }

  const campaigns = marketing.campaigns || [];
  const funnel = marketing.funnel || [];

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-brand-cyan mb-1">
            <Megaphone className="w-5 h-5" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Multi-Touch Attribution & ROI</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Marketing Attribution & Budget Efficiency</h2>
          <p className="text-xs text-slate-400 mt-1">
            Full-funnel attribution, CAC, ROAS tracking, and automated waste spend detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-obsidian-800 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Spend</span>
            <span className="text-xl font-bold font-mono text-white">₹{(marketing.total_spend / 100000).toFixed(1)}L</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Blended ROAS</span>
            <span className="text-xl font-bold font-mono text-brand-emerald">{marketing.blended_roas}x</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Identified Waste Spend</span>
            <span className="text-xl font-bold font-mono text-rose-400">₹{(marketing.waste_spend / 100000).toFixed(1)}L</span>
          </div>
        </div>
      </div>

      {/* 2. Marketing Funnel & Channel ROAS Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full-Funnel Stage Matrix */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="text-base font-semibold text-white">Customer Acquisition Funnel & Drop-Offs</h3>
            <p className="text-xs text-slate-400">Impression to repeat purchase conversion drop-off telemetry</p>
          </div>

          <div className="space-y-3">
            {funnel.map((stage, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-obsidian-800/80 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{stage.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-brand-cyan">{stage.count.toLocaleString()}</span>
                    {stage.dropoff_pct > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">
                        -{stage.dropoff_pct}% Drop
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-cyan to-brand-emerald rounded-full"
                    style={{ width: `${Math.max(8, 100 - idx * 28)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Summary ROAS Breakdown */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Channel Efficiency & Return on Ad Spend (ROAS)</h3>
              <p className="text-xs text-slate-400">Target benchmark: &gt; 3.5x ROAS</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketing.channel_summary || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                <XAxis dataKey="channel" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d111a', borderColor: '#1f293d', borderRadius: '12px', color: '#fff' }}
                  formatter={(val, name) => [name === 'roas' ? `${val}x` : `₹${Number(val).toLocaleString()}`, name.toUpperCase()]}
                />
                <Bar dataKey="roas" fill="#10B981" radius={[6, 6, 0, 0]}>
                  {marketing.channel_summary?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.roas < 1.5 ? '#F43F5E' : entry.roas > 10 ? '#8B5CF6' : '#10B981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Campaign Performance Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Campaign Performance & Spend Efficiency Log</h3>
            <p className="text-xs text-slate-400">Detailed multi-channel metrics, CTR, conversion rates, and CAC</p>
          </div>

          <button
            onClick={() => onAskAI("Which marketing campaigns should we pause, and where should we reallocate ad spend?")}
            className="px-3 py-1.5 rounded-xl bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI: Generate Spend Optimization Plan</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-obsidian-800 text-slate-400 font-mono border-b border-white/10">
              <tr>
                <th className="p-3">Campaign Name</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Total Spend</th>
                <th className="p-3">Conversions</th>
                <th className="p-3">Attributed Revenue</th>
                <th className="p-3">ROAS</th>
                <th className="p-3">CAC</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.map((c, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-medium text-white">{c.campaign_name}</td>
                  <td className="p-3 text-slate-300">{c.channel}</td>
                  <td className="p-3 font-mono text-slate-200">₹{(c.total_spend/100000).toFixed(1)}L</td>
                  <td className="p-3 font-mono text-slate-300">{c.conversions?.toLocaleString()}</td>
                  <td className="p-3 font-mono text-brand-cyan font-semibold">₹{(c.attributed_revenue/100000).toFixed(1)}L</td>
                  <td className="p-3 font-mono">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      c.roas < 1.0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                      c.roas > 5.0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      'text-slate-200'
                    }`}>
                      {c.roas}x
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-300">₹{c.cac}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      c.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
