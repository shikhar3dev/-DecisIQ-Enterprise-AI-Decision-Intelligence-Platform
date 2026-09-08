import React, { useState, useEffect } from 'react';
import { 
  Database, UploadCloud, Globe, CheckCircle2, RotateCcw, 
  Sparkles, Layers, ArrowRight, Table, ShieldCheck, Activity, ChevronRight
} from 'lucide-react';
import UploadData from './UploadData';
import DataQualityReport from './DataQualityReport';
import SchemaMapper from './SchemaMapper';
import { fetchDataSources, loadPublicBenchmark, resetDemoDataset, applySchemaMapping } from '../services/api';

export default function DataSourceManager({ onDatasetChanged, onNavigateTab }) {
  const [sourcesInfo, setSourcesInfo] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [uploadSession, setUploadSession] = useState(null);
  const [ingestSuccess, setIngestSuccess] = useState(null);

  const loadSources = async () => {
    try {
      const data = await fetchDataSources();
      setSourcesInfo(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleLoadPublic = async (datasetKey, name) => {
    setLoadingAction(`loading_${datasetKey}`);
    try {
      const res = await loadPublicBenchmark(datasetKey);
      setIngestSuccess(`Successfully loaded public benchmark: "${name}" (${res.total_records_ingested.toLocaleString()} records). All ML engines and decision dashboards have been recalculated!`);
      setUploadSession(null);
      await loadSources();
      if (onDatasetChanged) onDatasetChanged();
    } catch (err) {
      alert("Error loading public benchmark: " + err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetDemo = async () => {
    setLoadingAction('reset_demo');
    try {
      await resetDemoDataset();
      setIngestSuccess("Warehouse successfully reset to standard 51,255-order Enterprise Demo Dataset.");
      setUploadSession(null);
      await loadSources();
      if (onDatasetChanged) onDatasetChanged();
    } catch (err) {
      alert("Error resetting demo: " + err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleConfirmMapping = async (mappings, datasetName) => {
    if (!uploadSession) return;
    setLoadingAction('applying_mapping');
    try {
      const res = await applySchemaMapping(uploadSession.file_id, mappings, datasetName);
      setIngestSuccess(`Dataset "${datasetName}" successfully ingested into DecisIQ! Loaded ${res.total_records_ingested.toLocaleString()} records across ${res.total_customers.toLocaleString()} customers.`);
      setUploadSession(null);
      await loadSources();
      if (onDatasetChanged) onDatasetChanged();
    } catch (err) {
      alert("Error applying mapping: " + err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-brand-emerald mb-1">
            <Database className="w-5 h-5" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Data Ingestion & Connectors</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Data Source Manager & Bring Your Own Data (BYOD)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect DecisIQ to custom company sales files (CSV/Excel) or switch between authorized public benchmark datasets.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          disabled={loadingAction === 'reset_demo'}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loadingAction === 'reset_demo' ? 'animate-spin' : ''}`} />
          <span>Reset to Default Demo (51k Orders)</span>
        </button>
      </div>

      {/* 2. Success Alert */}
      {ingestSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-brand-emerald flex-shrink-0" />
            <span>{ingestSuccess}</span>
          </div>
          <button
            onClick={() => onNavigateTab('cockpit')}
            className="px-3.5 py-1.5 rounded-lg bg-brand-emerald text-obsidian-900 font-bold text-xs flex items-center gap-1 shadow-glow-emerald self-start sm:self-auto"
          >
            <span>Open Executive Cockpit</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Active Dataset Status Banner */}
      {sourcesInfo && (
        <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center border border-brand-emerald/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Analytical Data Source</span>
              <h4 className="text-sm font-bold text-white">
                {sourcesInfo.current_source?.source_name}
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {sourcesInfo.current_source?.total_records?.toLocaleString()} records loaded • Mode: <span className="text-brand-emerald font-semibold">{sourcesInfo.current_source?.source_type}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('cockpit')}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10"
            >
              View Dashboards
            </button>
          </div>
        </div>
      )}

      {/* 4. Public Benchmark Datasets (Mode 3 for Interviews) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-cyan" />
              <span>Public Authorized Benchmark Datasets (1-Click Interview Switcher)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Demonstrate DecisIQ's dynamic versatility by analyzing completely different business models with 1 click.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sourcesInfo?.public_benchmarks?.map((bm) => (
            <div key={bm.key} className="glass-panel p-5 rounded-2xl space-y-3 border border-white/5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{bm.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                    {bm.records}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{bm.description}</p>
                <div className="text-[11px] font-mono text-slate-400 pt-1">
                  Categories: <strong className="text-slate-300">{bm.categories}</strong>
                </div>
              </div>

              <button
                onClick={() => handleLoadPublic(bm.key, bm.name)}
                disabled={loadingAction === `loading_${bm.key}`}
                className="w-full py-2 px-3 rounded-xl bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {loadingAction === `loading_${bm.key}` ? (
                  <div className="w-4 h-4 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Load & Analyze in DecisIQ</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Bring Your Own Business Data (BYOD Workflow) */}
      <div className="space-y-4">
        <UploadData 
          onUploadSuccess={(sessionData) => {
            setUploadSession(sessionData);
            setIngestSuccess(null);
          }}
        />

        {uploadSession && (
          <div className="space-y-6">
            {/* Data Quality Report */}
            <DataQualityReport 
              qualityProfile={uploadSession.quality_profile} 
            />

            {/* Schema Mapper */}
            <SchemaMapper
              schemaDetection={uploadSession.schema_detection}
              onConfirmMapping={handleConfirmMapping}
              loading={loadingAction === 'applying_mapping'}
            />
          </div>
        )}
      </div>
    </div>
  );
}
