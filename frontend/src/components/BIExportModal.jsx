import React, { useState } from 'react';
import { 
  Download, FileSpreadsheet, Database, Code2, 
  CheckCircle2, Sparkles, FolderDown, Layers, FileText
} from 'lucide-react';
import { exportPowerBI } from '../services/api';

export default function BIExportModal({ onClose, kpis }) {
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(null);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await exportPowerBI();
      setExported(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full space-y-6 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Power BI & Executive Dossier Export Center</h3>
              <p className="text-xs text-slate-400">Generate analytical CSV schemas, DAX measures dictionary, and executive briefings</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-obsidian-800/90 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-brand-cyan text-xs font-semibold uppercase">
              <Database className="w-4 h-4" />
              <span>Power BI Data Tables (CSVs)</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>dim_customers.csv (RFM + Churn)</li>
              <li>dim_products.csv (SKUs + Margins)</li>
              <li>dim_marketing_campaigns.csv</li>
              <li>fact_orders.csv (51k+ rows)</li>
              <li>fact_daily_business_pulse.csv</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-obsidian-800/90 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-brand-amber text-xs font-semibold uppercase">
              <Code2 className="w-4 h-4" />
              <span>DAX Measures & SQL Assets</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>01_star_schema_ddl.sql</li>
              <li>02_advanced_analytics.sql (CTEs)</li>
              <li>03_powerbi_dax_measures.dax</li>
              <li>Power BI Star Schema Mapping Guide</li>
            </ul>
          </div>
        </div>

        {exported ? (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-brand-emerald text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Power BI Assets Generated Successfully!</span>
            </div>
            <p className="text-xs text-slate-300">
              Files have been written to <code className="font-mono text-emerald-300 bg-black/40 px-1.5 py-0.5 rounded">{exported.export_directory}</code>
            </p>
            <div className="text-[11px] text-slate-400 font-mono pt-1">
              • Total files ready: {exported.exported_files?.length} tables + README
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <span className="text-xs font-semibold text-white block">Ready to export asset pack</span>
              <span className="text-[11px] text-slate-400">Instantly creates all files for portfolio and Power BI presentation</span>
            </div>
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-400 text-obsidian-900 font-semibold text-xs flex items-center gap-2 transition-all shadow-glow-emerald disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-obsidian-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FolderDown className="w-4 h-4" />
              )}
              <span>Export Power BI Pack</span>
            </button>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
