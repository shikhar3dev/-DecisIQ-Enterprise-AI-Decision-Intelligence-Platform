import React from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, 
  HelpCircle, BarChart3, Database, FileSpreadsheet 
} from 'lucide-react';

export default function DataQualityReport({ qualityProfile }) {
  if (!qualityProfile) return null;

  const score = qualityProfile.health_score;
  const isExcellent = score >= 85;
  const isGood = score >= 70 && score < 85;

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6 border border-white/10">
      {/* 1. Quality Header & Gauge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${
            isExcellent ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' :
            isGood ? 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20' :
            'bg-brand-rose/10 text-brand-rose border border-brand-rose/20'
          }`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Data Quality & Integrity Profiler</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                isExcellent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                isGood ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {qualityProfile.health_rating}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Analyzed {qualityProfile.total_rows?.toLocaleString()} rows across {qualityProfile.total_columns} columns
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Health Score</span>
            <span className={`text-2xl font-black font-mono ${
              isExcellent ? 'text-brand-emerald' : isGood ? 'text-brand-amber' : 'text-brand-rose'
            }`}>
              {score}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Key Diagnostic Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-obsidian-800 border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400">Total Records</span>
          <div className="text-lg font-bold font-mono text-white">
            {qualityProfile.total_rows?.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-obsidian-800 border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400">Duplicate Rows</span>
          <div className="text-lg font-bold font-mono text-slate-200">
            {qualityProfile.duplicate_rows} ({qualityProfile.duplicate_pct}%)
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-obsidian-800 border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400">Overall Missing Cells</span>
          <div className={`text-lg font-bold font-mono ${qualityProfile.overall_missing_pct > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {qualityProfile.overall_missing_pct}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-obsidian-800 border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400">Date Integrity</span>
          <div className={`text-lg font-bold font-mono ${qualityProfile.invalid_dates > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {qualityProfile.invalid_dates > 0 ? `${qualityProfile.invalid_dates} Invalid` : '100% Valid'}
          </div>
        </div>
      </div>

      {/* 3. Anomalies & Warnings Banner */}
      {qualityProfile.anomalies_detected && qualityProfile.anomalies_detected.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Integrity Warnings Detected</span>
          </div>
          {qualityProfile.anomalies_detected.map((anom, idx) => (
            <p key={idx} className="text-slate-300 pl-5">
              • {anom.message}
            </p>
          ))}
        </div>
      )}

      {/* 4. Column Missing Values Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Column-by-Column Completeness
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
          {qualityProfile.missing_breakdown?.map((col, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-obsidian-800/80 border border-white/5 flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <div className="text-white font-medium truncate">{col.column}</div>
                <div className="text-[10px] font-mono text-slate-500">
                  {col.mapped_to !== 'unmapped' ? `Mapped: ${col.mapped_to}` : 'Unmapped'}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`font-mono text-[11px] ${col.missing_pct > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {col.missing_pct}% null
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
