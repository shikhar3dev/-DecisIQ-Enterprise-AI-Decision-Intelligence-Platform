-- ============================================================================
-- Enterprise Star-Schema Data Warehouse DDL (PostgreSQL / SQLite / MySQL Compatible)
-- Project: Enterprise AI Decision Intelligence Platform
-- ============================================================================

-- 1. DIMENSION: Customers
CREATE TABLE IF NOT EXISTS dim_customers (
    customer_id VARCHAR(32) PRIMARY KEY,
    customer_name VARCHAR(128) NOT NULL,
    email VARCHAR(128),
    region_id VARCHAR(32) NOT NULL,
    segment VARCHAR(32) NOT NULL,              -- Champions, Loyal, Potential, At-Risk, Lost
    acquisition_channel VARCHAR(64),           -- Google Ads, Meta, Organic, Referral, Email
    acquisition_date DATE NOT NULL,
    total_spend DECIMAL(14, 2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    aov DECIMAL(10, 2) DEFAULT 0.00,
    recency_days INT DEFAULT 0,
    churn_probability DECIMAL(5, 4) DEFAULT 0.0000,
    churn_risk_tier VARCHAR(16) DEFAULT 'Low', -- Low, Medium, High
    nps_score INT DEFAULT 8
);

-- 2. DIMENSION: Products
CREATE TABLE IF NOT EXISTS dim_products (
    product_id VARCHAR(32) PRIMARY KEY,
    sku VARCHAR(64) UNIQUE NOT NULL,
    product_name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,             -- Electronics, Fashion, Home & Living, Health & Wellness
    sub_category VARCHAR(64) NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    margin_pct DECIMAL(5, 2) NOT NULL,
    inventory_level INT NOT NULL,
    safety_stock INT NOT NULL,
    lead_time_days INT NOT NULL,
    price_elasticity DECIMAL(4, 2) DEFAULT -1.20
);

-- 3. DIMENSION: Regions
CREATE TABLE IF NOT EXISTS dim_regions (
    region_id VARCHAR(32) PRIMARY KEY,
    region_name VARCHAR(64) NOT NULL,
    headquarters VARCHAR(64) NOT NULL,
    market_tier VARCHAR(16) NOT NULL,          -- Tier-1, Tier-2, Tier-3
    gdp_index DECIMAL(4, 2) DEFAULT 1.00,
    logistics_efficiency_score DECIMAL(4, 2) DEFAULT 0.92
);

-- 4. DIMENSION: Marketing Campaigns
CREATE TABLE IF NOT EXISTS dim_marketing_campaigns (
    campaign_id VARCHAR(32) PRIMARY KEY,
    campaign_name VARCHAR(128) NOT NULL,
    channel VARCHAR(64) NOT NULL,              -- Google Search, Meta Ads, YouTube, Influencer, Email CRM
    target_segment VARCHAR(32) NOT NULL,
    budget_allocated DECIMAL(14, 2) NOT NULL,
    total_spend DECIMAL(14, 2) NOT NULL,
    impressions INT NOT NULL,
    clicks INT NOT NULL,
    conversions INT NOT NULL,
    attributed_revenue DECIMAL(14, 2) NOT NULL,
    roas DECIMAL(6, 2) NOT NULL,
    cac DECIMAL(10, 2) NOT NULL,
    status VARCHAR(16) NOT NULL                -- Active, Completed, Paused
);

-- 5. FACT: Orders
CREATE TABLE IF NOT EXISTS fact_orders (
    order_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL,
    order_date DATE NOT NULL,
    channel_id VARCHAR(32) NOT NULL,
    region_id VARCHAR(32) NOT NULL,
    gross_amount DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) NOT NULL,
    net_amount DECIMAL(12, 2) NOT NULL,
    cogs DECIMAL(12, 2) NOT NULL,
    gross_profit DECIMAL(12, 2) NOT NULL,
    order_status VARCHAR(32) NOT NULL,         -- Delivered, Processing, Cancelled, Returned
    payment_method VARCHAR(32) NOT NULL,       -- Credit Card, UPI / Instant, Net Banking, COD
    delivery_days INT DEFAULT 3,
    FOREIGN KEY (customer_id) REFERENCES dim_customers(customer_id),
    FOREIGN KEY (region_id) REFERENCES dim_regions(region_id)
);

-- 6. FACT: Order Line Items
CREATE TABLE IF NOT EXISTS fact_order_items (
    order_item_id VARCHAR(32) PRIMARY KEY,
    order_id VARCHAR(32) NOT NULL,
    product_id VARCHAR(32) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    line_cogs DECIMAL(12, 2) NOT NULL,
    line_profit DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES fact_orders(order_id),
    FOREIGN KEY (product_id) REFERENCES dim_products(product_id)
);

-- 7. FACT: Daily Business Telemetry Pulse
CREATE TABLE IF NOT EXISTS fact_daily_business_pulse (
    date DATE PRIMARY KEY,
    revenue DECIMAL(14, 2) NOT NULL,
    orders INT NOT NULL,
    aov DECIMAL(10, 2) NOT NULL,
    gross_margin_pct DECIMAL(5, 2) NOT NULL,
    active_customers INT NOT NULL,
    cart_abandons INT NOT NULL,
    website_visitors INT NOT NULL,
    conversion_rate DECIMAL(5, 2) NOT NULL,
    return_rate_pct DECIMAL(5, 2) NOT NULL,
    is_anomaly INT DEFAULT 0,
    anomaly_severity VARCHAR(16) DEFAULT 'Normal',
    anomaly_reason TEXT
);
