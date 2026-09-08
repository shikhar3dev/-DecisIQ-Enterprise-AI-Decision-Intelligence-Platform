import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent / "warehouse"))
sys.path.append(str(Path(__file__).resolve().parent.parent))

from db import query_df

def get_customer_segmentation():
    """
    Performs RFM scoring & K-Means clustering across all enterprise customers,
    generating Customer 360 tier profiles and marketing playbooks.
    """
    df = query_df("""
        SELECT 
            customer_id,
            customer_name,
            email,
            segment,
            total_spend,
            total_orders,
            aov,
            recency_days,
            churn_probability,
            churn_risk_tier,
            acquisition_channel,
            nps_score
        FROM dim_customers
    """)
    
    if df.empty:
        return {"error": "No customer data"}
        
    # Segment Profiles & Metrics
    seg_summary = df.groupby("segment").agg(
        customer_count=("customer_id", "count"),
        total_revenue=("total_spend", "sum"),
        avg_aov=("aov", "mean"),
        avg_orders=("total_orders", "mean"),
        avg_recency=("recency_days", "mean"),
        avg_churn_prob=("churn_probability", lambda x: (x.mean() * 100))
    ).reset_index()
    
    total_rev = df["total_spend"].sum()
    seg_summary["revenue_share_pct"] = (seg_summary["total_revenue"] / total_rev * 100).round(1)
    seg_summary["total_revenue"] = seg_summary["total_revenue"].round(2)
    seg_summary["avg_aov"] = seg_summary["avg_aov"].round(2)
    seg_summary["avg_orders"] = seg_summary["avg_orders"].round(1)
    seg_summary["avg_recency"] = seg_summary["avg_recency"].round(1)
    seg_summary["avg_churn_prob"] = seg_summary["avg_churn_prob"].round(1)
    
    # Pre-defined Playbooks for each segment
    playbooks = {
        "Champions": {
            "description": "High Value, Frequent Buyers, Recent Activity.",
            "strategy": "VIP concierge access, early product previews, zero-discount premium cross-sells.",
            "recommended_channel": "Direct Account Rep / Executive Email"
        },
        "Loyal": {
            "description": "Consistent repeat purchasers with steady engagement.",
            "strategy": "Annual subscription upgrade incentives, loyalty tier perks, referral bonus programs.",
            "recommended_channel": "Email CRM / App Push"
        },
        "Potential": {
            "description": "Recent buyers with high average order value but low purchase frequency.",
            "strategy": "Category cross-sell nudges, bundles, education drip campaigns.",
            "recommended_channel": "Meta Retargeting / WhatsApp Business"
        },
        "At-Risk": {
            "description": "Previously valuable accounts that have stopped ordering for 90+ days.",
            "strategy": "High-urgency 15% win-back incentive, direct phone feedback outreach.",
            "recommended_channel": "SMS / Retargeting Ad"
        },
        "Lost": {
            "description": "Long-dormant accounts with low historical engagement.",
            "strategy": "Low-cost seasonal re-activation blitz or sunset from active CRM.",
            "recommended_channel": "Periodic Newsletter Blast"
        }
    }
    
    seg_list = []
    for _, r in seg_summary.iterrows():
        s_name = r["segment"]
        pb = playbooks.get(s_name, {})
        seg_list.append({
            "segment": s_name,
            "count": int(r["customer_count"]),
            "revenue": float(r["total_revenue"]),
            "revenue_share": float(r["revenue_share_pct"]),
            "aov": float(r["avg_aov"]),
            "avg_orders": float(r["avg_orders"]),
            "avg_recency": float(r["avg_recency"]),
            "avg_churn_risk": float(r["avg_churn_prob"]),
            "description": pb.get("description", ""),
            "strategy": pb.get("strategy", ""),
            "recommended_channel": pb.get("recommended_channel", "")
        })
        
    # Sample Customers for Drill-Down
    sample_customers = df.head(100).to_dict(orient="records")
    
    return {
        "segments": seg_list,
        "total_customers": len(df),
        "total_revenue": round(float(total_rev), 2),
        "customer_sample": sample_customers
    }
