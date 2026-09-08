-- Enterprise Star-Schema Data Warehouse DDL (SQLite / DuckDB Compatible)

-- Dimension: Customers
CREATE TABLE IF NOT EXISTS dim_customers (
    customer_id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    email TEXT,
    region_id TEXT NOT NULL,
    segment TEXT NOT NULL,           -- Champions, Loyal, Potential, At-Risk, Lost
    acquisition_channel TEXT,        -- Google Ads, Meta, Organic, Referral, Email
    acquisition_date DATE NOT NULL,
    total_spend REAL DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    aov REAL DEFAULT 0,
    recency_days INTEGER DEFAULT 0,
    churn_probability REAL DEFAULT 0,
    churn_risk_tier TEXT DEFAULT 'Low', -- Low, Medium, High
    nps_score INTEGER DEFAULT 8
);

-- Dimension: Products
CREATE TABLE IF NOT EXISTS dim_products (
    product_id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,          -- Electronics, Fashion, Home & Living, Health & Wellness
    sub_category TEXT NOT NULL,
    unit_cost REAL NOT NULL,
    unit_price REAL NOT NULL,
    margin_pct REAL NOT NULL,
    inventory_level INTEGER NOT NULL,
    safety_stock INTEGER NOT NULL,
    lead_time_days INTEGER NOT NULL,
    price_elasticity REAL DEFAULT -1.2 -- Elasticity coefficient
);

-- Dimension: Regions
CREATE TABLE IF NOT EXISTS dim_regions (
    region_id TEXT PRIMARY KEY,
    region_name TEXT NOT NULL,       -- North, South, East, West, Central
    headquarters TEXT NOT NULL,
    market_tier TEXT NOT NULL,       -- Tier-1, Tier-2, Tier-3
    gdp_index REAL DEFAULT 1.0,
    logistics_efficiency_score REAL DEFAULT 0.92
);

-- Dimension: Marketing Channels & Campaigns
CREATE TABLE IF NOT EXISTS dim_marketing_campaigns (
    campaign_id TEXT PRIMARY KEY,
    campaign_name TEXT NOT NULL,
    channel TEXT NOT NULL,           -- Google Search, Meta Ads, YouTube, Influencer, Email CRM
    target_segment TEXT NOT NULL,
    budget_allocated REAL NOT NULL,
    total_spend REAL NOT NULL,
    impressions INTEGER NOT NULL,
    clicks INTEGER NOT NULL,
    conversions INTEGER NOT NULL,
    attributed_revenue REAL NOT NULL,
    roas REAL NOT NULL,
    cac REAL NOT NULL,
    status TEXT NOT NULL             -- Active, Completed, Paused
);

-- Fact: Orders
CREATE TABLE IF NOT EXISTS fact_orders (
    order_id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    order_date DATE NOT NULL,
    channel_id TEXT NOT NULL,
    region_id TEXT NOT NULL,
    gross_amount REAL NOT NULL,
    discount_amount REAL NOT NULL,
    net_amount REAL NOT NULL,
    cogs REAL NOT NULL,
    gross_profit REAL NOT NULL,
    order_status TEXT NOT NULL,      -- Delivered, Processing, Cancelled, Returned
    payment_method TEXT NOT NULL,    -- Credit Card, UPI / Instant, Net Banking, COD
    delivery_days INTEGER DEFAULT 3,
    FOREIGN KEY (customer_id) REFERENCES dim_customers(customer_id),
    FOREIGN KEY (region_id) REFERENCES dim_regions(region_id)
);

-- Fact: Order Line Items
CREATE TABLE IF NOT EXISTS fact_order_items (
    order_item_id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    discount_amount REAL NOT NULL,
    line_total REAL NOT NULL,
    line_cogs REAL NOT NULL,
    line_profit REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES fact_orders(order_id),
    FOREIGN KEY (product_id) REFERENCES dim_products(product_id)
);

-- Fact: Daily Business Pulse & Telemetry
CREATE TABLE IF NOT EXISTS fact_daily_business_pulse (
    date DATE PRIMARY KEY,
    revenue REAL NOT NULL,
    orders INTEGER NOT NULL,
    aov REAL NOT NULL,
    gross_margin_pct REAL NOT NULL,
    active_customers INTEGER NOT NULL,
    cart_abandons INTEGER NOT NULL,
    website_visitors INTEGER NOT NULL,
    conversion_rate REAL NOT NULL,
    return_rate_pct REAL NOT NULL,
    is_anomaly INTEGER DEFAULT 0,
    anomaly_severity TEXT DEFAULT 'Normal', -- Normal, Moderate, Critical
    anomaly_reason TEXT
);

-- Fact: Customer Telemetry Logs
CREATE TABLE IF NOT EXISTS fact_customer_telemetry (
    telemetry_id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    session_duration_sec INTEGER NOT NULL,
    pages_viewed INTEGER NOT NULL,
    cart_abandoned INTEGER NOT NULL,
    support_tickets_raised INTEGER NOT NULL,
    discount_searched INTEGER NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES dim_customers(customer_id)
);
