import React, { useState } from 'react';
import { 
  UploadCloud, FileText, Check, AlertCircle, FileSpreadsheet, 
  Sparkles, ArrowRight, Table, Code2, Users, ShoppingBag, Megaphone
} from 'lucide-react';
import { uploadDataFile, uploadRawData } from '../services/api';

export default function UploadData({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeMode, setActiveMode] = useState('file'); // 'file' or 'paste'
  const [pastedText, setPastedText] = useState('');

  const sampleTemplates = {
    orders: `order_id,customer_name,order_date,product_name,category,sales_amount,quantity,region\nINV-1001,Acme Corp,2025-08-10,Executive Laptop,Technology,74999,1,North America\nINV-1002,Global Retail,2025-08-11,Ergonomic Chair,Furniture,12500,2,Europe\nINV-1003,Starlight Media,2025-08-12,Studio Display,Technology,38900,1,Asia Pacific\nINV-1004,Nexus Health,2025-08-13,Smart Tracker,Health,8990,3,North America`,
    customers: `customer_id,customer_name,email,region_id,segment,acquisition_channel,signup_date,total_spend,total_orders,avg_order_value,recency_days,churn_probability,churn_risk,nps_score\nCUST-03994,Simran Saxena,simran.saxena18@corpmail.com,REG-NORTH,Champions,Google Search,2024-06-19,453683.95,11,41244.0,23,0.071,Low,9\nCUST-03995,Ananya Iyer,ananya.iyer34@corpmail.com,REG-WEST,Champions,Organic,2025-06-20,559541.2,11,50867.38,26,0.092,Low,8\nCUST-03996,Manish Gupta,manish.gupta73@corpmail.com,REG-EAST,Loyal,Organic,2025-05-28,303791.95,15,20252.8,48,0.262,Low,2\nCUST-03997,Siddharth Chopra,siddharth.chopra96@corpmail.com,REG-WEST,Champions,Meta Ads,2024-06-02,277451.35,11,25222.85,38,0.121,Low,8`,
    marketing: `channel_name,spend_lakhs,impressions,clicks,acquisitions,revenue_generated_cr,roas,cac_rs\nGoogle Search,18.5,850000,42000,1850,2.15,11.6,1000\nMeta Ads,14.2,1200000,31000,980,1.10,7.7,1448\nOrganic Search,3.5,450000,18000,620,0.85,24.2,564\nEmail CRM,2.1,320000,15000,540,0.72,34.2,388`
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const res = await uploadDataFile(file);
      if (res && res.file_id && res.quality_profile) {
        onUploadSuccess(res);
      } else {
        throw new Error(res?.detail || "Could not extract records from the uploaded file.");
      }
    } catch (err) {
      setError(err.message || "Failed to extract file. Please verify CSV / Excel format.");
    } finally {
      setLoading(false);
    }
  };

  const handlePastedUpload = async () => {
    if (!pastedText.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await uploadRawData("pasted_data.csv", pastedText);
      if (res && res.file_id && res.quality_profile) {
        onUploadSuccess(res);
      } else {
        throw new Error(res?.detail || "Could not extract records from pasted text.");
      }
    } catch (err) {
      setError(err.message || "Failed to extract pasted data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6 border border-white/10">
      {/* 1. Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-brand-cyan" />
            <span>Bring Your Own Business Data (BYOD)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload CSV, Excel, or JSON files. DecisIQ automatically profiles data quality and matches schemas (with or without headers).
          </p>
        </div>

        <div className="flex items-center gap-1 bg-obsidian-800 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveMode('file')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'file' ? 'bg-brand-cyan text-obsidian-900 shadow-glow-cyan' : 'text-slate-400 hover:text-white'
            }`}
          >
            File Upload
          </button>
          <button
            onClick={() => setActiveMode('paste')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'paste' ? 'bg-brand-cyan text-obsidian-900 shadow-glow-cyan' : 'text-slate-400 hover:text-white'
            }`}
          >
            Paste CSV Text
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Drag & Drop or Paste Container */}
      {activeMode === 'file' ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFile(e.dataTransfer.files[0]);
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            dragActive 
              ? 'border-brand-cyan bg-brand-cyan/10' 
              : 'border-white/15 hover:border-brand-cyan/50 bg-obsidian-800/40'
          }`}
          onClick={() => document.getElementById('file-input-byod').click()}
        >
          <input
            id="file-input-byod"
            type="file"
            accept=".csv,.xlsx,.xls,.json,.txt,.tsv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
              e.target.value = '';
            }}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 text-brand-cyan flex items-center justify-center border border-brand-cyan/20">
            {loading ? (
              <div className="w-6 h-6 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div>
            <span className="text-sm font-semibold text-white block">
              {loading ? "Extracting records & profiling data quality..." : "Click to browse or drag and drop your data file"}
            </span>
            <span className="text-xs text-slate-400 mt-1 block">
              Supports CSV, TSV, Excel (.xlsx/.xls), and JSON datasets (with or without headers)
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span>Paste comma-separated or tab-separated business records:</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-mono">Load Preset:</span>
              <button
                onClick={() => setPastedText(sampleTemplates.orders)}
                className="text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-brand-cyan border border-brand-cyan/20 flex items-center gap-1 transition-colors"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Orders</span>
              </button>
              <button
                onClick={() => setPastedText(sampleTemplates.customers)}
                className="text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-brand-emerald border border-brand-emerald/20 flex items-center gap-1 transition-colors"
              >
                <Users className="w-3 h-3" />
                <span>Customers</span>
              </button>
              <button
                onClick={() => setPastedText(sampleTemplates.marketing)}
                className="text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-brand-violet border border-brand-violet/20 flex items-center gap-1 transition-colors"
              >
                <Megaphone className="w-3 h-3" />
                <span>Marketing</span>
              </button>
            </div>
          </div>
          <textarea
            rows={7}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your CSV rows here (with or without headers)..."
            className="w-full bg-obsidian-900 text-xs font-mono text-slate-200 p-4 rounded-xl border border-white/10 focus:outline-none focus:border-brand-cyan"
          />
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-slate-500 font-mono">
              💡 Tip: Automatic Sniffer detects and repairs missing header rows automatically.
            </div>
            <button
              onClick={handlePastedUpload}
              disabled={loading || !pastedText.trim()}
              className="px-5 py-2 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-obsidian-900 font-bold text-xs flex items-center gap-2 transition-all shadow-glow-cyan disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-obsidian-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Analyze & Map Schema</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
