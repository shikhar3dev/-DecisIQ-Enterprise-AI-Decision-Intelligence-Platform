import React, { useState } from 'react';
import { 
  Sparkles, Send, Bot, User, ArrowDownRight, ArrowUpRight, 
  CheckCircle2, AlertTriangle, TrendingUp, Code2, Database,
  CornerDownRight, RefreshCw, ChevronRight, Zap, Target
} from 'lucide-react';
import { postAskData } from '../services/api';

export default function AskYourDataAI({ initialQuery }) {
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      type: 'welcome',
      content: "Hello! I am your Enterprise Decision Intelligence Assistant. Ask any business question to uncover **What happened**, **Why it happened**, **What will happen next**, and **What your business should do**."
    }
  ]);
  const [showSql, setShowSql] = useState({});

  const samplePrompts = [
    "Why did revenue decrease last month?",
    "Which customers are most likely to churn and why?",
    "What happens if we increase prices by 5%?",
    "Which marketing campaign is wasting money?",
    "Forecast revenue for next month"
  ];

  const handleSend = async (queryText) => {
    const q = queryText || query;
    if (!q.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setQuery('');
    setLoading(true);

    try {
      const response = await postAskData(q);
      setMessages([...newMessages, { role: 'assistant', data: response }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `Error connecting to Decision Intelligence Engine: ${err.message}. Please verify the FastAPI backend is online.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-brand-emerald mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">AI Decision Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Ask Your Data & Root-Cause Investigator</h2>
          <p className="text-xs text-slate-400 mt-1">
            Transforms natural-language inquiries into SQL aggregations, multi-dimensional waterfall driver analysis, and prescriptive ROI playbooks.
          </p>
        </div>

        {/* Suggested Quick Prompts */}
        <div className="flex flex-wrap gap-2">
          {samplePrompts.slice(0, 3).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all text-left flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3 text-brand-emerald" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Conversational Stream */}
      <div className="space-y-6 min-h-[480px]">
        {messages.map((msg, idx) => (
          <div key={idx} className="space-y-4">
            {msg.role === 'user' ? (
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-brand-emerald/10 border border-brand-emerald/30 text-emerald-200 px-4 py-3 rounded-2xl max-w-xl text-sm">
                  {msg.content}
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-emerald/20 border border-brand-emerald/40 flex items-center justify-center text-brand-emerald flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>
            ) : msg.type === 'welcome' ? (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="glass-panel p-5 rounded-2xl max-w-2xl text-sm text-slate-300 space-y-3">
                  <p>{msg.content}</p>
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-xs font-semibold text-slate-400 block mb-2">Try asking:</span>
                    <div className="flex flex-wrap gap-2">
                      {samplePrompts.map((p, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSend(p)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-brand-cyan border border-brand-cyan/20 transition-colors"
                        >
                          "{p}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : msg.data ? (
              /* Structured 4-Tier Decision Intelligence Card */
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-emerald/20 border border-brand-emerald/40 flex items-center justify-center text-brand-emerald flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="glass-panel p-6 rounded-2xl flex-1 space-y-6 border border-white/10 shadow-glass">
                  {/* Executive Summary Banner */}
                  <div className="p-4 rounded-xl bg-obsidian-800/90 border border-white/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-brand-emerald uppercase tracking-wider font-semibold">
                        Executive Analysis Result
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/5 font-mono text-slate-400">
                        Intent: {msg.data.intent}
                      </span>
                    </div>
                    <p className="text-base text-white font-medium">
                      {msg.data.executive_summary}
                    </p>
                  </div>

                  {/* The 4-Tier Breakdown Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tier 1: What Happened? */}
                    {msg.data.what_happened && (
                      <div className="p-5 rounded-xl bg-obsidian-800/60 border border-white/5 space-y-3">
                        <div className="flex items-center gap-2 text-brand-cyan">
                          <Target className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">1. What Happened?</h4>
                        </div>
                        <div className="space-y-2 text-xs">
                          {Object.entries(msg.data.what_happened).map(([k, v], kIdx) => (
                            <div key={kIdx} className="flex items-center justify-between py-1 border-b border-white/5">
                              <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}:</span>
                              <strong className="text-white font-mono">{String(v)}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tier 2: Why Did It Happen? (Waterfall Drivers) */}
                    {msg.data.why_it_happened && (
                      <div className="p-5 rounded-xl bg-obsidian-800/60 border border-white/5 space-y-3">
                        <div className="flex items-center gap-2 text-brand-amber">
                          <AlertTriangle className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">2. Why Did It Happen?</h4>
                        </div>
                        <p className="text-xs text-slate-300 font-medium">{msg.data.why_it_happened.title}</p>
                        <div className="space-y-2">
                          {msg.data.why_it_happened.drivers?.map((drv, dIdx) => (
                            <div key={dIdx} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-200">{drv.factor}</span>
                                <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                  String(drv.impact).includes('-') ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                  {drv.impact}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">{drv.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tier 3: What Will Happen Next? */}
                    {msg.data.what_will_happen_next && (
                      <div className="p-5 rounded-xl bg-obsidian-800/60 border border-white/5 space-y-3">
                        <div className="flex items-center gap-2 text-brand-violet">
                          <TrendingUp className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">3. What Will Happen Next?</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {msg.data.what_will_happen_next.forecast_summary}
                        </p>
                        {msg.data.what_will_happen_next.projected_30d_loss && (
                          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs flex items-center justify-between">
                            <span className="text-slate-300">Projected 30-Day Inaction Loss:</span>
                            <span className="font-mono font-bold text-rose-400">{msg.data.what_will_happen_next.projected_30d_loss}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tier 4: Recommended Strategic Actions */}
                    {msg.data.recommended_actions && (
                      <div className="p-5 rounded-xl bg-obsidian-800/60 border border-white/5 space-y-3">
                        <div className="flex items-center gap-2 text-brand-emerald">
                          <CheckCircle2 className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">4. Recommended Business Actions</h4>
                        </div>
                        <div className="space-y-2.5">
                          {msg.data.recommended_actions.map((act, aIdx) => (
                            <div key={aIdx} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-white flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full bg-brand-emerald/20 text-brand-emerald flex items-center justify-center text-[10px] font-bold">
                                    {act.priority || aIdx + 1}
                                  </span>
                                  {act.title}
                                </span>
                                <span className="text-[10px] font-mono text-brand-emerald px-1.5 py-0.5 rounded bg-brand-emerald/10">
                                  {act.expected_impact || act.expected_roi}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 pl-5">{act.action}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SQL & Methodology Inspector Accordion */}
                  {msg.data.sql_executed && (
                    <div className="pt-3 border-t border-white/5">
                      <button 
                        onClick={() => setShowSql(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>{showSql[idx] ? "Hide SQL Analytical Query" : "View SQL Analytical Query Executed"}</span>
                      </button>
                      {showSql[idx] && (
                        <pre className="mt-2 p-3 rounded-lg bg-obsidian-900 text-brand-cyan text-xs font-mono overflow-x-auto border border-white/5">
                          {msg.data.sql_executed}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="glass-panel p-4 rounded-2xl max-w-xl text-sm text-slate-300">
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-emerald/20 border border-brand-emerald/40 flex items-center justify-center text-brand-emerald flex-shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="glass-panel px-5 py-4 rounded-2xl flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-brand-emerald border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-mono text-slate-300">Executing SQL multi-dimensional variance analysis & ML model inference...</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Input Console */}
      <div className="glass-panel p-3 rounded-2xl flex items-center gap-3 border border-white/10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a decision question (e.g. 'Why did revenue fall in North region?', 'Predict next quarter revenue', 'What if we raise prices 5%?')..."
          className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-400 disabled:opacity-50 text-obsidian-900 font-semibold text-xs flex items-center gap-2 transition-all shadow-glow-emerald"
        >
          <span>Investigate</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
