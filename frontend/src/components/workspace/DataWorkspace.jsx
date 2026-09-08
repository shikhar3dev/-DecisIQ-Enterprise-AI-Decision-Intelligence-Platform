import React, { useState, useEffect } from 'react';
import { 
  Database, Layers, GitBranch, History, ShieldCheck, 
  ArrowLeftRight, FileSpreadsheet, Sparkles, CheckCircle2, 
  RotateCcw, Play, AlertTriangle, Plus, ChevronRight, 
  FileText, Clock, User, Download, Search, Check, RefreshCw
} from 'lucide-react';
import UploadData from '../UploadData';
import DataQualityReport from '../DataQualityReport';
import SchemaMapper from '../SchemaMapper';
import LineageModal from './LineageModal';
import { 
  fetchWorkspaceCatalog, fetchDatasetVersions, rollbackDatasetVersion, 
  compareDatasetVersions, fetchAuditLog, fetchAnalysisRuns, applySchemaMapping, 
  loadPublicBenchmark, resetDemoDataset 
} from '../../services/api';

export default function DataWorkspace({ onDatasetChanged, onNavigateTab }) {
  const [activeSubTab, setActiveSubTab] = useState('catalog'); // 'catalog', 'add-data', 'versions', 'compare', 'audit', 'runs'
  const [catalog, setCatalog] = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState('ds_orders');
  const [versions, setVersions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [analysisRuns, setAnalysisRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Comparison State
  const [versionA, setVersionA] = useState('ver_orders_v2');
  const [versionB, setVersionB] = useState('ver_orders_v3');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  // BYOD Ingestion State
  const [uploadSession, setUploadSession] = useState(null);
  const [selectedSourceType, setSelectedSourceType] = useState('csv');

  // Lineage Modal
  const [selectedLineageKey, setSelectedLineageKey] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cat, vers, logs, runs] = await Promise.all([
        fetchWorkspaceCatalog(),
        fetchDatasetVersions(selectedDatasetId),
        fetchAuditLog(30),
        fetchAnalysisRuns()
      ]);
      setCatalog(cat);
      setVersions(vers);
      setAuditLog(logs);
      setAnalysisRuns(runs);
    } catch (err) {
      console.error("Workspace load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDatasetId]);

  const handleRollback = async (versionId, versionTag) => {
    if (!window.confirm(`Are you sure you want to roll back the active data warehouse to snapshot ${versionTag}?`)) return;
    try {
      const res = await rollbackDatasetVersion(versionId);
      setActionMessage(`Successfully rolled back to version ${versionTag}! Warehouse is now synchronized with this snapshot.`);
      await loadData();
      if (onDatasetChanged) onDatasetChanged();
    } catch (err) {
      alert("Rollback failed: " + err.message);
    }
  };

  const handleRunComparison = async () => {
    if (!versionA || !versionB) return;
    setComparing(true);
    try {
      const res = await compareDatasetVersions(versionA, versionB);
      setComparisonResult(res);
    } catch (err) {
      alert("Comparison failed: " + err.message);
    } finally {
      setComparing(false);
    }
  };

  const handleConfirmMapping = async (mappings, datasetName) => {
    if (!uploadSession) return;
    setLoading(true);
    try {
      const res = await applySchemaMapping(uploadSession.file_id, mappings, datasetName);
      setActionMessage(`Dataset "${datasetName}" successfully ingested into DecisIQ! Created version snapshot ${res.version_info?.version_tag || 'v4'}.`);
      setUploadSession(null);
      await loadData();
      if (onDatasetChanged) onDatasetChanged();
    } catch (err) {
      alert("Error applying mapping: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadBenchmark = async (key, name) => {
    setLoading(true);
    try {
      const res = await loadPublicBenchmark(key);
      setActionMessage(`Loaded Public Benchmark: ${name} (${res.total_records_ingested.toLocaleString()} records). All ML engines recalculated.`);
      await loadData();
      if (onDatasetChanged) onDatasetChanged();
    } catch (err) {
      alert("Error loading benchmark: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetWarehouse = async () => {
    setLoading(true);
    try {
      await resetDemoDataset();
      setActionMessage("Warehouse successfully restored to standard 51,255-order Enterprise Demo baseline.");
      await loadData();
      if (onDatasetChanged) onDatasetChanged();
    } catch (err) {
      alert("Error resetting warehouse: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Sub-Navigation */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-cyan mb-1.5">
              <Database className="w-5 h-5" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">Enterprise Data Workspace</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Data Catalog, Versioning Registry & Audit Lineage
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Manage multiple business datasets, track immutable snapshots (v1, v2, v3), compare data deltas with AI explanation, and audit data lineage.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={() => setActiveSubTab('add-data')}
              className="px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-400 text-obsidian-900 font-bold text-xs flex items-center gap-1.5 transition-all shadow-glow-emerald"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Data Source</span>
            </button>
            <button
              onClick={handleResetWarehouse}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Demo (51k)</span>
            </button>
          </div>
        </div>

        {/* Workspace Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10">
          {[
            { id: 'catalog', label: 'Dataset Catalog', icon: Layers, count: catalog?.total_datasets || 5 },
            { id: 'add-data', label: 'Add Data Source (BYOD)', icon: Plus, badge: 'Wizard' },
            { id: 'versions', label: 'Version History & Rollback', icon: GitBranch, count: versions?.length || 3 },
            { id: 'compare', label: 'Dataset Comparator', icon: ArrowLeftRight, badge: 'AI Diff' },
            { id: 'audit', label: 'Audit Trail & Lineage', icon: ShieldCheck, badge: null },
            { id: 'runs', label: 'Analysis Run History', icon: History, count: analysisRuns?.length || 2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-brand-cyan text-obsidian-900 shadow-glow-cyan font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-obsidian-900/40 text-obsidian-900' : 'bg-white/10 text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isActive ? 'bg-obsidian-900 text-brand-cyan' : 'bg-brand-cyan/20 text-brand-cyan'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-brand-emerald flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => onNavigateTab('cockpit')}
            className="px-3 py-1.5 rounded-lg bg-brand-emerald text-obsidian-900 font-bold text-xs flex items-center gap-1 shadow-glow-emerald flex-shrink-0"
          >
            <span>Open Cockpit</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. SUB-TAB 1: Dataset Catalog */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog?.datasets?.map((ds) => (
              <div 
                key={ds.dataset_id}
                className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-brand-cyan/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded border border-brand-cyan/20">
                      {ds.category}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {ds.health_status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">
                    {ds.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {ds.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded-lg bg-obsidian-800 border border-white/5">
                      <span className="text-[10px] text-slate-500 block">Records</span>
                      <span className="font-bold text-white">{ds.row_count?.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-obsidian-800 border border-white/5">
                      <span className="text-[10px] text-slate-500 block">Version</span>
                      <span className="font-bold text-brand-cyan">{ds.version_tag || 'v1'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-obsidian-800 border border-white/5">
                      <span className="text-[10px] text-slate-500 block">Health</span>
                      <span className="font-bold text-emerald-400">{ds.quality_score}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedDatasetId(ds.dataset_id);
                        setActiveSubTab('versions');
                      }}
                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors border border-white/5 flex items-center justify-center gap-1"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>Version History</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Public Benchmark Quick Loaders */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-cyan" />
              <span>Public Real-World Benchmark Datasets</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleLoadBenchmark('superstore', 'Global Superstore Sales')}
                className="p-3.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 border border-white/10 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">Global Superstore Commercial Sales</div>
                  <div className="text-[10px] text-slate-400 font-mono">10,000 txns across Technology & Furniture</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={() => handleLoadBenchmark('saas', 'B2B Cloud SaaS Metrics')}
                className="p-3.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 border border-white/10 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">B2B Cloud SaaS Subscription Metrics</div>
                  <div className="text-[10px] text-slate-400 font-mono">6,000 ARR/MRR subscription accounts</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-TAB 2: Add Data Source (BYOD Ingestion Wizard) */}
      {activeSubTab === 'add-data' && (
        <div className="space-y-6">
          {/* Step 1: Select Source Type */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white">Step 1 — Select Data Source Type</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'csv', label: 'CSV File', desc: 'Comma/Tab separated', enabled: true },
                { id: 'excel', label: 'Excel Spreadsheet', desc: '.xlsx / .xls formats', enabled: true },
                { id: 'json', label: 'JSON Dataset', desc: 'Records array', enabled: true },
                { id: 'api', label: 'REST API Feed', desc: 'Authorized endpoints', enabled: false },
                { id: 'db', label: 'SQL Database', desc: 'Postgres / MySQL', enabled: false }
              ].map((st) => (
                <button
                  key={st.id}
                  disabled={!st.enabled}
                  onClick={() => setSelectedSourceType(st.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedSourceType === st.id && st.enabled
                      ? 'bg-brand-cyan/15 border-brand-cyan text-white shadow-glow-cyan'
                      : st.enabled
                      ? 'bg-obsidian-800 border-white/10 text-slate-300 hover:border-white/20'
                      : 'bg-obsidian-900/50 border-white/5 text-slate-600 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="text-xs font-bold">{st.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{st.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 & 3: File Upload, Quality Profiler & Schema Mapper */}
          <UploadData 
            onUploadSuccess={(sessionData) => setUploadSession(sessionData)}
          />

          {uploadSession && (
            <div className="space-y-6 animate-fadeIn">
              {/* Extracted Data Banner & Live Preview */}
              <div className="glass-panel p-6 rounded-2xl border border-brand-cyan/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          Extracted Dataset: {uploadSession.metadata?.filename || 'Uploaded File'}
                        </h4>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30">
                          {uploadSession.metadata?.file_type?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Successfully parsed and extracted <strong className="text-brand-cyan">{uploadSession.metadata?.total_rows?.toLocaleString() || 0}</strong> records across <strong className="text-brand-cyan">{uploadSession.metadata?.total_columns || 0}</strong> columns.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setUploadSession(null)}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-medium transition-colors"
                  >
                    Clear & Upload Different File
                  </button>
                </div>

                {/* Extracted Rows Preview Table */}
                {uploadSession.metadata?.preview && uploadSession.metadata.preview.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-mono text-[11px]">Previewing first {uploadSession.metadata.preview.length} extracted records:</span>
                      <span className="text-[11px] text-slate-500 font-mono">Auto-sanitized & ready for schema mapping</span>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-white/10 max-h-64">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-obsidian-800 text-slate-300 border-b border-white/10 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-[10px] font-bold text-slate-500 w-10">#</th>
                            {uploadSession.metadata.columns?.map((col, idx) => (
                              <th key={idx} className="px-3 py-2 font-bold text-brand-cyan truncate whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-obsidian-900/60">
                          {uploadSession.metadata.preview.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                              <td className="px-3 py-1.5 text-slate-500 text-[10px]">{rIdx + 1}</td>
                              {uploadSession.metadata.columns?.map((col, cIdx) => (
                                <td key={cIdx} className="px-3 py-1.5 text-slate-200 whitespace-nowrap truncate max-w-[200px]">
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <DataQualityReport 
                qualityProfile={uploadSession.quality_profile} 
              />

              <SchemaMapper
                schemaDetection={uploadSession.schema_detection}
                onConfirmMapping={handleConfirmMapping}
                loading={loading}
              />
            </div>
          )}
        </div>
      )}

      {/* 4. SUB-TAB 3: Version History & 1-Click Rollback */}
      {activeSubTab === 'versions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between glass-panel p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <GitBranch className="w-5 h-5 text-brand-cyan" />
              <div>
                <h3 className="text-sm font-bold text-white">Immutable Version Snapshots</h3>
                <p className="text-xs text-slate-400">
                  Showing historical versions for dataset: <strong className="text-brand-cyan">E-Commerce Enterprise Orders</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {versions.map((ver) => {
              const isActive = ver.status === 'Active';
              return (
                <div 
                  key={ver.version_id}
                  className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isActive ? 'border-brand-emerald/40 bg-brand-emerald/5' : 'border-white/10 bg-obsidian-800/60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                      isActive ? 'bg-brand-emerald text-obsidian-900 shadow-glow-emerald' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {ver.version_tag}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{ver.file_name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                          isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {ver.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{ver.notes || 'Routine transactional ingestion snapshot.'}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                        <span>{ver.row_count?.toLocaleString()} rows</span>
                        <span>•</span>
                        <span>SHA-256: <code className="text-slate-300">{ver.file_hash}</code></span>
                        <span>•</span>
                        <span>Quality: <strong className="text-emerald-400">{ver.quality_score}%</strong></span>
                        <span>•</span>
                        <span>{ver.uploaded_at}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    {!isActive && (
                      <button
                        onClick={() => handleRollback(ver.version_id, ver.version_tag)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-brand-cyan" />
                        <span>Rollback to {ver.version_tag}</span>
                      </button>
                    )}
                    {isActive && (
                      <span className="text-xs font-semibold text-brand-emerald flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Currently Active</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. SUB-TAB 4: Dataset Comparison Engine */}
      {activeSubTab === 'compare' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-brand-cyan" />
              <span>Dataset Version Comparator & AI Variance Explainer</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select any two version snapshots to compute metric deltas and generate an automated AI variance narrative.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-obsidian-800 border border-white/5">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Baseline Version A</label>
              <select
                value={versionA}
                onChange={(e) => setVersionA(e.target.value)}
                className="w-full bg-obsidian-900 text-xs text-white p-2.5 rounded-xl border border-white/10 focus:outline-none"
              >
                <option value="ver_orders_v1">v1 (enterprise_orders_q1_2024.csv - 38,400 rows)</option>
                <option value="ver_orders_v2">v2 (enterprise_orders_q3_2025.csv - 47,120 rows)</option>
                <option value="ver_orders_v3">v3 (enterprise_orders_august_2026.csv - 51,255 rows)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Target Version B</label>
              <select
                value={versionB}
                onChange={(e) => setVersionB(e.target.value)}
                className="w-full bg-obsidian-900 text-xs text-white p-2.5 rounded-xl border border-white/10 focus:outline-none"
              >
                <option value="ver_orders_v3">v3 (enterprise_orders_august_2026.csv - 51,255 rows)</option>
                <option value="ver_orders_v2">v2 (enterprise_orders_q3_2025.csv - 47,120 rows)</option>
                <option value="ver_orders_v1">v1 (enterprise_orders_q1_2024.csv - 38,400 rows)</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button
                onClick={handleRunComparison}
                disabled={comparing}
                className="px-5 py-2 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-obsidian-900 font-bold text-xs flex items-center gap-2 transition-all shadow-glow-cyan"
              >
                {comparing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Compare Versions & Generate AI Explanation</span>
              </button>
            </div>
          </div>

          {comparisonResult && (
            <div className="space-y-4 animate-fade-in">
              {/* Delta Scorecard Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-obsidian-800 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Metric</th>
                      <th className="p-3 text-right">{comparisonResult.version_a.tag} ({comparisonResult.version_a.file_name})</th>
                      <th className="p-3 text-right">{comparisonResult.version_b.tag} ({comparisonResult.version_b.file_name})</th>
                      <th className="p-3 text-right">Variance Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    <tr className="hover:bg-white/5">
                      <td className="p-3 font-sans font-semibold text-white">Top-Line Revenue</td>
                      <td className="p-3 text-right text-slate-300">₹{comparisonResult.version_a.revenue_cr} Cr</td>
                      <td className="p-3 text-right text-white font-bold">₹{comparisonResult.version_b.revenue_cr} Cr</td>
                      <td className={`p-3 text-right font-bold ${comparisonResult.deltas.revenue_cr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {comparisonResult.deltas.revenue_cr >= 0 ? '+' : ''}₹{comparisonResult.deltas.revenue_cr} Cr ({comparisonResult.deltas.revenue_pct >= 0 ? '+' : ''}{comparisonResult.deltas.revenue_pct}%)
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5">
                      <td className="p-3 font-sans font-semibold text-white">Total Order Records</td>
                      <td className="p-3 text-right text-slate-300">{comparisonResult.version_a.rows.toLocaleString()}</td>
                      <td className="p-3 text-right text-white font-bold">{comparisonResult.version_b.rows.toLocaleString()}</td>
                      <td className={`p-3 text-right font-bold ${comparisonResult.deltas.rows >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {comparisonResult.deltas.rows >= 0 ? '+' : ''}{comparisonResult.deltas.rows.toLocaleString()} ({comparisonResult.deltas.rows_pct >= 0 ? '+' : ''}{comparisonResult.deltas.rows_pct}%)
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5">
                      <td className="p-3 font-sans font-semibold text-white">Active Accounts</td>
                      <td className="p-3 text-right text-slate-300">{comparisonResult.version_a.customers.toLocaleString()}</td>
                      <td className="p-3 text-right text-white font-bold">{comparisonResult.version_b.customers.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        +{comparisonResult.deltas.customers}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5">
                      <td className="p-3 font-sans font-semibold text-white">Average Order Value (AOV)</td>
                      <td className="p-3 text-right text-slate-300">₹{comparisonResult.version_a.aov}</td>
                      <td className="p-3 text-right text-white font-bold">₹{comparisonResult.version_b.aov}</td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        {comparisonResult.deltas.aov >= 0 ? '+' : ''}₹{comparisonResult.deltas.aov}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AI Narrative Card */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 text-brand-cyan font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>DecisIQ AI Variance Explanation</span>
                </div>
                <p className="text-slate-200 leading-relaxed pl-6">
                  {comparisonResult.ai_explanation}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. SUB-TAB 5: Audit Trail & Lineage Explorer */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          {/* Quick Lineage Inspector */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-cyan" />
              <span>Data Lineage Explorer — Where Did This Number Come From?</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'revenue_cr', name: 'Revenue (₹7.87 Cr)', desc: 'fact_orders sum' },
                { key: 'forecast_target_cr', name: 'Next-Month Forecast (₹14.2 Cr)', desc: 'Ridge ML forecaster' },
                { key: 'churn_risk_customers', name: 'At-Risk Churn (184 Accounts)', desc: 'Random Forest classifier' },
                { key: 'aov', name: 'Average Order Value (₹2,840)', desc: 'Line item arithmetic mean' }
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedLineageKey(m.key)}
                  className="p-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 border border-white/10 text-left transition-colors"
                >
                  <div className="text-xs font-bold text-white">{m.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Immutable Audit Log Table */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Enterprise Audit Event Trail</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Immutable Ledger</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-obsidian-800 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">User / Actor</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Target Entity</th>
                    <th className="p-3">Details</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLog.map((log) => (
                    <tr key={log.event_id} className="hover:bg-white/5">
                      <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-3 font-semibold text-white whitespace-nowrap">{log.user_name}</td>
                      <td className="p-3 text-brand-cyan font-medium whitespace-nowrap">{log.action}</td>
                      <td className="p-3 text-slate-300 font-mono text-[11px]">{log.target_entity}</td>
                      <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">{log.details}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUB-TAB 6: Reproducible Analysis Runs */}
      {activeSubTab === 'runs' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-brand-cyan" />
                <span>Reproducible Analysis Run History</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every executive analysis is saved as a reproducible point-in-time snapshot tied to a specific dataset version.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisRuns.map((run) => (
              <div key={run.run_id} className="p-5 rounded-2xl bg-obsidian-800 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Analysis #{run.run_number}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                    {run.created_at}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Tied to: <strong className="text-slate-200">{run.dataset_name}</strong>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-white/5">
                  <div className="p-2 rounded-lg bg-obsidian-900 border border-white/5">
                    <span className="text-[9px] text-slate-500 block">Revenue</span>
                    <span className="font-bold text-emerald-400">₹{run.revenue_cr} Cr</span>
                  </div>
                  <div className="p-2 rounded-lg bg-obsidian-900 border border-white/5">
                    <span className="text-[9px] text-slate-500 block">Forecast</span>
                    <span className="font-bold text-brand-cyan">₹{run.forecast_target_cr} Cr</span>
                  </div>
                  <div className="p-2 rounded-lg bg-obsidian-900 border border-white/5">
                    <span className="text-[9px] text-slate-500 block">Churn Risk</span>
                    <span className="font-bold text-amber-400">{run.churn_rate_pct}%</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab('cockpit')}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-brand-emerald" />
                  <span>Inspect Dashboard for This Snapshot</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Lineage Modal Popup */}
      {selectedLineageKey && (
        <LineageModal
          metricKey={selectedLineageKey}
          onClose={() => setSelectedLineageKey(null)}
        />
      )}
    </div>
  );
}
