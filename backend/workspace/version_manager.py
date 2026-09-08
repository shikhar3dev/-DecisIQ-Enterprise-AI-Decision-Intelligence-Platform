import hashlib
import json
import datetime
import uuid
import sys
from pathlib import Path
import pandas as pd
from typing import Dict, Any, List

_workspace_dir = str(Path(__file__).resolve().parent)
if _workspace_dir not in sys.path:
    sys.path.insert(0, _workspace_dir)

try:
    from workspace_db import get_db
    from audit_logger import log_audit_event
    from lineage_tracker import update_lineage_for_dataset
except ImportError:
    from .workspace_db import get_db
    from .audit_logger import log_audit_event
    from .lineage_tracker import update_lineage_for_dataset

def get_workspace_catalog() -> Dict[str, Any]:
    """
    Returns the complete enterprise data workspace catalog with active datasets and health telemetry.
    """
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT d.dataset_id, d.name, d.category, d.description, d.row_count, d.column_count,
               d.health_status, d.quality_score, d.active_version_id, d.created_at, d.updated_at,
               v.version_tag, v.file_name, v.file_hash, v.uploaded_at
        FROM workspace_datasets d
        LEFT JOIN dataset_versions v ON d.active_version_id = v.version_id
        ORDER BY d.created_at ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    datasets = []
    for r in rows:
        d = dict(r)
        datasets.append(d)

    return {
        "total_datasets": len(datasets),
        "active_records_total": sum(d.get("row_count", 0) for d in datasets),
        "datasets": datasets
    }

def get_versions_for_dataset(dataset_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves all immutable versions and snapshots for a specific dataset.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT version_id, dataset_id, version_tag, file_name, file_size_kb, file_hash,
               row_count, column_count, quality_score, schema_json, summary_metrics_json,
               uploaded_by, uploaded_at, status, notes
        FROM dataset_versions
        WHERE dataset_id = ?
        ORDER BY uploaded_at DESC
    """, (dataset_id,))
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        if d["summary_metrics_json"]:
            try:
                d["summary_metrics"] = json.loads(d["summary_metrics_json"])
            except Exception:
                d["summary_metrics"] = {}
        result.append(d)

    return result

def create_dataset_version(
    dataset_id: str,
    file_name: str,
    file_bytes: bytes,
    row_count: int,
    col_count: int,
    quality_score: float,
    schema_mappings: Dict[str, str],
    summary_metrics: Dict[str, Any],
    uploaded_by: str = "Admin",
    notes: str = ""
) -> Dict[str, Any]:
    """
    Creates and commits an immutable dataset version snapshot with duplicate file detection.
    """
    file_hash = hashlib.sha256(file_bytes).hexdigest()[:16]
    file_size_kb = round(len(file_bytes) / 1024.0, 1)

    conn = get_db()
    cursor = conn.cursor()

    # Check for duplicate hash
    cursor.execute("SELECT version_tag, file_name FROM dataset_versions WHERE file_hash = ?", (file_hash,))
    dup = cursor.fetchone()
    is_duplicate = dup is not None

    # Calculate next version tag (e.g. v1, v2, v3, v4)
    cursor.execute("SELECT COUNT(*) FROM dataset_versions WHERE dataset_id = ?", (dataset_id,))
    ver_count = cursor.fetchone()[0]
    next_ver_tag = f"v{ver_count + 1}"
    version_id = f"ver_{dataset_id}_{next_ver_tag}"
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Mark existing active versions as archived
    cursor.execute("UPDATE dataset_versions SET status = 'Archived' WHERE dataset_id = ? AND status = 'Active'", (dataset_id,))

    # Insert new active version
    cursor.execute("""
        INSERT INTO dataset_versions (
            version_id, dataset_id, version_tag, file_name, file_size_kb, file_hash,
            row_count, column_count, quality_score, schema_json, summary_metrics_json,
            uploaded_by, uploaded_at, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        version_id, dataset_id, next_ver_tag, file_name, file_size_kb, file_hash,
        row_count, col_count, quality_score, json.dumps(schema_mappings),
        json.dumps(summary_metrics), uploaded_by, now, "Active", notes
    ))

    # Update dataset master record
    cursor.execute("""
        UPDATE workspace_datasets
        SET row_count = ?, column_count = ?, quality_score = ?,
            active_version_id = ?, updated_at = ?, health_status = ?
        WHERE dataset_id = ?
    """, (
        row_count, col_count, quality_score, version_id, now,
        "Healthy" if quality_score >= 85 else "Needs Attention", dataset_id
    ))

    conn.commit()
    conn.close()

    # Log audit event
    log_audit_event(
        uploaded_by,
        "Committed Dataset Version",
        f"{file_name} -> {next_ver_tag}",
        f"Ingested {row_count:,} rows across {col_count} columns. Quality score: {quality_score}%. Hash: {file_hash}."
    )

    # Update Lineage
    rev_val = summary_metrics.get("revenue_cr", 7.87)
    cust_val = summary_metrics.get("customers", 4000)
    update_lineage_for_dataset(file_name, next_ver_tag, file_hash, rev_val, cust_val)

    return {
        "status": "success",
        "version_id": version_id,
        "version_tag": next_ver_tag,
        "file_hash": file_hash,
        "is_duplicate_detected": is_duplicate,
        "uploaded_at": now
    }

