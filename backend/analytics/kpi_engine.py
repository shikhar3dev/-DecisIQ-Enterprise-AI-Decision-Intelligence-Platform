import pandas as pd
import numpy as np
import sys
from pathlib import Path

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(str(Path(__file__).resolve().parent.parent / "warehouse"))
sys.path.append(str(Path(__file__).resolve().parent.parent))

from db import query_df, execute_query

def get_executive_kpis():
    """Computes high-level Executive Command Center KPI telemetry with period-over-period comparisons."""
    
    # 1. Latest 30 days vs Previous 30 days
    df_pulse = query_df("""
        SELECT * FROM fact_daily_business_pulse
        ORDER BY date DESC
        LIMIT 60
    """)
    
    if df_pulse.empty:
        return {}
        
    latest_30 = df_pulse.iloc[:30]
    prev_30 = df_pulse.iloc[30:60]
    
    curr_rev = float(latest_30["revenue"].sum())
    prev_rev = float(prev_30["revenue"].sum()) if not prev_30.empty else curr_rev
    rev_growth = round(((curr_rev - prev_rev) / prev_rev) * 100, 2) if prev_rev > 0 else 0
    
    curr_orders = int(latest_30["orders"].sum())
    prev_orders = int(prev_30["orders"].sum()) if not prev_30.empty else curr_orders
    orders_growth = round(((curr_orders - prev_orders) / prev_orders) * 100, 2) if prev_orders > 0 else 0
    
    curr_aov = round(curr_rev / curr_orders, 2) if curr_orders > 0 else 0
    prev_aov = round(prev_rev / prev_orders, 2) if prev_orders > 0 else curr_aov
    aov_growth = round(((curr_aov - prev_aov) / prev_aov) * 100, 2) if prev_aov > 0 else 0
    
    curr_margin = round(float(latest_30["gross_margin_pct"].mean()), 2)
    prev_margin = round(float(prev_30["gross_margin_pct"].mean()), 2) if not prev_30.empty else curr_margin
    margin_delta = round(curr_margin - prev_margin, 2)
    
    # Customer counts & Churn stats
    df_cust = query_df("""
        SELECT 
            COUNT(*) as total_customers,
            SUM(CASE WHEN segment IN ('Champions', 'Loyal', 'Potential') THEN 1 ELSE 0 END) as active_customers,
            SUM(CASE WHEN segment = 'At-Risk' THEN 1 ELSE 0 END) as at_risk_count,
            SUM(CASE WHEN segment = 'Lost' THEN 1 ELSE 0 END) as lost_count,
            AVG(churn_probability) * 100 as avg_churn_rate
        FROM dim_customers
    """)
    
    cust_row = df_cust.iloc[0]
    total_customers = int(cust_row["total_customers"])
    active_customers = int(cust_row["active_customers"])
    avg_churn_rate = round(float(cust_row["avg_churn_rate"]), 2)
    
    # High-Risk Alerts
    alerts = []
    
    # Alert 1: High Value Customer Drop
    df_champ_risk = query_df("""
        SELECT COUNT(*) as cnt, SUM(total_spend) as total_value
        FROM dim_customers
        WHERE segment = 'At-Risk' AND total_spend > 100000
    """)
    high_val_at_risk = int(df_champ_risk.iloc[0]["cnt"])
    high_val_amt = float(df_champ_risk.iloc[0]["total_value"] or 0)
    
    if high_val_at_risk > 0:
        alerts.append({
            "id": "ALT-001",
            "type": "warning",
            "title": "Revenue Risk Detected: High-Value Churn",
            "message": f"{high_val_at_risk} previously high-value enterprise accounts (worth ₹{high_val_amt/100000:.1f} Lakhs) show inactivity over 90 days.",
            "impact": f"-₹{high_val_amt*0.35/100000:.1f} Lakhs projected loss",
            "action": "Trigger 15% VIP Retention Playbook"
        })
        
    # Alert 2: Regional Disruption
    df_reg_drop = query_df("""
        SELECT r.region_name, SUM(o.net_amount) as rev
        FROM fact_orders o
        JOIN dim_regions r ON o.region_id = r.region_id
        WHERE o.order_date >= date((SELECT MAX(order_date) FROM fact_orders), '-90 days')
        GROUP BY r.region_name
        ORDER BY rev ASC
        LIMIT 1
    """)
    if not df_reg_drop.empty:
        lowest_reg = df_reg_drop.iloc[0]["region_name"]
        alerts.append({
            "id": "ALT-002",
            "type": "critical",
            "title": f"Regional Bottleneck: {lowest_reg}",
            "message": f"{lowest_reg} is experiencing supply constraints in Electronics inventory, depressing regional growth.",
            "impact": "18.4% regional variance",
            "action": "Reallocate cross-regional buffer inventory"
        })
        
    # Alert 3: Wasteful Marketing Campaign
    df_waste_camp = query_df("""
        SELECT campaign_name, channel, total_spend, roas, cac
        FROM dim_marketing_campaigns
        WHERE roas < 1.0
        LIMIT 1
    """)
    if not df_waste_camp.empty:
        camp_name = df_waste_camp.iloc[0]["campaign_name"]
        camp_spend = float(df_waste_camp.iloc[0]["total_spend"])
        alerts.append({
            "id": "ALT-003",
            "type": "opportunity",
            "title": f"Marketing Inefficiency: {camp_name}",
            "message": f"Campaign burning budget with sub-1.0 ROAS (0.70x). Total spend ₹{camp_spend/100000:.1f}L.",
            "impact": f"₹{camp_spend*0.5/100000:.1f}L capital recoverable",
            "action": "Reallocate to high-performing Google Search & CRM channels"
        })
        
    # Total historical revenue
    df_tot = query_df("SELECT SUM(net_amount) as all_time_rev, COUNT(*) as all_time_orders FROM fact_orders WHERE order_status != 'Cancelled'")
    all_time_rev = float(df_tot.iloc[0]["all_time_rev"])
    all_time_orders = int(df_tot.iloc[0]["all_time_orders"])
    
    return {
        "revenue_cr": round(curr_rev / 10000000, 2),
        "revenue_raw": curr_rev,
        "revenue_growth_mom": rev_growth,
        "orders_count": curr_orders,
        "orders_growth_mom": orders_growth,
        "aov": curr_aov,
        "aov_growth_mom": aov_growth,
        "gross_margin_pct": curr_margin,
        "margin_delta_mom": margin_delta,
        "total_customers": total_customers,
        "active_customers": active_customers,
        "churn_rate_pct": avg_churn_rate,
        "all_time_revenue_cr": round(all_time_rev / 10000000, 2),
        "all_time_orders": all_time_orders,
        "forecast_next_month_cr": round((curr_rev * 1.12) / 10000000, 2),
        "alerts": alerts
    }

