import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar, Zap, ShieldCheck, HelpCircle, 
  ArrowUpRight, Sparkles, SlidersHorizontal, BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend, Line, ComposedChart 
} from 'recharts';
import { fetchForecast } from '../services/api';

export default function PredictiveForecast({ onAskAI }) {
  const [horizon, setHorizon] = useState(30);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadForecast = async (h) => {
    setLoading(true);
    try {
      const data = await fetchForecast(h);
      setForecastData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast(horizon);
  }, [horizon]);

  // Combine past 60 days with future forecast
  const combinedChartData = React.useMemo(() => {
    if (!forecastData) return [];
    const past = (forecastData.past_data || []).map(p => ({
      date: p.date,
      actual: p.actual_revenue,
      predicted: null,
      upper_95: null,
      lower_95: null
    }));

    const future = (forecastData.forecast_data || []).map(f => ({
      date: f.date,
      actual: null,
      predicted: f.predicted_revenue,
      upper_95: f.upper_95,
      lower_95: f.lower_95
    }));

    return [...past.slice(-45), ...future];
  }, [forecastData]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Horizon Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-brand-amber mb-1">
            <Zap className="w-5 h-5" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Predictive Machine Learning Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Time-Series Revenue & Demand Forecasting</h2>
          <p className="text-xs text-slate-400 mt-1">
            Multi-horizon iterative projections featuring cyclical encodings, moving averages, and 95% confidence intervals.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-obsidian-800 p-1.5 rounded-xl border border-white/10">
          {[30, 60, 90].map((days) => (
            <button
              key={days}
              onClick={() => setHorizon(days)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                horizon === days 
                  ? 'bg-brand-emerald text-obsidian-900 shadow-glow-emerald' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {days} Days Horizon
            </button>
          ))}
        </div>
      </div>

      {/* 2. Key Metrics & Model Diagnostics */}
      {forecastData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cumulative Projected Revenue</span>
            <div className="text-2xl font-bold text-brand-emerald font-mono mt-1">
              ₹{forecastData.projected_revenue_cr} Cr
            </div>
            <span className="text-xs text-slate-400 mt-1 block">over next {horizon} days</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Forecast Confidence Score</span>
            <div className="text-2xl font-bold text-brand-cyan font-mono mt-1">
              {forecastData.metrics?.confidence_score}%
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Empirical backtest validation</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mean Absolute Pct Error (MAPE)</span>
            <div className="text-2xl font-bold text-brand-amber font-mono mt-1">
              {forecastData.metrics?.mape_pct}%
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Target industry standard &lt; 15%</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Algorithm Model Class</span>
            <div className="text-lg font-bold text-white font-mono mt-1 truncate">
              {forecastData.model_type}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Lag(7,14,30) + Rolling Mean/Std</span>
          </div>
        </div>
      )}

      {/* 3. Main Multi-Horizon Forecast Chart with CI Ribbon */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Historical Actuals vs Future Machine Learning Projection</h3>
            <p className="text-xs text-slate-400">Green solid line = historical; Cyan dashed line = projected; Shaded ribbon = 95% Confidence Interval</p>
          </div>

          <button
            onClick={() => onAskAI(`What are the key drivers behind the ${horizon}-day revenue forecast of ₹${forecastData?.projected_revenue_cr} Cr?`)}
            className="px-3 py-1.5 rounded-xl bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI: Explain Forecast Drivers</span>
          </button>
        </div>

        <div className="h-80 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-brand-emerald border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
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
                  formatter={(val, name) => [`₹${Number(val).toLocaleString()}`, name === 'actual' ? 'Actual Revenue' : name === 'predicted' ? 'ML Projected Revenue' : name]}
                />
                <Legend />
                {/* Confidence Interval Ribbon */}
                <Area type="monotone" dataKey="upper_95" stroke="none" fill="url(#ciGrad)" name="95% CI Upper Bound" />
                <Area type="monotone" dataKey="lower_95" stroke="none" fill="transparent" name="95% CI Lower Bound" />
                
                {/* Actual Historical Line */}
                <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2.5} dot={false} name="Actual Revenue" />
                {/* Future Forecast Line */}
                <Line type="monotone" dataKey="predicted" stroke="#06B6D4" strokeWidth={2.5} strokeDasharray="5 5" dot={false} name="Forecast Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
