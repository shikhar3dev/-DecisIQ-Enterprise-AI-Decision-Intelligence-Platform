import datetime
import uuid
import sys
from pathlib import Path
from typing import List, Dict, Any

_workspace_dir = str(Path(__file__).resolve().parent)
if _workspace_dir not in sys.path:
    sys.path.insert(0, _workspace_dir)

try:
    from workspace_db import get_db
except ImportError:
    from .workspace_db import get_db

def get_analysis_runs() -> List[Dict[str, Any]]:
    """
    Returns historical analytical execution records.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT run_id, run_number, dataset_version_id, dataset_name, created_at,
               revenue_cr, forecast_target_cr, churn_rate_pct, active_customers, aov, status, generated_by
        FROM analysis_runs
        ORDER BY run_number DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]

def record_analysis_run(dataset_version_id: str, dataset_name: str, revenue_cr: float, forecast_target_cr: float, churn_rate_pct: float, active_customers: int, aov: float) -> Dict[str, Any]:
    """
    Saves a reproducible analytical snapshot tied to a specific dataset version.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COALESCE(MAX(run_number), 100) + 1 FROM analysis_runs")
    next_num = cursor.fetchone()[0]

    run_id = f"run_{next_num}"
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT INTO analysis_runs (run_id, run_number, dataset_version_id, dataset_name, created_at,
                                  revenue_cr, forecast_target_cr, churn_rate_pct, active_customers, aov, status, generated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (run_id, next_num, dataset_version_id, dataset_name, now, revenue_cr, forecast_target_cr, churn_rate_pct, active_customers, aov, "Completed", "DecisIQ Analytics Engine"))

    conn.commit()
    conn.close()

    return {
        "run_id": run_id,
        "run_number": next_num,
        "dataset_version_id": dataset_version_id,
        "created_at": now
    }
