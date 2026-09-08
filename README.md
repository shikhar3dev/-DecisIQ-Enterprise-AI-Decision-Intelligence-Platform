# 🏆 DecisIQ: Enterprise AI Decision Intelligence Platform
### *A Production-Grade Decision Intelligence System for Business Performance Optimization*

---

## 🌟 Executive Overview

**DecisIQ** is an end-to-end analytical and decision intelligence system engineered to answer the four fundamental enterprise questions:

$$\text{\textbf{What Happened?}} \longrightarrow \text{\textbf{Why Did It Happen?}} \longrightarrow \text{\textbf{What Will Happen Next?}} \longrightarrow \text{\textbf{What Should the Business Do?}}$$

Unlike traditional descriptive dashboards that merely plot historical metrics, DecisIQ bridges a **Star-Schema SQL Data Warehouse**, **Machine Learning Engines** (Time-Series Forecasting, Supervised Churn Defense, Isolation Forest Anomaly Radar, RFM Segmentation), an **Interactive Scenario Simulator**, and an **Autonomous Decision Assistant** that diagnoses driver variance and prescribes high-impact financial playbooks.

---

## 🏛️ System Architecture

```text
                               RAW ENTERPRISE DATA
                                       │
                  ┌────────────────────┼────────────────────┐
                  ▼                    ▼                    ▼
             Sales Data          Customer Data       Marketing Data
                  │                    │                    │
                  └────────────────────┼────────────────────┘
                                       ▼
                       STAR-SCHEMA SQL DATA WAREHOUSE
                        (DuckDB / SQLite / PostgreSQL)
                                       │
               ┌───────────────────────┴───────────────────────┐
               ▼                                               ▼
   ANALYTICS & BI ENGINE                           MACHINE LEARNING ENGINE
• SQL Views & Aggregations                     • Multi-Horizon Time-Series Forecast
• Cohort & RFM Matrices                        • Supervised Churn Classifier (RF)
• Waterfall Variance (Volume vs Price)         • Anomaly Detection Radar (Isolation Forest)
• Marketing Multi-Touch Attribution            • Customer 360 RFM Clustering
               │                                               │
               └───────────────────────┬───────────────────────┘
                                       ▼
                     AI DECISION ASSISTANT & ROOT-CAUSE LAYER
               • Multi-Dimensional Driver Breakdown
               • 4-Tier Structured Synthesis
               • Prescriptive Action Recommendations
                                       │
               ┌───────────────────────┴───────────────────────┐
               ▼                                               ▼
    "WHAT-IF" SCENARIO SIMULATOR               EXECUTIVE COMMAND CENTER (UI)
• Price Elasticity Modeling (PED)              • Obsidian Dark Glassmorphic Cockpit
• Retention Coupon ROI Simulator               • Real-Time Forecast & Anomaly Visualizer
• Ad Budget Reallocation Optimizer             • Customer 360 Win-Back Queues
• Supply Chain / COGS Stress Test              • 1-Click Power BI & Dossier Exporter
```

---

## 🚀 Key Features

### 1. Executive Command Center
- **High-Level KPI Telemetry**: Real-time tracking of Monthly Net Revenue, Active Customer Count, AOV, Gross Margin %, and Average Churn Risk.
- **Active Risk Radar**: Proactive alerts flagging high-value account inactivity, regional logistics bottlenecks, and negative ROAS ad campaigns.
- **Multi-Dimensional Slice**: Category profitability matrices and regional delivery SLA tracking across 5 national hubs.

### 2. "Ask Your Data" AI Decision Assistant
- **Root-Cause Waterfall Decomposition**: Converts natural-language inquiries into SQL aggregations and breaks down variance across Customer Segments, Categories, Regions, and Price Realization.
- **4-Tier Structured Synthesis**:
  1. **What Happened?** (Executive summary with exact figures and % variance)
  2. **Why Did It Happen?** (Hierarchical driver waterfall breakdown)
  3. **What Will Happen Next?** (Predictive ML projection & risk compounding)
  4. **Recommended Business Actions** (Prioritized P1/P2/P3 strategic playbooks with projected financial ROI)

### 3. Customer 360 & ML Churn Defense
- **RFM Segmentation**: Automated classification into *Champions, Loyal, Potential, At-Risk, and Lost* tiers.
- **Supervised Churn Model**: Random Forest Classifier trained on recency, frequency, monetary value, support tickets, cart abandonments, and NPS.
- **Actionable Win-Back Queues**: Individual account drill-down with personalized retention playbooks.

### 4. Predictive Time-Series Forecasting
- **Multi-Horizon Projections**: 30, 60, and 90-day future daily revenue and demand trajectories.
- **Confidence Intervals**: 95% and 80% uncertainty ribbons computed via residual standard errors.
- **Feature Engineering**: Cyclical day-of-week / month encodings, moving averages, and lag features ($t-7, t-14, t-30$).

### 5. Automated Anomaly Radar
- **Multi-Metric Isolation Forest + Rolling Z-Score**: Flags sudden revenue drops, return rate spikes, and checkout funnel collapses.
- **Instant Root-Cause Attribution**: Isolates external events such as payment gateway outages or logistics supply shocks.

### 6. Marketing Attribution & Budget Optimizer
- **Multi-Touch ROI & ROAS**: Tracks channel efficiency across Google Search, Meta Ads, LinkedIn, YouTube, and Email CRM.
- **Waste Spend Detector**: Identifies negative-margin campaigns for immediate budget reallocation.

### 7. Strategic "What-If" Scenario Simulator
- **Price Elasticity Modeling**: Simulates price adjustments ($-15\%$ to $+20\%$) across product categories using empirical PED coefficients.
- **Retention Win-Back Simulator**: Models expected customer reactivation rates vs discount costs to calculate Net Campaign ROI.
- **Budget Reallocation Optimizer**: Simulates shifting ad spend from low-ROAS to high-ROAS channels.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Database & Warehousing** | SQLite / DuckDB Star-Schema (`dim_customers`, `dim_products`, `dim_regions`, `dim_marketing_campaigns`, `fact_orders`, `fact_order_items`, `fact_daily_business_pulse`) |
| **Backend & Analytical APIs** | Python, FastAPI, Uvicorn, Pandas, NumPy |
| **Machine Learning** | Scikit-Learn (Ridge, RandomForestClassifier, IsolationForest, StandardScaler) |
| **Business Intelligence** | Advanced SQL (CTEs, Window Functions, NTILE, LAG/LEAD), Power BI DAX Measures |
| **Executive Frontend UI** | React 18, Vite, TailwindCSS (Obsidian Dark Glassmorphic Design), Recharts, Lucide Icons |

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Launch the Entire Platform (One Click)
On Windows, simply double-click:
```cmd
run_platform.bat
```
Or start manually:

**Terminal 1 — Backend:**
```bash
python backend/app.py
```
*API running at: `http://127.0.0.1:8000` (Docs: `http://127.0.0.1:8000/docs`)*

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*Executive UI running at: `http://localhost:5173`*

---

## 💼 Project Portfolio & Interview Talk-Track

> *"I engineered an end-to-end Decision Intelligence Platform that integrates 50,000+ enterprise transactions into a star-schema analytical warehouse. The platform uses advanced SQL and machine learning (time-series forecasting, supervised churn classification, and Isolation Forest anomaly radar) paired with a natural language engine that performs multi-dimensional waterfall root-cause analysis and interactive what-if scenario simulation."*
#   I n t e r n a l - L i n k - F e t c h e r  
 