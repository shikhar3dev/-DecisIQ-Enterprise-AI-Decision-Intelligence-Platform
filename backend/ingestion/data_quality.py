import pandas as pd
import numpy as np
from typing import Dict, Any

def profile_data_quality(df: pd.DataFrame, mappings: Dict[str, str]) -> Dict[str, Any]:
    """
    Generates a comprehensive Data Quality Scorecard for ingested business data.
    """
    total_rows = len(df)
    total_cols = len(df.columns)
    
    if total_rows == 0:
        return {"health_score": 0, "total_rows": 0, "status": "Empty DataFrame"}

    # 1. Duplicates
    duplicate_rows = int(df.duplicated().sum())
    duplicate_pct = round((duplicate_rows / total_rows) * 100, 2)

    # 2. Missing Values per column
    missing_by_col = []
    total_missing_cells = 0
    total_cells = total_rows * total_cols

    for col in df.columns:
        null_cnt = int(df[col].isna().sum())
        total_missing_cells += null_cnt
        null_pct = round((null_cnt / total_rows) * 100, 2)
        missing_by_col.append({
            "column": col,
            "mapped_to": mappings.get(col, "unmapped"),
            "missing_count": null_cnt,
            "missing_pct": null_pct,
            "data_type": str(df[col].dtype)
        })

    overall_missing_pct = round((total_missing_cells / total_cells) * 100, 2) if total_cells > 0 else 0

    # 3. Numeric Integrity (Negative Values & Outliers in Revenue / Cost)
    anomalies = []
    rev_col = next((col for col, target in mappings.items() if target == "revenue"), None)
    if rev_col and rev_col in df.columns:
        # Convert to numeric if possible
        num_rev = pd.to_numeric(df[rev_col], errors="coerce")
        neg_rev = int((num_rev < 0).sum())
        if neg_rev > 0:
            anomalies.append({
                "type": "negative_values",
                "column": rev_col,
                "count": neg_rev,
                "message": f"{neg_rev} rows contain negative revenue values."
            })

    # 4. Date Integrity
    date_col = next((col for col, target in mappings.items() if target == "order_date"), None)
    invalid_dates = 0
    if date_col and date_col in df.columns:
        parsed_dates = pd.to_datetime(df[date_col], errors="coerce")
        invalid_dates = int(parsed_dates.isna().sum() - df[date_col].isna().sum())
        if invalid_dates > 0:
            anomalies.append({
                "type": "invalid_dates",
                "column": date_col,
                "count": invalid_dates,
                "message": f"{invalid_dates} rows contain unparseable date formats."
            })

    # 5. Schema Completeness
    mapped_targets = set(mappings.values())
    essential_fields = ["order_date", "revenue"]
    recommended_fields = ["order_id", "customer_id", "product_id", "category", "region"]

    essential_present = all(f in mapped_targets for f in essential_fields)
    recommended_count = sum(1 for f in recommended_fields if f in mapped_targets)

    # 6. Overall Data Health Score Calculation (0 - 100)
    health_score = 100.0
    health_score -= min(30.0, duplicate_pct * 3)
    health_score -= min(40.0, overall_missing_pct * 2)
    if not essential_present:
        health_score -= 25.0
    if invalid_dates > 0:
        health_score -= min(15.0, (invalid_dates / total_rows) * 100)

    health_score = max(10.0, min(100.0, round(health_score, 1)))

    return {
        "health_score": health_score,
        "health_rating": "Excellent" if health_score >= 85 else "Good" if health_score >= 70 else "Needs Attention",
        "total_rows": total_rows,
        "total_columns": total_cols,
        "duplicate_rows": duplicate_rows,
        "duplicate_pct": duplicate_pct,
        "overall_missing_pct": overall_missing_pct,
        "missing_breakdown": missing_by_col,
        "invalid_dates": invalid_dates,
        "anomalies_detected": anomalies,
        "schema_completeness": {
            "essential_present": essential_present,
            "recommended_mapped_count": recommended_count,
            "recommended_total": len(recommended_fields)
        }
    }
