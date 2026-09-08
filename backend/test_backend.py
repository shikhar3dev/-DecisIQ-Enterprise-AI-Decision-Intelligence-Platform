import sys
from pathlib import Path

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(str(Path(__file__).resolve().parent))
sys.path.append(str(Path(__file__).resolve().parent / "warehouse"))
sys.path.append(str(Path(__file__).resolve().parent / "analytics"))
sys.path.append(str(Path(__file__).resolve().parent / "ml_engine"))
sys.path.append(str(Path(__file__).resolve().parent / "simulator"))
sys.path.append(str(Path(__file__).resolve().parent / "ai_agent"))

from kpi_engine import get_executive_kpis
from forecaster import train_and_forecast_revenue
from churn_model import train_and_score_churn
from anomaly_detector import detect_anomalies
from scenario_engine import simulate_price_change
from assistant import process_natural_language_query

print("[*] Testing KPI Engine...", flush=True)
kpis = get_executive_kpis()
print(f"    Total Revenue: {kpis['revenue_cr']} Cr | Growth: {kpis['revenue_growth_mom']}% | Alerts: {len(kpis['alerts'])}", flush=True)

print("[*] Testing Time-Series Forecaster...", flush=True)
fc = train_and_forecast_revenue(30)
print(f"    Horizon: {fc['horizon_days']} days | Projected: {fc['projected_revenue_cr']} Cr | Confidence: {fc['metrics']['confidence_score']}%", flush=True)

print("[*] Testing Supervised Churn Model...", flush=True)
ch = train_and_score_churn()
print(f"    Model: {ch['model_metrics']['model']} | ROC-AUC: {ch['model_metrics']['roc_auc']} | High Risk: {len(ch['high_risk_customers'])}", flush=True)

print("[*] Testing Anomaly Detector Radar...", flush=True)
anom = detect_anomalies()
print(f"    Anomalies Detected: {anom['total_anomalies_detected']} | Critical: {anom['critical_count']}", flush=True)

print("[*] Testing Scenario Simulator...", flush=True)
sim = simulate_price_change("Overall", 5.0)
print(f"    Price +5% => Profit: {sim['deltas']['profit_pct']:+g}% | Verdict: {sim['executive_verdict']}", flush=True)

print("[*] Testing 'Ask Your Data' AI Assistant...", flush=True)
resp = process_natural_language_query("Why did revenue decrease last month?")
print(f"    AI Summary: {resp['executive_summary']}", flush=True)

print("[+] All Core Decision Engines Verified and Operational!", flush=True)
