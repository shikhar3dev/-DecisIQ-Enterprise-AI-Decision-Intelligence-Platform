import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent / "warehouse"))
sys.path.append(str(Path(__file__).resolve().parent.parent))

from db import query_df

def detect_anomalies():
    """
    Executes multi-metric Anomaly Detection (Isolation Forest + Rolling Z-Score)
    over daily revenue, conversion rates, and returns.
    """
    df = query_df("""
        SELECT 
            date,
            revenue,
            orders,
            aov,
            gross_margin_pct,
            cart_abandons,
            website_visitors,
            conversion_rate,
            return_rate_pct,
            is_anomaly,
            anomaly_severity,
            anomaly_reason
        FROM fact_daily_business_pulse
        ORDER BY date ASC
    """)
    
    if df.empty:
        return {"error": "No pulse data found"}
        
    df["date"] = pd.to_datetime(df["date"])
    
    # Feature matrix for Isolation Forest
    features = ["revenue", "orders", "aov", "conversion_rate", "return_rate_pct", "cart_abandons"]
    X = df[features].copy()
    
    # Isolation Forest
    iso = IsolationForest(contamination=0.03, n_jobs=1, random_state=42)
    df["iso_score"] = iso.fit_predict(X)
    
    # Rolling Z-score on revenue (7-day window)
    rolling_mean = df["revenue"].rolling(window=7, min_periods=3).mean()
    rolling_std = df["revenue"].rolling(window=7, min_periods=3).std().replace(0, 1)
    df["rev_z_score"] = ((df["revenue"] - rolling_mean) / rolling_std).fillna(0)
    
    # Tag anomalies: either flagged by system seed, IsolationForest (-1), or |Z| > 2.5
    anomalies = []
    
    for _, row in df.iterrows():
        is_anom = (row["is_anomaly"] == 1) or (row["iso_score"] == -1 and abs(row["rev_z_score"]) > 2.2)
        if is_anom:
            sev = row["anomaly_severity"] if row["anomaly_severity"] != "Normal" else ("Critical" if abs(row["rev_z_score"]) > 3.0 else "Moderate")
            reason = row["anomaly_reason"]
            if not reason:
                if row["rev_z_score"] < -2.0:
                    reason = f"Sudden Revenue Drop of {abs(row['rev_z_score']):.1f} std deviations"
                elif row["return_rate_pct"] > 8.0:
                    reason = f"Abnormal Return Rate Spike ({row['return_rate_pct']}%)"
                else:
                    reason = "Multi-variate telemetry anomaly detected by Isolation Forest"
                    
            anomalies.append({
                "date": row["date"].strftime("%Y-%m-%d"),
                "revenue": float(row["revenue"]),
                "orders": int(row["orders"]),
                "aov": float(row["aov"]),
                "conversion_rate": float(row["conversion_rate"]),
                "return_rate_pct": float(row["return_rate_pct"]),
                "z_score": round(float(row["rev_z_score"]), 2),
                "severity": sev,
                "reason": reason,
                "investigation_status": "Resolved" if row["date"].year < 2025 or (row["date"].year == 2025 and row["date"].month < 10) else "Action Required"
            })
            
    # Timeline data for chart
    timeline = []
    for _, r in df.tail(120).iterrows():
        timeline.append({
            "date": r["date"].strftime("%Y-%m-%d"),
            "revenue": float(r["revenue"]),
            "orders": int(r["orders"]),
            "conversion_rate": float(r["conversion_rate"]),
            "return_rate_pct": float(r["return_rate_pct"]),
            "is_anomaly": 1 if any(a["date"] == r["date"].strftime("%Y-%m-%d") for a in anomalies) else 0
        })
        
    return {
        "total_anomalies_detected": len(anomalies),
        "critical_count": sum(1 for a in anomalies if a["severity"] == "Critical"),
        "moderate_count": sum(1 for a in anomalies if a["severity"] == "Moderate"),
        "recent_anomalies": anomalies[-10:],
        "all_anomalies": anomalies,
        "timeline": timeline
    }
