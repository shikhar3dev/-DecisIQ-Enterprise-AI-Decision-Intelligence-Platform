import os
import sys
import datetime
from pathlib import Path

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# Ensure module path resolution
sys.path.append(str(Path(__file__).resolve().parent / "warehouse"))
sys.path.append(str(Path(__file__).resolve().parent / "analytics"))
sys.path.append(str(Path(__file__).resolve().parent / "ml_engine"))
sys.path.append(str(Path(__file__).resolve().parent / "simulator"))
sys.path.append(str(Path(__file__).resolve().parent / "ai_agent"))
sys.path.append(str(Path(__file__).resolve().parent / "exports"))
sys.path.append(str(Path(__file__).resolve().parent / "ingestion"))
sys.path.append(str(Path(__file__).resolve().parent / "workspace"))

from kpi_engine import get_executive_kpis, get_revenue_trends, get_breakdown_by_category, get_breakdown_by_region
from variance_engine import decompose_revenue_variance
from cohort_analysis import get_cohort_retention_matrix
from marketing_roi import get_marketing_performance
from forecaster import train_and_forecast_revenue
from churn_model import train_and_score_churn
from segmentation import get_customer_segmentation
from anomaly_detector import detect_anomalies
from scenario_engine import simulate_price_change, simulate_retention_discount, simulate_marketing_reallocation
from assistant import process_natural_language_query
from powerbi_pack import generate_powerbi_asset_pack
from seed_data import seed_enterprise_warehouse

from csv_connector import parse_uploaded_file
from schema_detector import detect_column_schema
from data_quality import profile_data_quality
from column_mapper import transform_and_load_dataset
from public_datasets import load_public_benchmark
from fastapi import File, UploadFile

from workspace_db import init_workspace_tables, reset_workspace_baseline
from version_manager import get_workspace_catalog, get_versions_for_dataset, create_dataset_version, rollback_to_version, compare_dataset_versions
from audit_logger import log_audit_event, get_audit_log
from lineage_tracker import get_all_lineage, get_metric_lineage
from analysis_history import get_analysis_runs, record_analysis_run

app = FastAPI(
    title="Enterprise AI Decision Intelligence Platform API",
    description="Backend analytical engine powering executive decision making, ML forecasting, root-cause investigation, and scenario simulation.",
    version="2.0.0"
)

# CORS middleware for local frontend and browser development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Request Models
class AskDataRequest(BaseModel):
    query: str

class VarianceRequest(BaseModel):
    period_1: str = "2025-07"
    period_2: str = "2025-08"

class PriceSimRequest(BaseModel):
    category: str = "Overall"
    price_delta_pct: float = 5.0

class RetentionSimRequest(BaseModel):
    discount_pct: float = 10.0

class MarketingSimRequest(BaseModel):
    shift_amount_lakhs: float = 10.0
    from_channel: str = "Meta Ads"
    to_channel: str = "Google Search"

@app.on_event("startup")
def startup_event():
    from db import DB_PATH
    if not DB_PATH.exists() or DB_PATH.stat().st_size == 0:
        print("[*] Fresh clone detected: Auto-seeding enterprise data warehouse...")
        seed_enterprise_warehouse()
    init_workspace_tables()

@app.get("/api/health")
def health_check():
    return {"status": "online", "system": "DecisIQ Decision Platform", "version": "2.0.0"}

@app.get("/api/kpis")
def kpis():
    return get_executive_kpis()

@app.get("/api/revenue-trends")
def revenue_trends(granularity: str = "monthly"):
    return get_revenue_trends(granularity)

@app.get("/api/categories")
def categories():
    return get_breakdown_by_category()

@app.get("/api/regions")
def regions():
    return get_breakdown_by_region()

@app.get("/api/cohorts")
def cohorts():
    return get_cohort_retention_matrix()

@app.get("/api/marketing")
def marketing():
    return get_marketing_performance()

@app.get("/api/forecast")
def forecast(horizon: int = Query(30, ge=7, le=90)):
    return train_and_forecast_revenue(horizon)

@app.get("/api/churn")
def churn():
    return train_and_score_churn()

@app.get("/api/segmentation")
def segmentation():
    return get_customer_segmentation()

@app.get("/api/anomalies")
def anomalies():
    return detect_anomalies()

@app.post("/api/variance")
def variance(req: VarianceRequest):
    return decompose_revenue_variance(req.period_1, req.period_2)

