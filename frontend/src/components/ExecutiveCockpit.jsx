import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, AlertTriangle, ShieldAlert, Zap, 
  DollarSign, Users, ShoppingBag, Percent, ArrowUpRight, ArrowDownRight,
  Sparkles, CheckCircle2, ChevronRight, Activity, GitCommit
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, CartesianGrid, Legend 
} from 'recharts';
import LineageModal from './workspace/LineageModal';

export default function ExecutiveCockpit({ kpis, trends, categories, regions, onAskAI, onNavigateTab }) {
  const [activeLineage, setActiveLineage] = useState(null);

  if (!kpis) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-emerald border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-sm font-mono">Loading Executive Telemetry...</span>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      metric_key: "revenue_cr",
      title: "Monthly Net Revenue",
      value: `₹${kpis.revenue_cr} Cr`,
      growth: kpis.revenue_growth_mom,
      growthType: kpis.revenue_growth_mom >= 0 ? "positive" : "negative",
      subtitle: "vs previous 30 days",
      icon: DollarSign,
      color: "emerald"
    },
    {
      metric_key: "active_customers",
      title: "Active Customer Base",
      value: `${kpis.active_customers?.toLocaleString()}`,
      growth: 8.7,
      growthType: "positive",
      subtitle: `of ${kpis.total_customers?.toLocaleString()} total accounts`,
      icon: Users,
      color: "cyan"
    },
    {
      metric_key: "aov",
      title: "Average Order Value (AOV)",
      value: `₹${kpis.aov?.toLocaleString()}`,
      growth: kpis.aov_growth_mom,
      growthType: kpis.aov_growth_mom >= 0 ? "positive" : "negative",
      subtitle: `${kpis.orders_count?.toLocaleString()} total orders`,
      icon: ShoppingBag,
      color: "violet"
    },
    {
      metric_key: "churn_risk_customers",
      title: "Average Churn Risk",
      value: `${kpis.churn_rate_pct}%`,
      growth: 1.2,
      growthType: "negative", // Churn increase is negative
      subtitle: "ML predictive score",
      icon: Percent,
      color: "rose"
    },
    {
      metric_key: "forecast_target_cr",
      title: "Forecast Target (Next Mo.)",
      value: `₹${kpis.forecast_next_month_cr} Cr`,
      growth: 12.0,
      growthType: "positive",
      subtitle: "Gradient Boosting 95% CI",
      icon: Zap,
      color: "amber"
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Active Risk Radar Alerts Banner */}
      {kpis.alerts && kpis.alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpis.alerts.map((alert, idx) => (
            <div 
              key={alert.id || idx} 
              className={`p-4 rounded-xl glass-panel relative overflow-hidden border ${
                alert.type === 'critical' 
                  ? 'border-rose-500/40 bg-rose-950/20' 
                  : alert.type === 'warning' 
                  ? 'border-amber-500/40 bg-amber-950/20' 
                  : 'border-cyan-500/40 bg-cyan-950/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  alert.type === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                  alert.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white truncate">{alert.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-white/10 text-slate-300">
                      {alert.impact}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">{alert.message}</p>
                  <button 
                    onClick={() => onAskAI(`Investigate ${alert.title}. What is the root cause and recommended action?`)}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-brand-emerald hover:text-emerald-300 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Root-Cause Investigation</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Top-Level Executive KPI Pulse Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          const isPos = kpi.growthType === "positive";
          return (
            <div key={idx} className="glass-panel p-5 rounded-2xl relative group overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">{kpi.title}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLineage({ key: kpi.metric_key, title: kpi.title });
                    }}
                    title="Trace Data Lineage (Where did this number come from?)"
                    className="p-1 rounded-lg bg-white/5 hover:bg-brand-cyan/20 text-slate-400 hover:text-brand-cyan transition-colors"
                  >
                    <GitCommit className="w-3.5 h-3.5" />
                  </button>
                  <div className={`p-2 rounded-xl bg-${kpi.color}-500/10 text-${kpi.color}-400`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight font-sans mt-1">
                {kpi.value}
              </div>
              <div className="flex items-center gap-2 mt-2.5 text-xs">
                <span className={`inline-flex items-center font-medium px-1.5 py-0.5 rounded ${
                  isPos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {isPos ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {Math.abs(kpi.growth)}%
                </span>
                <span className="text-slate-400 truncate">{kpi.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Revenue & Gross Margin Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-emerald" />
                Enterprise Revenue & Gross Margin Trend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">24-month multi-channel performance telemetry</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigateTab('predictive')}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5 text-brand-cyan" />
                View 30/60/90D Forecast
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d111a', borderColor: '#1f293d', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Category Contribution Matrix */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Category Profitability</h3>
              <span className="text-xs font-mono text-brand-emerald">Gross Margin %</span>
            </div>
            <div className="space-y-3.5">
              {categories && categories.map((cat, idx) => {
                const totalCatRev = categories.reduce((acc, c) => acc + c.revenue, 0);
                const sharePct = ((cat.revenue / totalCatRev) * 100).toFixed(1);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono">₹{(cat.revenue/100000).toFixed(1)}L ({sharePct}%)</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {cat.margin_pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-emerald to-brand-cyan rounded-full"
                        style={{ width: `${sharePct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <button 
              onClick={() => onAskAI("Why did Electronics category profit margin fluctuate last quarter?")}
              className="w-full py-2 px-3 rounded-xl bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI: Analyze Category Drivers</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Regional Footprint & Logistics Health */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Regional Market Performance & Logistics SLA</h3>
            <p className="text-xs text-slate-400">Order volumes, average realized basket size, and delivery duration</p>
          </div>
          <span className="text-xs font-mono text-slate-400">5 Regional Hubs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {regions && regions.map((reg, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-obsidian-800/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{reg.region_name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono">{reg.market_tier}</span>
              </div>
              <div className="text-lg font-bold text-brand-cyan font-mono">
                ₹{(reg.revenue/100000).toFixed(1)}L
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5">
                <span>Orders: <strong className="text-slate-200">{reg.orders?.toLocaleString()}</strong></span>
                <span>Avg SLA: <strong className="text-emerald-400">{reg.avg_delivery_days}d</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive KPI Data Lineage Modal */}
      {activeLineage && (
        <LineageModal
          metricKey={activeLineage.key}
          metricTitle={activeLineage.title}
          onClose={() => setActiveLineage(null)}
        />
      )}
    </div>
  );
}
