import datetime
import sys
from pathlib import Path
from typing import Dict, Any, List

_workspace_dir = str(Path(__file__).resolve().parent)
if _workspace_dir not in sys.path:
    sys.path.insert(0, _workspace_dir)

try:
    from workspace_db import get_db
except ImportError:
    from .workspace_db import get_db

def get_all_lineage() -> List[Dict[str, Any]]:
    """
    Returns full data lineage graph entries for all executive metrics.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT lineage_id, metric_key, metric_name, metric_value, source_dataset,
               source_version, source_file_hash, warehouse_table, transformation_sql,
               aggregation_logic, updated_at
        FROM data_lineage
        ORDER BY lineage_id ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]

def get_metric_lineage(metric_key: str) -> Dict[str, Any]:
    """
    Returns step-by-step lineage derivation for a specific metric.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM data_lineage WHERE metric_key = ?
    """, (metric_key,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {"error": f"Lineage for metric '{metric_key}' not found."}

    d = dict(row)
    # Build graph nodes for visual renderer
    graph_nodes = [
        {"step": 1, "title": "Source Business File", "desc": f"{d['source_dataset']} ({d['source_version']})", "type": "source", "hash": d['source_file_hash']},
        {"step": 2, "title": "Warehouse Star-Schema Table", "desc": d['warehouse_table'], "type": "table"},
        {"step": 3, "title": "Data Transformation / SQL", "desc": d['transformation_sql'], "type": "sql"},
        {"step": 4, "title": "Aggregation & ML Engine", "desc": d['aggregation_logic'], "type": "engine"},
        {"step": 5, "title": "Executive KPI Telemetry", "desc": f"{d['metric_name']} = {d['metric_value']}", "type": "metric"}
    ]

    return {
        "metric_key": d["metric_key"],
        "metric_name": d["metric_name"],
        "current_value": d["metric_value"],
        "lineage_nodes": graph_nodes
    }

def update_lineage_for_dataset(dataset_name: str, version_tag: str, file_hash: str, rev_cr: float, active_cust: int):
    """
    Updates the data lineage records when a new dataset version is activated.
    """
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        UPDATE data_lineage
        SET source_dataset = ?, source_version = ?, source_file_hash = ?, metric_value = ?, updated_at = ?
        WHERE metric_key = 'revenue_cr'
    """, (dataset_name, version_tag, file_hash, f"₹{rev_cr:.2f} Cr", now))

    cursor.execute("""
        UPDATE data_lineage
        SET source_dataset = ?, source_version = ?, source_file_hash = ?, metric_value = ?, updated_at = ?
        WHERE metric_key = 'churn_risk_customers'
    """, (dataset_name, version_tag, file_hash, f"{int(active_cust * 0.045)} Accounts", now))

    conn.commit()
    conn.close()