@app.post("/api/simulate/price")
def sim_price(req: PriceSimRequest):
    return simulate_price_change(req.category, req.price_delta_pct)

@app.post("/api/simulate/retention")
def sim_retention(req: RetentionSimRequest):
    return simulate_retention_discount(req.discount_pct)

@app.post("/api/simulate/marketing")
def sim_marketing(req: MarketingSimRequest):
    return simulate_marketing_reallocation(req.shift_amount_lakhs, req.from_channel, req.to_channel)

@app.post("/api/ask-data")
def ask_data(req: AskDataRequest):
    if not req.query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return process_natural_language_query(req.query)

# Ingestion State Tracker
CURRENT_DATA_SOURCE = {
    "source_name": "DecisIQ Controlled Demo Dataset (Enterprise Star-Schema)",
    "source_type": "demo",
    "total_records": 51255,
    "last_updated": "2026-08-18"
}

# Temporary in-memory cache for staged uploads
UPLOADED_DATASET_CACHE = {}

class MappingApplyRequest(BaseModel):
    file_id: str
    mappings: Dict[str, str]
    dataset_name: Optional[str] = "Custom Business Upload"

class LoadPublicRequest(BaseModel):
    dataset_key: str # "superstore", "saas", "retail"

@app.get("/api/ingestion/sources")
def get_sources():
    return {
        "current_source": CURRENT_DATA_SOURCE,
        "public_benchmarks": [
            {
                "key": "superstore",
                "name": "Global Superstore Commercial Sales",
                "records": "10,000 txns",
                "categories": "Technology, Furniture, Office Supplies",
                "description": "Multi-category global B2B & retail sales across 4 geographic markets."
            },
            {
                "key": "saas",
                "name": "B2B Cloud SaaS Subscription Metrics",
                "records": "6,000 subscriptions",
                "categories": "Enterprise, Growth, Starter Plans",
                "description": "Subscription metrics, MRR/ARR realization, seats, and customer telemetry."
            },
            {
                "key": "retail",
                "name": "Omnichannel D2C Fashion Retail",
                "records": "8,000 orders",
                "categories": "Footwear, Apparel, Sportswear",
                "description": "Multi-channel retail dataset with return rates and seasonal promotion tracking."
            }
        ]
    }

class UploadRawRequest(BaseModel):
    filename: str = "uploaded_data.csv"
    raw_content: str

