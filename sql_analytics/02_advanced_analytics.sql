-- ============================================================================
-- Enterprise AI Decision Intelligence Platform — Advanced SQL Analytics
-- Features: CTEs, Window Functions, RFM Scoring, Retention, Variance Analysis
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXECUTIVE KPI RUNNING TOTALS & 7-DAY ROLLING MOVING AVERAGE
-- ----------------------------------------------------------------------------
WITH daily_revenue_series AS (
    SELECT 
        date,
        revenue,
        orders,
        aov,
        -- 7-day rolling moving average of revenue
        AVG(revenue) OVER (
            ORDER BY date 
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) as rolling_7d_avg_rev,
        -- Running cumulative revenue
        SUM(revenue) OVER (
            ORDER BY date
        ) as cumulative_revenue_to_date,
        -- Lagged 1-day & 7-day revenue for growth telemetry
        LAG(revenue, 1) OVER (ORDER BY date) as rev_lag_1d,
        LAG(revenue, 7) OVER (ORDER BY date) as rev_lag_7d
    FROM fact_daily_business_pulse
)
SELECT 
    date,
    ROUND(revenue, 2) as daily_revenue,
    ROUND(rolling_7d_avg_rev, 2) as rolling_7d_avg,
    ROUND(cumulative_revenue_to_date, 2) as cumulative_revenue,
    ROUND(((revenue - rev_lag_7d) / NULLIF(rev_lag_7d, 0)) * 100, 2) as wow_growth_pct
FROM daily_revenue_series
ORDER BY date DESC
LIMIT 30;


-- ----------------------------------------------------------------------------
-- 2. DYNAMIC RFM (RECENCY, FREQUENCY, MONETARY) QUINTILE SCORING CTE
-- ----------------------------------------------------------------------------
WITH customer_orders_summary AS (
    SELECT 
        c.customer_id,
        c.customer_name,
        c.region_id,
        MAX(o.order_date) as last_order_date,
        COUNT(DISTINCT o.order_id) as frequency_orders,
        SUM(o.net_amount) as monetary_spend,
        ROUND(AVG(o.net_amount), 2) as avg_order_value
    FROM dim_customers c
    JOIN fact_orders o ON c.customer_id = o.customer_id
    WHERE o.order_status != 'Cancelled'
    GROUP BY c.customer_id, c.customer_name, c.region_id
),
rfm_raw_scores AS (
    SELECT 
        customer_id,
        customer_name,
        region_id,
        frequency_orders,
        monetary_spend,
        avg_order_value,
        -- NTILE window functions for quintile rankings (1 to 5)
        NTILE(5) OVER (ORDER BY last_order_date ASC) as r_score,
        NTILE(5) OVER (ORDER BY frequency_orders ASC) as f_score,
        NTILE(5) OVER (ORDER BY monetary_spend ASC) as m_score
    FROM customer_orders_summary
)
SELECT 
    customer_id,
    customer_name,
    monetary_spend,
    frequency_orders,
    r_score, f_score, m_score,
    (r_score * 100 + f_score * 10 + m_score) as rfm_composite_code,
    CASE 
        WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
        WHEN f_score >= 3 AND m_score >= 3 THEN 'Loyal Accounts'
        WHEN r_score >= 3 AND f_score <= 2 AND m_score >= 3 THEN 'Potential Growth'
        WHEN r_score <= 2 AND (f_score >= 3 OR m_score >= 3) THEN 'At-Risk High Value'
        ELSE 'Lost / Dormant'
    END as dynamic_calculated_segment
FROM rfm_raw_scores
ORDER BY monetary_spend DESC
LIMIT 50;


-- ----------------------------------------------------------------------------
-- 3. MONTH-OVER-MONTH REVENUE WATERFALL VARIANCE (PRICE VS VOLUME EFFECT)
-- ----------------------------------------------------------------------------
WITH monthly_product_metrics AS (
    SELECT 
        strftime('%Y-%m', o.order_date) as order_month,
        p.product_id,
        p.product_name,
        p.category,
        SUM(i.quantity) as total_units,
        AVG(i.unit_price) as avg_realized_price,
        SUM(i.line_total) as total_revenue
    FROM fact_orders o
    JOIN fact_order_items i ON o.order_id = i.order_id
    JOIN dim_products p ON i.product_id = p.product_id
    WHERE o.order_status != 'Cancelled'
    GROUP BY strftime('%Y-%m', o.order_date), p.product_id, p.product_name, p.category
),
month_comparisons AS (
    SELECT 
        curr.order_month as current_month,
        curr.product_name,
        curr.category,
        curr.total_units as curr_units,
        prev.total_units as prev_units,
        curr.avg_realized_price as curr_price,
        prev.avg_realized_price as prev_price,
        curr.total_revenue as curr_rev,
        prev.total_revenue as prev_rev,
        -- Volume Effect = (Curr_Units - Prev_Units) * Prev_Price
        (curr.total_units - prev.total_units) * prev.avg_realized_price as volume_variance_effect,
        -- Price Effect = (Curr_Price - Prev_Price) * Curr_Units
        (curr.avg_realized_price - prev.avg_realized_price) * curr.total_units as price_variance_effect
    FROM monthly_product_metrics curr
    JOIN monthly_product_metrics prev 
      ON curr.product_id = prev.product_id 
     AND curr.order_month = '2025-08' 
     AND prev.order_month = '2025-07'
)
SELECT 
    category,
    ROUND(SUM(prev_rev), 2) as base_revenue_jul,
    ROUND(SUM(curr_rev), 2) as current_revenue_aug,
    ROUND(SUM(curr_rev - prev_rev), 2) as total_variance,
    ROUND(SUM(volume_variance_effect), 2) as total_volume_impact,
    ROUND(SUM(price_variance_effect), 2) as total_price_impact
FROM month_comparisons
GROUP BY category
ORDER BY total_variance ASC;


-- ----------------------------------------------------------------------------
-- 4. CUSTOMER RETENTION COHORT LIFECYCLE (MONTH 0 TO MONTH 6)
-- ----------------------------------------------------------------------------
WITH first_purchase AS (
    SELECT 
        customer_id,
        MIN(order_date) as first_order_date,
        strftime('%Y-%m', MIN(order_date)) as cohort_month
    FROM fact_orders
    WHERE order_status != 'Cancelled'
    GROUP BY customer_id
),
cohort_activity AS (
    SELECT 
        o.customer_id,
        fp.cohort_month,
        (cast(strftime('%Y', o.order_date) as integer) - cast(strftime('%Y', fp.first_order_date) as integer)) * 12 +
        (cast(strftime('%m', o.order_date) as integer) - cast(strftime('%m', fp.first_order_date) as integer)) as period_offset
    FROM fact_orders o
    JOIN first_purchase fp ON o.customer_id = fp.customer_id
    WHERE o.order_status != 'Cancelled'
)
SELECT 
    cohort_month,
    COUNT(DISTINCT CASE WHEN period_offset = 0 THEN customer_id END) as month_0_size,
    COUNT(DISTINCT CASE WHEN period_offset = 1 THEN customer_id END) as month_1_active,
    COUNT(DISTINCT CASE WHEN period_offset = 2 THEN customer_id END) as month_2_active,
    COUNT(DISTINCT CASE WHEN period_offset = 3 THEN customer_id END) as month_3_active,
    COUNT(DISTINCT CASE WHEN period_offset = 6 THEN customer_id END) as month_6_active
FROM cohort_activity
WHERE cohort_month >= '2024-01'
GROUP BY cohort_month
ORDER BY cohort_month ASC;
