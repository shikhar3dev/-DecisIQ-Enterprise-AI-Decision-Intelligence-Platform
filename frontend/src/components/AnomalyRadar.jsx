import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, Search, Sparkles, 
  Activity, ArrowDownRight, ArrowUpRight, Zap, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, ReferenceDot, BarChart, Bar 
} from 'recharts';

export default function AnomalyRadar({ anomalies, onAskAI }) {
  const [selectedIncident, setSelectedIncident] = useState(null);

  if (!anomalies) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-emerald border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-sm font-mono">Running Isolation Forest Anomaly Radar...</span>
        </div>
      </div>
    );
  }

  const allAnomalies = anomalies.all_anomalies || [];

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-brand-rose mb-1">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Automated Risk Telemetry</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Multi-Metric Anomaly Detection Radar</h2>
          <p className="text-xs text-slate-400 mt-1">
            Isolation Forest & Rolling Z-Score telemetry tracking revenue collapses, checkout funnel drops, and return rate spikes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Critical Incidents</span>
            <span className="text-xl font-bold font-mono text-rose-400">{anomalies.critical_count}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Moderate Flags</span>
            <span className="text-xl font-bold font-mono text-amber-400">{anomalies.moderate_count}</span>
          </div>
          <div className="p-3 rounded-xl bg-obsidian-800 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Detected</span>
            <span className="text-xl font-bold font-mono text-white">{anomalies.total_anomalies_detected}</span>
          </div>
        </div>
      </div>

      {/* 2. Anomaly Incident Timeline Chart */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Daily Revenue Telemetry & Anomaly Outlier Flags</h3>
            <p className="text-xs text-slate-400">Past 120 days daily business pulse</p>
          </div>
          <span className="text-xs font-mono text-brand-rose">Red Dots = Flagged Anomaly Points</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={anomalies.timeline || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0d111a', borderColor: '#1f293d', borderRadius: '12px', color: '#fff' }}
                formatter={(val) => [`₹${Number(val).toLocaleString()}`, "Revenue"]}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#06B6D4" 
                strokeWidth={2} 
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.is_anomaly) {
                    return (
                      <circle cx={cx} cy={cy} r={6} fill="#F43F5E" stroke="#fff" strokeWidth={2} key={payload.date} />
                    );
                  }
                  return null;
                }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Detailed Incident Table with Auto-Diagnosis */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Anomaly Incident Log & Root-Cause Diagnosis</h3>
            <p className="text-xs text-slate-400">Automated diagnostic explanations and statistical deviation z-scores</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-obsidian-800 text-slate-400 font-mono border-b border-white/10">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Revenue Recorded</th>
                <th className="p-3">Conversion Rate</th>
                <th className="p-3">Return Rate</th>
                <th className="p-3">Z-Score Deviation</th>
                <th className="p-3">Root Cause Diagnosis</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allAnomalies.map((inc, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-mono font-medium text-white">{inc.date}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                      inc.severity === 'Critical' 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-semibold text-slate-200">
                    ₹{inc.revenue?.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    {inc.conversion_rate}%
                  </td>
                  <td className="p-3 font-mono">
                    <span className={inc.return_rate_pct > 8 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {inc.return_rate_pct}%
                    </span>
                  </td>
                  <td className="p-3 font-mono text-brand-amber font-semibold">
                    {inc.z_score}σ
                  </td>
                  <td className="p-3 text-slate-300 max-w-xs">
                    {inc.reason}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onAskAI(`Explain the anomaly on ${inc.date} where ${inc.reason}. What was the multi-dimensional impact and preventive step?`)}
                      className="px-3 py-1 rounded-lg bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald text-[11px] font-semibold border border-brand-emerald/30 transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Investigate</span>
                    </button>
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