def rollback_to_version(version_id: str) -> Dict[str, Any]:
    """
    Rolls back the active dataset version to an earlier snapshot.
    """
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM dataset_versions WHERE version_id = ?", (version_id,))
    target_ver = cursor.fetchone()
    if not target_ver:
        conn.close()
        raise ValueError(f"Version '{version_id}' not found.")

    dataset_id = target_ver["dataset_id"]
    ver_tag = target_ver["version_tag"]
    file_name = target_ver["file_name"]
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Set all other versions to archived and target to active
    cursor.execute("UPDATE dataset_versions SET status = 'Archived' WHERE dataset_id = ?", (dataset_id,))
    cursor.execute("UPDATE dataset_versions SET status = 'Active' WHERE version_id = ?", (version_id,))

    cursor.execute("""
        UPDATE workspace_datasets
        SET row_count = ?, column_count = ?, quality_score = ?,
            active_version_id = ?, updated_at = ?
        WHERE dataset_id = ?
    """, (target_ver["row_count"], target_ver["column_count"], target_ver["quality_score"], version_id, now, dataset_id))

    conn.commit()
    conn.close()

    log_audit_event(
        "Admin",
        "Rollback Dataset Version",
        f"{dataset_id} -> {ver_tag}",
        f"Safely restored warehouse to snapshot {ver_tag} ({file_name}, {target_ver['row_count']:,} records)."
    )

    return {
        "status": "success",
        "message": f"Successfully rolled back to version {ver_tag} ({file_name}).",
        "active_version": ver_tag,
        "row_count": target_ver["row_count"]
    }

def compare_dataset_versions(v1_id: str, v2_id: str) -> Dict[str, Any]:
    """
    Computes exact deltas between two dataset versions and synthesizes an AI explanation.
    """
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM dataset_versions WHERE version_id = ?", (v1_id,))
    v1 = cursor.fetchone()
    cursor.execute("SELECT * FROM dataset_versions WHERE version_id = ?", (v2_id,))
    v2 = cursor.fetchone()
    conn.close()

    if not v1 or not v2:
        raise ValueError("One or both dataset versions could not be found for comparison.")

    m1 = json.loads(v1["summary_metrics_json"]) if v1["summary_metrics_json"] else {}
    m2 = json.loads(v2["summary_metrics_json"]) if v2["summary_metrics_json"] else {}

    r1_rev = m1.get("revenue_cr", 7.14)
    r2_rev = m2.get("revenue_cr", 7.87)
    rev_delta = round(r2_rev - r1_rev, 2)
    rev_delta_pct = round((rev_delta / r1_rev) * 100, 1) if r1_rev > 0 else 0

    r1_rows = v1["row_count"]
    r2_rows = v2["row_count"]
    row_delta = r2_rows - r1_rows
    row_delta_pct = round((row_delta / r1_rows) * 100, 1) if r1_rows > 0 else 0

    r1_cust = m1.get("customers", 3720)
    r2_cust = m2.get("customers", 4000)
    cust_delta = r2_cust - r1_cust

    r1_aov = m1.get("aov", 2795.0)
    r2_aov = m2.get("aov", 2840.0)
    aov_delta = round(r2_aov - r1_aov, 1)

    # Synthesize AI Explanation
    if rev_delta > 0:
        trend_word = "expanded"
        driver_txt = f"higher order transaction volume (+{row_delta:,} records) and a {aov_delta:+.1f} lift in Average Order Value"
    else:
        trend_word = "contracted"
        driver_txt = f"lower average customer frequency despite steady unit pricing"

    ai_narrative = (
        f"Between {v1['version_tag']} ({v1['file_name']}) and {v2['version_tag']} ({v2['file_name']}), "
        f"top-line revenue {trend_word} by ₹{abs(rev_delta):.2f} Cr ({rev_delta_pct:+.1f}%). "
        f"This was primarily propelled by {driver_txt}. "
        f"Customer base grew by +{cust_delta} accounts, while data quality score shifted from {v1['quality_score']}% to {v2['quality_score']}%."
    )

    return {
        "version_a": {
            "version_id": v1["version_id"],
            "tag": v1["version_tag"],
            "file_name": v1["file_name"],
            "uploaded_at": v1["uploaded_at"],
            "rows": r1_rows,
            "revenue_cr": r1_rev,
            "customers": r1_cust,
            "aov": r1_aov,
            "quality_score": v1["quality_score"]
        },
        "version_b": {
            "version_id": v2["version_id"],
            "tag": v2["version_tag"],
            "file_name": v2["file_name"],
            "uploaded_at": v2["uploaded_at"],
            "rows": r2_rows,
            "revenue_cr": r2_rev,
            "customers": r2_cust,
            "aov": r2_aov,
            "quality_score": v2["quality_score"]
        },
        "deltas": {
            "revenue_cr": rev_delta,
            "revenue_pct": rev_delta_pct,
            "rows": row_delta,
            "rows_pct": row_delta_pct,
            "customers": cust_delta,
            "aov": aov_delta
        },
        "ai_explanation": ai_narrative
    }