@app.post("/api/ingestion/upload-raw")
def upload_raw_data(req: UploadRawRequest):
    try:
        df, metadata = parse_uploaded_file(req.raw_content.encode("utf-8"), req.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    schema_detection = detect_column_schema(df)
    quality_profile = profile_data_quality(df, schema_detection["suggested_mappings"])

    file_id = f"upload_{abs(hash(req.filename + str(len(df))))}"
    UPLOADED_DATASET_CACHE[file_id] = {
        "df": df,
        "filename": req.filename,
        "metadata": metadata
    }

    return {
        "file_id": file_id,
        "metadata": metadata,
        "schema_detection": schema_detection,
        "quality_profile": quality_profile
    }

@app.post("/api/ingestion/upload-file")
async def upload_data_file(file: UploadFile = File(...)):
    contents = await file.read()
    safe_filename = file.filename or "uploaded_dataset.csv"
    try:
        df, metadata = parse_uploaded_file(contents, safe_filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    schema_detection = detect_column_schema(df)
    quality_profile = profile_data_quality(df, schema_detection["suggested_mappings"])

    file_id = f"upload_{abs(hash(safe_filename + str(len(df))))}"
    UPLOADED_DATASET_CACHE[file_id] = {
        "df": df,
        "filename": safe_filename,
        "metadata": metadata
    }

    return {
        "file_id": file_id,
        "metadata": metadata,
        "schema_detection": schema_detection,
        "quality_profile": quality_profile
    }

class RollbackRequest(BaseModel):
    version_id: str

class CompareRequest(BaseModel):
    version_a_id: str
    version_b_id: str

class AnalysisRunRequest(BaseModel):
    dataset_version_id: str
    dataset_name: str
    revenue_cr: float
    forecast_target_cr: float
    churn_rate_pct: float
    active_customers: int
    aov: float

@app.post("/api/ingestion/apply-mapping")
def apply_mapping(req: MappingApplyRequest):
    cached = UPLOADED_DATASET_CACHE.get(req.file_id)
    if not cached:
        raise HTTPException(status_code=404, detail="Upload session expired or file not found.")

    df = cached["df"]
    file_name = cached["filename"]
    dataset_name = req.dataset_name or file_name or "Custom Ingested Data"
    result = transform_and_load_dataset(df, req.mappings, dataset_name)

    CURRENT_DATA_SOURCE["source_name"] = dataset_name
    CURRENT_DATA_SOURCE["source_type"] = "custom_byod"
    CURRENT_DATA_SOURCE["total_records"] = result["total_records_ingested"]
    CURRENT_DATA_SOURCE["last_updated"] = datetime.date.today().isoformat()

    # Automatically create an immutable version snapshot in workspace
    summary_metrics = {
        "revenue_cr": round(result.get("total_revenue", 0) / 10000000.0, 2),
        "orders": result.get("total_records_ingested", len(df)),
        "customers": result.get("total_customers", 0),
        "aov": round(result.get("total_revenue", 0) / max(1, result.get("total_records_ingested", 1)), 2)
    }

    raw_bytes = df.to_csv(index=False).encode("utf-8")
    ver_res = create_dataset_version(
        dataset_id="ds_orders",
        file_name=file_name,
        file_bytes=raw_bytes,
        row_count=result["total_records_ingested"],
        col_count=len(df.columns),
        quality_score=95.0,
        schema_mappings=req.mappings,
        summary_metrics=summary_metrics,
        uploaded_by="Admin",
        notes=f"BYOD Ingestion: {req.dataset_name}"
    )

    result["version_info"] = ver_res
    return result

@app.post("/api/ingestion/load-public")
def load_public(req: LoadPublicRequest):
    try:
        res = load_public_benchmark(req.dataset_key)
        CURRENT_DATA_SOURCE["source_name"] = res["dataset_name"]
        CURRENT_DATA_SOURCE["source_type"] = "public_benchmark"
        CURRENT_DATA_SOURCE["total_records"] = res["total_records_ingested"]
        CURRENT_DATA_SOURCE["last_updated"] = datetime.date.today().isoformat()

        log_audit_event("Admin", "Loaded Public Benchmark", res["dataset_name"], f"Activated benchmark with {res['total_records_ingested']:,} records.")
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/ingestion/reset-demo")
def reset_demo():
    seed_enterprise_warehouse()
    reset_workspace_baseline()
    CURRENT_DATA_SOURCE["source_name"] = "DecisIQ Controlled Demo Dataset (Enterprise Star-Schema)"
    CURRENT_DATA_SOURCE["source_type"] = "demo"
    CURRENT_DATA_SOURCE["total_records"] = 51255
    CURRENT_DATA_SOURCE["last_updated"] = datetime.date.today().isoformat()

    log_audit_event("Admin", "Warehouse Reset", "51k Enterprise Demo Dataset", "Restored standard enterprise baseline.")
    return {"status": "success", "message": "Warehouse reset to default 51,255-order demo dataset."}

# Workspace Endpoints
@app.get("/api/workspace/catalog")
def workspace_catalog():
    return get_workspace_catalog()

@app.get("/api/workspace/versions/{dataset_id}")
def workspace_versions(dataset_id: str):
    return get_versions_for_dataset(dataset_id)

@app.post("/api/workspace/rollback")
def workspace_rollback(req: RollbackRequest):
    try:
        return rollback_to_version(req.version_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/workspace/compare")
def workspace_compare(req: CompareRequest):
    try:
        return compare_dataset_versions(req.version_a_id, req.version_b_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/workspace/audit-log")
def workspace_audit_log(limit: int = Query(50, ge=5, le=200)):
    return get_audit_log(limit)

@app.get("/api/workspace/lineage")
def workspace_all_lineage():
    return get_all_lineage()

@app.get("/api/workspace/lineage/{metric_key}")
def workspace_metric_lineage(metric_key: str):
    return get_metric_lineage(metric_key)

@app.get("/api/workspace/analysis-runs")
def workspace_analysis_runs():
    return get_analysis_runs()

@app.post("/api/workspace/run-analysis")
def workspace_record_analysis(req: AnalysisRunRequest):
    return record_analysis_run(
        req.dataset_version_id, req.dataset_name, req.revenue_cr,
        req.forecast_target_cr, req.churn_rate_pct, req.active_customers, req.aov
    )

@app.get("/api/export-powerbi")
def export_powerbi():
    return generate_powerbi_asset_pack()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)


