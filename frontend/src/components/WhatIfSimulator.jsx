import React, { useState, useEffect } from 'react';
import { 
  Sliders, TrendingUp, DollarSign, Percent, AlertTriangle, 
  CheckCircle2, Sparkles, RefreshCw, ArrowRight, Layers
} from 'lucide-react';
import { postSimulatePrice, postSimulateRetention, postSimulateMarketing } from '../services/api';

export default function WhatIfSimulator({ onAskAI }) {
  const [category, setCategory] = useState('Overall');
  const [priceDelta, setPriceDelta] = useState(5.0);
  const [retentionDiscount, setRetentionDiscount] = useState(10.0);
  const [marketingShift, setMarketingShift] = useState(10.0);

  const [priceResult, setPriceResult] = useState(null);
  const [retentionResult, setRetentionResult] = useState(null);
  const [marketingResult, setMarketingResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runPriceSimulation = async () => {
    try {
      const res = await postSimulatePrice(category, priceDelta);
      setPriceResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const runRetentionSimulation = async () => {
    try {
      const res = await postSimulateRetention(retentionDiscount);
      setRetentionResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const runMarketingSimulation = async () => {
    try {
      const res = await postSimulateMarketing(marketingShift, "Meta Ads", "Google Search");
      setMarketingResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    runPriceSimulation();
  }, [category, priceDelta]);

  useEffect(() => {
    runRetentionSimulation();
  }, [retentionDiscount]);

  useEffect(() => {
    runMarketingSimulation();
  }, [marketingShift]);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-brand-violet mb-1">
            <Sliders className="w-5 h-5" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Strategic Decision Modeling</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">"What-If" Executive Scenario Simulator</h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate forward-looking pricing elasticity, targeted win-back coupon campaigns, and marketing budget reallocations.
          </p>
        </div>

        <button
          onClick={() => onAskAI("What is the optimal price increase strategy for maximum profit without triggering customer churn?")}
          className="px-4 py-2 rounded-xl bg-brand-emerald text-obsidian-900 font-semibold text-xs flex items-center gap-1.5 shadow-glow-emerald"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI for Scenario Optimization</span>
        </button>
      </div>

      {/* 2. Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulator 1: Price Elasticity */}
        <div className="glass-panel p-6 rounded-2xl space-y-5 border border-white/10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-emerald" />
                Price Elasticity Simulator
              </h3>
              <span className="text-xs font-mono text-slate-400">PED Modeling</span>
            </div>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Target Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-obsidian-800 text-xs text-white p-2.5 rounded-xl border border-white/10 focus:outline-none"
              >
                <option value="Overall">Overall Portfolio</option>
                <option value="Electronics">Electronics (PED -1.15)</option>
                <option value="Fashion">Fashion & Apparel (PED -1.55)</option>
                <option value="Home & Living">Home & Living (PED -1.25)</option>
                <option value="Health & Wellness">Health & Wellness (PED -1.40)</option>
              </select>
            </div>

            {/* Price Delta Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Price Adjustment:</span>
                <span className="font-mono font-bold text-brand-emerald text-sm">
                  {priceDelta > 0 ? `+${priceDelta}%` : `${priceDelta}%`}
                </span>
              </div>
              <input
                type="range"
                min="-15"
                max="20"
                step="0.5"
                value={priceDelta}
                onChange={(e) => setPriceDelta(parseFloat(e.target.value))}
                className="w-full accent-brand-emerald bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-15% Discount</span>
                <span>0% Parity</span>
                <span>+20% Premium</span>
              </div>
            </div>

            {/* Price Simulation Outcome */}
            {priceResult && (
              <div className="p-4 rounded-xl bg-obsidian-800/90 border border-white/5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Projected Demand Shift:</span>
                  <span className={`font-mono font-bold ${priceResult.deltas.demand_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {priceResult.deltas.demand_pct}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Net Revenue Impact:</span>
                  <span className={`font-mono font-bold ${priceResult.deltas.revenue_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {priceResult.deltas.revenue_pct > 0 ? `+${priceResult.deltas.revenue_pct}%` : `${priceResult.deltas.revenue_pct}%`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Net Gross Profit Impact:</span>
                  <span className={`font-mono font-bold ${priceResult.deltas.profit_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {priceResult.deltas.profit_pct > 0 ? `+${priceResult.deltas.profit_pct}%` : `${priceResult.deltas.profit_pct}%`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Customer Churn Sensitivity:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    +{priceResult.deltas.churn_risk_delta_pct}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {priceResult && (
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300">
              {priceResult.executive_verdict}
            </div>
          )}
        </div>

        {/* Simulator 2: At-Risk Retention Incentive */}
        <div className="glass-panel p-6 rounded-2xl space-y-5 border border-white/10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-cyan" />
                Win-Back Campaign ROI
              </h3>
              <span className="text-xs font-mono text-slate-400">Churn Defense</span>
            </div>

            {/* Retention Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Targeted Win-Back Discount:</span>
                <span className="font-mono font-bold text-brand-cyan text-sm">
                  {retentionDiscount}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={retentionDiscount}
                onChange={(e) => setRetentionDiscount(parseFloat(e.target.value))}
                className="w-full accent-brand-cyan bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5% Min Incentive</span>
                <span>15% Standard</span>
                <span>25% Max Incentive</span>
              </div>
            </div>

            {/* Retention Outcome */}
            {retentionResult && (
              <div className="p-4 rounded-xl bg-obsidian-800/90 border border-white/5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Targeted Dormant Accounts:</span>
                  <span className="font-mono font-bold text-white">{retentionResult.targeted_customers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Projected Reactivations:</span>
                  <span className="font-mono font-bold text-brand-cyan">{retentionResult.projected_reactivations} accounts ({retentionResult.winback_rate_pct}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Gross Recovered Revenue:</span>
                  <span className="font-mono font-bold text-emerald-400">₹{(retentionResult.gross_recovered_revenue/100000).toFixed(1)} Lakhs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Campaign Net ROI:</span>
                  <span className="font-mono font-bold text-emerald-400">+{retentionResult.campaign_roi_pct}% ROI</span>
                </div>
              </div>
            )}
          </div>

          {retentionResult && (
            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-300">
              {retentionResult.executive_verdict}
            </div>
          )}
        </div>

        {/* Simulator 3: Marketing Budget Reallocation */}
        <div className="glass-panel p-6 rounded-2xl space-y-5 border border-white/10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-amber" />
                Budget Reallocation Optimizer
              </h3>
              <span className="text-xs font-mono text-slate-400">Capital Efficiency</span>
            </div>

            {/* Reallocation Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Reallocate Ad Spend:</span>
                <span className="font-mono font-bold text-brand-amber text-sm">
                  ₹{marketingShift} Lakhs
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                step="1"
                value={marketingShift}
                onChange={(e) => setMarketingShift(parseFloat(e.target.value))}
                className="w-full accent-brand-amber bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>From Meta Ads (2.1x)</span>
                <span>To Google Search (5.9x)</span>
              </div>
            </div>

            {/* Reallocation Outcome */}
            {marketingResult && (
              <div className="p-4 rounded-xl bg-obsidian-800/90 border border-white/5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Capital Shifted:</span>
                  <span className="font-mono font-bold text-white">₹{marketingShift} Lakhs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Lost Meta Revenue:</span>
                  <span className="font-mono font-bold text-rose-400">-₹{(marketingResult.lost_revenue/100000).toFixed(1)}L</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Gained Google Revenue:</span>
                  <span className="font-mono font-bold text-emerald-400">+₹{(marketingResult.gained_revenue/100000).toFixed(1)}L</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Net Incremental Revenue:</span>
                  <span className="font-mono font-bold text-emerald-400">+₹{(marketingResult.net_revenue_lift/100000).toFixed(1)} Lakhs</span>
                </div>
              </div>
            )}
          </div>

          {marketingResult && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300">
              {marketingResult.executive_verdict}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
