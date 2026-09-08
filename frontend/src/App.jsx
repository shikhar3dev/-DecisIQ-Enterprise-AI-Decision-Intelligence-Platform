import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, MessageSquareText, TrendingUp, Users, 
  ShieldAlert, Megaphone, Sliders, Download, Sparkles, 
  Database, Activity, ChevronRight, Layers, BellRing, RefreshCw
} from 'lucide-react';

import ExecutiveCockpit from './components/ExecutiveCockpit';
import AskYourDataAI from './components/AskYourDataAI';
import Customer360 from './components/Customer360';
import PredictiveForecast from './components/PredictiveForecast';
import AnomalyRadar from './components/AnomalyRadar';
import MarketingAttribution from './components/MarketingAttribution';
import WhatIfSimulator from './components/WhatIfSimulator';
import DataWorkspace from './components/workspace/DataWorkspace';
import BIExportModal from './components/BIExportModal';

import { 
  fetchKPIs, fetchRevenueTrends, fetchCategories, fetchRegions, 
  fetchChurn, fetchSegmentation, fetchAnomalies, fetchMarketing, resetDemoDataset 
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('cockpit');
  const [showExportModal, setShowExportModal] = useState(false);
  const [aiQueryPrefill, setAiQueryPrefill] = useState('');
  const [resetting, setResetting] = useState(false);

  // Global Analytical State
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [churnData, setChurnData] = useState(null);
  const [segmentation, setSegmentation] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [marketing, setMarketing] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadAllData = async () => {
    try {
      const [k, t, c, r, ch, seg, anom, mkt] = await Promise.all([
        fetchKPIs(),
        fetchRevenueTrends('monthly'),
        fetchCategories(),
        fetchRegions(),
        fetchChurn(),
        fetchSegmentation(),
        fetchAnomalies(),
        fetchMarketing()
      ]);
      setKpis(k);
      setTrends(t);
      setCategories(c);
      setRegions(r);
      setChurnData(ch);
      setSegmentation(seg);
      setAnomalies(anom);
      setMarketing(mkt);
    } catch (err) {
      console.error("Data load error:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleResetToDemo = async () => {
    setResetting(true);
    try {
      await resetDemoDataset();
      await loadAllData();
      setActiveTab('cockpit');
    } catch (err) {
      alert("Error resetting warehouse: " + err.message);
    } finally {
      setResetting(false);
    }
  };

  const handleAskAIWithPrompt = (promptText) => {
    setAiQueryPrefill(promptText);
    setActiveTab('ask-ai');
  };

  const navTabs = [
    { id: 'cockpit', label: 'Executive Cockpit', icon: LayoutDashboard, badge: null },
    { id: 'ask-ai', label: 'Ask Your Data AI', icon: MessageSquareText, badge: 'NLP Engine' },
    { id: 'predictive', label: 'Predictive ML Forecast', icon: TrendingUp, badge: '95% CI' },
    { id: 'customer-360', label: 'Customer 360 & Churn', icon: Users, badge: `${churnData?.high_risk_customers?.length || 0} At-Risk` },
    { id: 'anomalies', label: 'Anomaly Radar', icon: ShieldAlert, badge: `${anomalies?.total_anomalies_detected || 0} Alerts` },
    { id: 'marketing', label: 'Marketing Attribution', icon: Megaphone, badge: null },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders, badge: 'Dynamic' },
    { id: 'sources', label: 'Data Workspace', icon: Database, badge: 'BYOD / Sync' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-900 text-slate-100 font-sans">
      {/* 1. Ultra-Modern Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-obsidian-900/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('cockpit')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-emerald to-brand-cyan flex items-center justify-center text-obsidian-900 font-extrabold shadow-glow-emerald">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>DecisIQ</span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/30">
                    Enterprise AI
                  </span>
                </h1>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Decision Intelligence Platform for Business Performance Optimization
              </p>
            </div>
          </button>
        </div>

        {/* Action Controls & Telemetry Status */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetToDemo}
            disabled={resetting}
            title="Restore baseline 51,255 enterprise order dataset"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 text-brand-cyan ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Reset 51k Orders Baseline'}</span>
          </button>

          <button
            onClick={() => handleAskAIWithPrompt("Why did revenue decrease last month?")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30 text-xs font-semibold transition-all shadow-glow-emerald"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Decision AI</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="hidden sm:inline">Power BI Export</span>
          </button>
        </div>
      </header>

      {/* 2. Secondary Tab Switcher Bar */}
      <div className="bg-obsidian-800/60 border-b border-white/5 px-4 lg:px-8 py-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-emerald text-obsidian-900 font-semibold shadow-glow-emerald' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive 
                      ? 'bg-obsidian-900/30 text-obsidian-900 font-bold' 
                      : 'bg-white/10 text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Dynamic Content Body */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
        {initialLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-emerald border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-400 text-sm font-mono">Initializing Enterprise Decision Engine...</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'cockpit' && (
              <ExecutiveCockpit
                kpis={kpis}
                trends={trends}
                categories={categories}
                regions={regions}
                onAskAI={handleAskAIWithPrompt}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'ask-ai' && (
              <AskYourDataAI
                initialQuery={aiQueryPrefill}
              />
            )}

            {activeTab === 'predictive' && (
              <PredictiveForecast
                onAskAI={handleAskAIWithPrompt}
              />
            )}

            {activeTab === 'customer-360' && (
              <Customer360
                segmentation={segmentation}
                churnData={churnData}
                onAskAI={handleAskAIWithPrompt}
              />
            )}

            {activeTab === 'anomalies' && (
              <AnomalyRadar
                anomalies={anomalies}
                onAskAI={handleAskAIWithPrompt}
              />
            )}

            {activeTab === 'marketing' && (
              <MarketingAttribution
                marketing={marketing}
                onAskAI={handleAskAIWithPrompt}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'simulator' && (
              <WhatIfSimulator
                onAskAI={handleAskAIWithPrompt}
              />
            )}

            {activeTab === 'sources' && (
              <DataWorkspace
                onDatasetChanged={loadAllData}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}
          </>
        )}
      </main>

      {/* 4. Power BI Export Modal */}
      {showExportModal && (
        <BIExportModal
          onClose={() => setShowExportModal(false)}
          kpis={kpis}
        />
      )}

      {/* 5. Footer */}
      <footer className="border-t border-white/5 py-4 px-8 text-center text-xs text-slate-500 font-mono">
        Enterprise AI Decision Intelligence Platform • Powered by DuckDB / SQLite Star-Schema, Scikit-Learn ML Engines & NLP Decision Reasoning
      </footer>
    </div>
  );
}