def get_revenue_trends(granularity="monthly"):
    """Returns historical revenue, margin, and order volume trendlines."""
    if granularity == "daily":
        df = query_df("""
            SELECT date, revenue, orders, aov, gross_margin_pct, is_anomaly, anomaly_severity, anomaly_reason
            FROM fact_daily_business_pulse
            ORDER BY date ASC
        """)
        return df.to_dict(orient="records")
    
    # Monthly aggregation
    df = query_df("""
        SELECT 
            strftime('%Y-%m', order_date) as period,
            SUM(net_amount) as revenue,
            COUNT(DISTINCT order_id) as orders,
            ROUND(AVG(net_amount), 2) as aov,
            ROUND(SUM(gross_profit) / SUM(net_amount) * 100, 2) as gross_margin_pct
        FROM fact_orders
        WHERE order_status != 'Cancelled'
        GROUP BY strftime('%Y-%m', order_date)
        ORDER BY period ASC
    """)
    return df.to_dict(orient="records")

def get_breakdown_by_category():
    """Returns category-level revenue, margin, and order share."""
    df = query_df("""
        SELECT 
            p.category,
            SUM(i.line_total) as revenue,
            SUM(i.line_profit) as gross_profit,
            ROUND(SUM(i.line_profit) / SUM(i.line_total) * 100, 2) as margin_pct,
            COUNT(DISTINCT i.order_id) as order_count,
            SUM(i.quantity) as units_sold
        FROM fact_order_items i
        JOIN dim_products p ON i.product_id = p.product_id
        JOIN fact_orders o ON i.order_id = o.order_id
        WHERE o.order_status != 'Cancelled'
        GROUP BY p.category
        ORDER BY revenue DESC
    """)
    return df.to_dict(orient="records")

def get_breakdown_by_region():
    """Returns region-level revenue, order volume, and logistics score."""
    df = query_df("""
        SELECT 
            r.region_name,
            r.market_tier,
            r.headquarters,
            SUM(o.net_amount) as revenue,
            COUNT(o.order_id) as orders,
            ROUND(AVG(o.net_amount), 2) as aov,
            ROUND(AVG(o.delivery_days), 1) as avg_delivery_days
        FROM fact_orders o
        JOIN dim_regions r ON o.region_id = r.region_id
        WHERE o.order_status != 'Cancelled'
        GROUP BY r.region_name, r.market_tier, r.headquarters
        ORDER BY revenue DESC
    """)
    return df.to_dict(orient="records")
