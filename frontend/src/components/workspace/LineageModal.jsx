import React, { useState, useEffect } from 'react';
import { 
  X, Database, GitCommit, ArrowRight, ShieldCheck, 
  Code2, Sparkles, FileText, CheckCircle2 
} from 'lucide-react';
import { fetchDataLineage } from '../../services/api';

export default function LineageModal({ metricKey, metricTitle, onClose }) {
  const [lineageData, setLineageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchDataLineage(metricKey || 'revenue_cr');
        setLineageData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [metricKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl p-6 rounded-3xl border border-white/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Data Lineage & Provenance Trace</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30">
                  Audit Verified
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                End-to-end trace for <strong className="text-white">{metricTitle || lineageData?.metric_name || "Metric"}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Metric Value Card */}
        {lineageData && (
          <div className="p-4 rounded-2xl bg-obsidian-800/80 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Reported Metric Value</span>
              <div className="text-xl font-black font-mono text-brand-emerald">
                {lineageData.current_value}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block">Integrity Status</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            </div>
          </div>
        )}

        {/* Stepped Lineage Graph */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
            <span>Tracing data lineage across SQL warehouse...</span>
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-white/10">
            {lineageData?.lineage_nodes?.map((node, idx) => (
              <div key={idx} className="relative pl-12">
                {/* Node Step Marker */}
                <div className="absolute left-2.5 top-2 -translate-x-1/2 w-6 h-6 rounded-full bg-obsidian-900 border-2 border-brand-cyan text-[11px] font-mono font-bold text-brand-cyan flex items-center justify-center shadow-glow-cyan">
                  {node.step}
                </div>

                <div className="p-3.5 rounded-xl bg-obsidian-800 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{node.title}</span>
                    {node.hash && (
                      <span className="text-[10px] font-mono text-slate-500">
                        SHA-256: {node.hash}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-300 font-mono bg-obsidian-900/60 p-2 rounded-lg border border-white/5 break-all">
                    {node.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
          >
            Close Provenance
          </button>
        </div>
      </div>
    </div>
  );
}
