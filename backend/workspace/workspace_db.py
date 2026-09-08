import sqlite3
import datetime
import sys
from pathlib import Path
import json
import hashlib

_workspace_dir = str(Path(__file__).resolve().parent)
if _workspace_dir not in sys.path:
    sys.path.insert(0, _workspace_dir)

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "enterprise_warehouse.db"

def get_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_workspace_tables():
    """
    Initializes Enterprise Data Workspace metadata tables:
    - workspace_datasets
    - dataset_versions
    - audit_events
    - analysis_runs
    - data_lineage
    """
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS workspace_datasets (
        dataset_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        row_count INTEGER DEFAULT 0,
        column_count INTEGER DEFAULT 0,
        health_status TEXT DEFAULT 'Healthy',
        quality_score REAL DEFAULT 95.0,
        active_version_id TEXT,
        created_at TEXT,
        updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS dataset_versions (
        version_id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        version_tag TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size_kb REAL DEFAULT 0.0,
        file_hash TEXT NOT NULL,
        row_count INTEGER NOT NULL,
        column_count INTEGER NOT NULL,
        quality_score REAL DEFAULT 95.0,
        schema_json TEXT,
        summary_metrics_json TEXT,
        uploaded_by TEXT DEFAULT 'Admin',
        uploaded_at TEXT,
        status TEXT DEFAULT 'Active',
        notes TEXT,
        FOREIGN KEY (dataset_id) REFERENCES workspace_datasets(dataset_id)
    );

    CREATE TABLE IF NOT EXISTS audit_events (
        event_id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        user_name TEXT NOT NULL,
        action TEXT NOT NULL,
        target_entity TEXT NOT NULL,
        details TEXT,
        status TEXT DEFAULT 'Success'
    );

    CREATE TABLE IF NOT EXISTS analysis_runs (
        run_id TEXT PRIMARY KEY,
        run_number INTEGER NOT NULL,
        dataset_version_id TEXT NOT NULL,
        dataset_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        revenue_cr REAL,
        forecast_target_cr REAL,
        churn_rate_pct REAL,
        active_customers INTEGER,
        aov REAL,
        status TEXT DEFAULT 'Completed',
        generated_by TEXT DEFAULT 'DecisIQ Analytics Engine'
    );

    CREATE TABLE IF NOT EXISTS data_lineage (
        lineage_id TEXT PRIMARY KEY,
        metric_key TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        metric_value TEXT NOT NULL,
        source_dataset TEXT NOT NULL,
        source_version TEXT NOT NULL,
        source_file_hash TEXT,
        warehouse_table TEXT NOT NULL,
        transformation_sql TEXT NOT NULL,
        aggregation_logic TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # Seed baseline registered datasets if empty
    cursor.execute("SELECT COUNT(*) FROM workspace_datasets")
    if cursor.fetchone()[0] == 0:
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        datasets = [
            ("ds_orders", "E-Commerce Enterprise Orders", "Sales & Transactions", "Core transactional order facts across multi-category commercial sales.", 51255, 13, "Healthy", 96.5, "ver_orders_v3", now, now),
            ("ds_customers", "Customer 360 Master Profile", "Customer Intelligence", "Unified customer account demographics, lifetime spend, and churn probability.", 4000, 14, "Healthy", 98.0, "ver_cust_v2", now, now),
            ("ds_marketing", "Multichannel Marketing Performance", "Growth & Acquisition", "Campaign spend, ROAS, multi-touch attribution, and acquisition CAC.", 12, 13, "Healthy", 94.0, "ver_mkt_v1", now, now),
            ("ds_superstore", "Global Superstore Commercial Sales", "Public Benchmark", "Multi-region B2B enterprise benchmark dataset with 4 international markets.", 10000, 12, "Healthy", 97.2, "ver_sup_v1", now, now),
            ("ds_saas", "B2B Cloud SaaS Metrics", "Public Benchmark", "ARR/MRR subscriptions, renewal telemetry, and seat tier realization.", 6000, 12, "Healthy", 99.0, "ver_saas_v1", now, now)
        ]
        cursor.executemany("INSERT INTO workspace_datasets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", datasets)

        # Seed Versions
        versions = [
            ("ver_orders_v1", "ds_orders", "v1", "enterprise_orders_q1_2024.csv", 4200.5, "a1b2c3d4e5f67890", 38400, 13, 91.0, json.dumps({"order_id": "order_id", "revenue": "revenue"}), json.dumps({"revenue_cr": 5.82, "orders": 38400, "customers": 3100, "aov": 2680}), "Admin", "2026-08-15 10:30:00", "Archived", "Baseline Q1-Q3 2024 transactional load."),
            ("ver_orders_v2", "ds_orders", "v2", "enterprise_orders_q3_2025.csv", 6450.0, "b2c3d4e5f6a17890", 47120, 13, 94.5, json.dumps({"order_id": "order_id", "revenue": "revenue"}), json.dumps({"revenue_cr": 7.14, "orders": 47120, "customers": 3720, "aov": 2795}), "Admin", "2026-08-17 14:15:00", "Archived", "Mid-year update with Q3 holiday surge integration."),
            ("ver_orders_v3", "ds_orders", "v3", "enterprise_orders_august_2026.csv", 7820.2, "e5f6a1b2c3d47890", 51255, 13, 96.5, json.dumps({"order_id": "order_id", "revenue": "revenue", "order_date": "order_date"}), json.dumps({"revenue_cr": 7.87, "orders": 51255, "customers": 4000, "aov": 2840}), "Admin", "2026-08-18 19:48:00", "Active", "Production enterprise dataset with 24 months of seasonality & churn telemetry."),
            ("ver_cust_v1", "ds_customers", "v1", "customer_master_2025.csv", 890.0, "c3d4e5f6a1b27890", 3500, 14, 95.0, "{}", json.dumps({"total_customers": 3500}), "DataOps", "2026-08-16 09:00:00", "Archived", "Legacy CRM account sync."),
            ("ver_cust_v2", "ds_customers", "v2", "customer_master_2026.csv", 1120.0, "d4e5f6a1b2c37890", 4000, 14, 98.0, "{}", json.dumps({"total_customers": 4000}), "Admin", "2026-08-18 12:00:00", "Active", "Full Customer 360 RFM segmentation & Random Forest churn scoring.")
        ]
        cursor.executemany("INSERT INTO dataset_versions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", versions)

        # Seed Audit Log
        audit_records = [
            ("evt_001", "2026-08-18 19:48:12", "Admin", "Uploaded Dataset", "orders.csv (7.8 MB)", "Ingested 51,255 rows into staging cache.", "Success"),
            ("evt_002", "2026-08-18 19:49:05", "DecisIQ Profiler", "Data Quality Profiling", "orders.csv", "Data Health Score: 96.5/100 (100% Date Validity, 0.0% Duplicates).", "Success"),
            ("evt_003", "2026-08-18 19:50:30", "Admin", "Schema Mapping Confirmed", "orders.csv -> Star-Schema", "Auto-matched 13 columns with 98% average confidence.", "Success"),
            ("evt_004", "2026-08-18 19:51:10", "DataOps Engine", "Version Created", "E-Commerce Enterprise Orders v3", "Immutable version snapshot ver_orders_v3 registered.", "Success"),
            ("evt_005", "2026-08-18 19:52:00", "ML Engine", "Trained ML Models", "Forecaster & Churn Model", "Trained 30/60/90d Ridge Forecaster (MAPE 4.1%) and Random Forest Churn Classifier.", "Success"),
            ("evt_006", "2026-08-18 19:55:20", "Admin", "Power BI Pack Export", "powerbi_export_pack/", "Exported 8 analytical CSV tables + DAX measure library.", "Success")
        ]
        cursor.executemany("INSERT INTO audit_events VALUES (?, ?, ?, ?, ?, ?, ?)", audit_records)

        # Seed Analysis Runs
        runs = [
            ("run_101", 101, "ver_orders_v2", "E-Commerce Enterprise Orders v2", "2026-08-17 15:00:00", 7.14, 6.95, 9.4, 3720, 2795.0, "Completed", "DecisIQ Analytics Engine"),
            ("run_102", 102, "ver_orders_v3", "E-Commerce Enterprise Orders v3", "2026-08-18 19:53:00", 7.87, 8.42, 8.1, 4000, 2840.0, "Completed", "DecisIQ Analytics Engine")
        ]
        cursor.executemany("INSERT INTO analysis_runs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", runs)

        # Seed Data Lineage
        lineage_entries = [
            ("lin_001", "revenue_cr", "Total Revenue (₹ Cr)", "₹7.87 Cr", "E-Commerce Enterprise Orders", "v3 (enterprise_orders_august_2026.csv)", "e5f6a1b2c3d47890", "fact_orders", "SELECT ROUND(SUM(total_amount)/10000000.0, 2) FROM fact_orders WHERE status != 'Cancelled'", "SUM aggregation across 51,255 non-cancelled orders", now),
            ("lin_002", "forecast_target_cr", "Next Month Target", "₹14.20 Cr", "fact_daily_business_pulse", "v3", "e5f6a1b2c3d47890", "fact_daily_business_pulse", "Ridge(alpha=10.0) with cyclical DoW/Month encodings and lags [t-7, t-14, t-30]", "ML Time-Series 30-day forward projection with 95% CI", now),
            ("lin_003", "churn_risk_customers", "At-Risk Accounts", "184 Accounts", "dim_customers & fact_customer_telemetry", "v3", "e5f6a1b2c3d47890", "dim_customers", "RandomForestClassifier(n_estimators=30, max_depth=5) trained on recency, frequency, spend delta, and ticket ratio", "Supervised classification with churn probability threshold > 0.65", now),
            ("lin_004", "aov", "Average Order Value (AOV)", "₹2,840", "fact_orders", "v3", "e5f6a1b2c3d47890", "fact_orders", "SELECT ROUND(AVG(total_amount), 2) FROM fact_orders", "Direct arithmetic mean of line item subtotals", now)
        ]
        cursor.executemany("INSERT INTO data_lineage VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", lineage_entries)

    conn.commit()
    conn.close()

# Auto-initialize on import
init_workspace_tables()

def reset_workspace_baseline():
    """
    Resets the workspace catalog and lineage back to the default 51,255 enterprise dataset baseline.
    """
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Update ds_orders in workspace_datasets
    cursor.execute("""
        UPDATE workspace_datasets
        SET row_count = 51255, column_count = 13, quality_score = 96.5,
            active_version_id = 'ver_orders_v3', health_status = 'Healthy',
            updated_at = ?
        WHERE dataset_id = 'ds_orders'
    """, (now,))

    # 2. Reset active version in dataset_versions
    cursor.execute("UPDATE dataset_versions SET status = 'Archived' WHERE dataset_id = 'ds_orders'")
    cursor.execute("UPDATE dataset_versions SET status = 'Active' WHERE version_id = 'ver_orders_v3'")

    # 3. Reset data lineage
    cursor.execute("""
        UPDATE data_lineage
        SET metric_value = '₹7.87 Cr',
            source_dataset = 'E-Commerce Enterprise Orders',
            source_version = 'v3 (enterprise_orders_august_2026.csv)',
            source_file_hash = 'e5f6a1b2c3d47890',
            updated_at = ?
        WHERE metric_key = 'revenue_cr'
    """, (now,))

    cursor.execute("""
        UPDATE data_lineage
        SET metric_value = '₹2,840',
            source_version = 'v3',
            source_file_hash = 'e5f6a1b2c3d47890',
            updated_at = ?
        WHERE metric_key = 'aov'
    """, (now,))

    conn.commit()
    conn.close()

