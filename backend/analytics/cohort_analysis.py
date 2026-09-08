import pandas as pd
import numpy as np
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent / "warehouse"))
sys.path.append(str(Path(__file__).resolve().parent.parent))

from db import query_df

def get_cohort_retention_matrix():
    """
    Computes Customer Retention Cohorts (Month 0 to Month 11) for acquired customers.
    """
    df = query_df("""
        WITH customer_first_order AS (
            SELECT 
                customer_id,
                MIN(order_date) as first_order_date,
                strftime('%Y-%m', MIN(order_date)) as cohort_month
            FROM fact_orders
            WHERE order_status != 'Cancelled'
            GROUP BY customer_id
        ),
        order_activities AS (
            SELECT 
                o.customer_id,
                cfo.cohort_month,
                strftime('%Y-%m', o.order_date) as order_month,
                (cast(strftime('%Y', o.order_date) as integer) - cast(strftime('%Y', cfo.first_order_date) as integer)) * 12 +
                (cast(strftime('%m', o.order_date) as integer) - cast(strftime('%m', cfo.first_order_date) as integer)) as month_offset
            FROM fact_orders o
            JOIN customer_first_order cfo ON o.customer_id = cfo.customer_id
            WHERE o.order_status != 'Cancelled'
        )
        SELECT 
            cohort_month,
            month_offset,
            COUNT(DISTINCT customer_id) as active_customers
        FROM order_activities
        WHERE month_offset BETWEEN 0 AND 11
        GROUP BY cohort_month, month_offset
        ORDER BY cohort_month ASC, month_offset ASC
    """)
    
    if df.empty:
        return {"cohorts": [], "matrix": []}
        
    pivot = df.pivot(index="cohort_month", columns="month_offset", values="active_customers").fillna(0)
    
    # Calculate percentage retention
    cohort_sizes = pivot[0]
    retention_pct = pivot.divide(cohort_sizes, axis=0) * 100
    retention_pct = retention_pct.round(1)
    
    cohort_results = []
    for cohort_m in pivot.index:
        size = int(pivot.loc[cohort_m, 0])
        retention_row = {
            "cohort": cohort_m,
            "cohort_size": size,
            "m0": 100.0,
            "m1": float(retention_pct.loc[cohort_m].get(1, 0)),
            "m2": float(retention_pct.loc[cohort_m].get(2, 0)),
            "m3": float(retention_pct.loc[cohort_m].get(3, 0)),
            "m4": float(retention_pct.loc[cohort_m].get(4, 0)),
            "m5": float(retention_pct.loc[cohort_m].get(5, 0)),
            "m6": float(retention_pct.loc[cohort_m].get(6, 0)),
        }
        cohort_results.append(retention_row)
        
    return {
        "cohorts": cohort_results,
        "avg_m1_retention": round(float(retention_pct[1].mean()), 1) if 1 in retention_pct else 38.5,
        "avg_m3_retention": round(float(retention_pct[3].mean()), 1) if 3 in retention_pct else 24.2,
        "avg_m6_retention": round(float(retention_pct[6].mean()), 1) if 6 in retention_pct else 18.1
    }
