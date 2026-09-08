import React, { useState } from 'react';
import { 
  ArrowRight, Check, Sparkles, AlertCircle, RefreshCw, 
  CheckCircle2, HelpCircle, Layers, Database 
} from 'lucide-react';

export default function SchemaMapper({ schemaDetection, onConfirmMapping, loading }) {
  if (!schemaDetection) return null;

  const [mappings, setMappings] = useState(schemaDetection.suggested_mappings || {});
  const [datasetName, setDatasetName] = useState('My Custom Business Dataset');

  const targetFields = [
    { key: "unmapped", label: "-- Do Not Map (Ignore) --", desc: "Ignore this column" },
    { key: "revenue", label: "Revenue / Metric Value / Amount", desc: "Primary numeric metric (sales, values, targets)" },
    { key: "order_date", label: "Order Date / Timestamp", desc: "Timestamp for Time-Series forecasting and trends" },
    { key: "order_id", label: "Order ID (Unique ID)", desc: "Primary transaction / invoice identifier" },
    { key: "customer_id", label: "Customer ID / Account", desc: "Account / User identifier for Churn & RFM" },
    { key: "customer_name", label: "Customer Name", desc: "Client / Account full name" },
    { key: "quantity", label: "Quantity / Units Sold", desc: "Number of units purchased" },
    { key: "cogs", label: "COGS / Cost Amount", desc: "Direct product or fulfillment cost" },
    { key: "product_id", label: "Product ID / Series Code", desc: "Unique SKU or time-series code" },
    { key: "product_name", label: "Product Name / Title", desc: "Product display name" },
    { key: "category", label: "Category / Series Type", desc: "Product category / Department" },
    { key: "region", label: "Region / Market Territory", desc: "Geographic territory for regional SLA" },
    { key: "channel", label: "Acquisition Channel", desc: "Marketing source (Google, Meta, Organic, etc.)" },
    { key: "status", label: "Order Status", desc: "Delivery / fulfillment status" },
    { key: "payment_method", label: "Payment Method", desc: "Credit Card, UPI, Invoicing, etc." }
  ];

  const handleFieldChange = (sourceCol, targetKey) => {
    setMappings(prev => ({
      ...prev,
      [sourceCol]: targetKey
    }));
  };

  const mappedCount = Object.values(mappings).filter(v => v !== "unmapped").length;

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6 border border-white/10">
      {/* 1. Header & Dataset Name */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-emerald" />
            <span>Automatic Schema Mapping & Field Alignment</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            DecisIQ auto-matched {mappedCount} columns with high confidence. Review or customize fields below.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            placeholder="Dataset Name..."
            className="bg-obsidian-800 text-xs text-white px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* 2. Column Mapping Grid */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {schemaDetection.columns?.map((col, idx) => {
          const mappedTarget = mappings[col] || "unmapped";
          const confidence = schemaDetection.field_confidences?.[col] || 0;
          const isMapped = mappedTarget !== "unmapped";

          return (
            <div 
              key={idx} 
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isMapped 
                  ? 'bg-obsidian-800/90 border-brand-emerald/30' 
                  : 'bg-obsidian-800/40 border-white/5 opacity-70'
              }`}
            >
              {/* Source Column */}
              <div className="flex items-center gap-3 min-w-0 sm:w-1/3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                  isMapped ? 'bg-brand-emerald/20 text-brand-emerald' : 'bg-slate-800 text-slate-500'
                }`}>
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{col}</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Source CSV Header
                  </div>
                </div>
              </div>

              {/* Arrow Indicator */}
              <div className="hidden sm:flex items-center justify-center text-slate-600">
                <ArrowRight className="w-4 h-4" />
              </div>

              {/* Target Schema Selector */}
              <div className="flex items-center gap-3 sm:w-1/2">
                <select
                  value={mappedTarget}
                  onChange={(e) => handleFieldChange(col, e.target.value)}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none font-sans font-medium ${
                    isMapped 
                      ? 'bg-obsidian-900 text-brand-emerald border-brand-emerald/40' 
                      : 'bg-obsidian-900 text-slate-400 border-white/10'
                  }`}
                >
                  {targetFields.map((tf) => (
                    <option key={tf.key} value={tf.key}>
                      {tf.label}
                    </option>
                  ))}
                </select>

                {confidence > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                    {confidence}% Match
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
        <div className="text-xs text-slate-400">
          Mapped <strong className="text-white">{mappedCount}</strong> of {schemaDetection.columns?.length} source columns to DecisIQ warehouse.
        </div>

        <button
          onClick={() => onConfirmMapping(mappings, datasetName)}
          disabled={loading || mappedCount === 0}
          className="px-6 py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-400 disabled:opacity-50 text-obsidian-900 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-glow-emerald"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-obsidian-900 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>Ingest & Run Decision Intelligence</span>
        </button>
      </div>
    </div>
  );
}
