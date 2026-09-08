import pandas as pd
import numpy as np
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent / "warehouse"))
sys.path.append(str(Path(__file__).resolve().parent.parent))

from db import query_df

# Category Price Elasticities
CATEGORY_PED = {
    "Electronics": -1.15,
    "Fashion": -1.55,
    "Home & Living": -1.25,
    "Health & Wellness": -1.40,
    "Overall": -1.30
}

def simulate_price_change(category="Overall", price_delta_pct=5.0):
    """
    Simulates price adjustment impacts on Demand, Revenue, Gross Margin, and Customer Churn.
    """
    df = query_df("""
        SELECT 
            p.category,
            SUM(i.line_total) as revenue,
            SUM(i.line_cogs) as cogs,
            SUM(i.line_profit) as gross_profit,
            SUM(i.quantity) as units_sold,
            AVG(i.unit_price) as avg_price
        FROM fact_order_items i
        JOIN dim_products p ON i.product_id = p.product_id
        JOIN fact_orders o ON i.order_id = o.order_id
        WHERE o.order_status != 'Cancelled'
          AND o.order_date >= date((SELECT MAX(order_date) FROM fact_orders), '-365 days')
        GROUP BY p.category
    """)
    
    ped = CATEGORY_PED.get(category, -1.30)
    
    if category != "Overall":
        df_target = df[df["category"] == category]
    else:
        df_target = df
        
    base_rev = float(df_target["revenue"].sum())
    base_cogs = float(df_target["cogs"].sum())
    base_profit = float(df_target["gross_profit"].sum())
    base_units = int(df_target["units_sold"].sum())
    base_margin_pct = (base_profit / base_rev * 100) if base_rev > 0 else 0
    
    # Elasticity Calculation
    # % Change in Demand = PED * % Change in Price
    demand_delta_pct = ped * price_delta_pct
    new_units = int(base_units * (1 + demand_delta_pct / 100))
    
    # New Unit Price = Base Price * (1 + price_delta_pct / 100)
    # Unit Cost remains same
    unit_cost = base_cogs / base_units if base_units > 0 else 0
    unit_price = base_rev / base_units if base_units > 0 else 0
    new_unit_price = unit_price * (1 + price_delta_pct / 100)
    
    sim_rev = new_units * new_unit_price
    sim_cogs = new_units * unit_cost
    sim_profit = sim_rev - sim_cogs
    sim_margin_pct = (sim_profit / sim_rev * 100) if sim_rev > 0 else 0
    
    rev_delta_pct = round(((sim_rev - base_rev) / base_rev) * 100, 2)
    profit_delta_pct = round(((sim_profit - base_profit) / base_profit) * 100, 2)
    
    # Churn sensitivity: +1% price increases churn risk by ~0.12%
    churn_impact_pct = round(0.12 * price_delta_pct, 2)
    
    return {
        "scenario": f"Price Adjustment: {price_delta_pct:+g}% on {category}",
        "ped_elasticity": ped,
        "base_metrics": {
            "revenue": round(base_rev, 2),
            "profit": round(base_profit, 2),
            "units": base_units,
            "margin_pct": round(base_margin_pct, 2)
        },
        "simulated_metrics": {
            "revenue": round(sim_rev, 2),
            "profit": round(sim_profit, 2),
            "units": new_units,
            "margin_pct": round(sim_margin_pct, 2)
        },
        "deltas": {
            "price_pct": price_delta_pct,
            "demand_pct": round(demand_delta_pct, 2),
            "revenue_pct": rev_delta_pct,
            "profit_pct": profit_delta_pct,
            "margin_diff_pts": round(sim_margin_pct - base_margin_pct, 2),
            "churn_risk_delta_pct": churn_impact_pct
        },
        "executive_verdict": (
            "Recommended: Profit accretive move. Higher margin outweighs volume decline."
            if profit_delta_pct > 0 else
            "Not Recommended: Elastic demand causes volume drop to erode net profitability."
        )
    }

def simulate_retention_discount(discount_pct=10.0):
    """
    Simulates offering targeted win-back discount to At-Risk and Lost segments.
    """
    df_risk = query_df("""
        SELECT 
            COUNT(*) as count,
            SUM(total_spend) as total_historical_spend,
            AVG(aov) as avg_aov
        FROM dim_customers
        WHERE segment IN ('At-Risk', 'Lost')
    """)
    
    total_risk_cust = int(df_risk.iloc[0]["count"])
    avg_aov = float(df_risk.iloc[0]["avg_aov"])
    
    # Win-back conversion rate curve based on discount:
    # 5% -> 12% reactivation, 10% -> 26% reactivation, 15% -> 38% reactivation, 20% -> 44% reactivation
    winback_rate = min(0.50, 0.05 + (discount_pct / 100) * 1.8)
    reactivated_cust = int(total_risk_cust * winback_rate)
    
    gross_recovered_rev = reactivated_cust * avg_aov * 2.2 # assume 2.2 orders per reactivated cust in year
    discount_cost = gross_recovered_rev * (discount_pct / 100)
    net_recovered_rev = gross_recovered_rev - discount_cost
    
    # Base COGS assumption: 55%
    cogs = gross_recovered_rev * 0.55
    net_profit = net_recovered_rev - cogs
    roi_pct = round((net_profit / discount_cost) * 100, 1) if discount_cost > 0 else 0
    
    return {
        "discount_pct": discount_pct,
        "targeted_customers": total_risk_cust,
        "projected_reactivations": reactivated_cust,
        "winback_rate_pct": round(winback_rate * 100, 1),
        "gross_recovered_revenue": round(gross_recovered_rev, 2),
        "discount_cost": round(discount_cost, 2),
        "net_recovered_revenue": round(net_recovered_rev, 2),
        "net_profit": round(net_profit, 2),
        "campaign_roi_pct": roi_pct,
        "executive_verdict": f"Targeted {discount_pct}% campaign yields ₹{net_profit/100000:.1f}L net profit with {roi_pct}% ROI."
    }

def simulate_marketing_reallocation(shift_amount_lakhs=10.0, from_channel="Meta Ads", to_channel="Google Search"):
    """
    Simulates shifting ad spend from lower ROAS channels to higher ROAS channels.
    """
    shift_inr = shift_amount_lakhs * 100000
    
    # Typical ROAS values from warehouse
    roas_map = {
        "Google Search": 5.85,
        "Meta Ads": 2.10,
        "YouTube": 5.69,
        "LinkedIn": 6.34,
        "Email CRM": 47.18
    }
    
    roas_from = roas_map.get(from_channel, 2.0)
    roas_to = roas_map.get(to_channel, 6.0)
    
    lost_rev = shift_inr * roas_from
    gained_rev = shift_inr * roas_to
    net_rev_lift = gained_rev - lost_rev
    
    return {
        "shift_amount_inr": shift_inr,
        "from_channel": from_channel,
        "to_channel": to_channel,
        "roas_from": roas_from,
        "roas_to": roas_to,
        "lost_revenue": round(lost_rev, 2),
        "gained_revenue": round(gained_rev, 2),
        "net_revenue_lift": round(net_rev_lift, 2),
        "executive_verdict": f"Reallocating ₹{shift_amount_lakhs}L unlocks +₹{net_rev_lift/100000:.1f} Lakhs in incremental gross revenue."
    }
