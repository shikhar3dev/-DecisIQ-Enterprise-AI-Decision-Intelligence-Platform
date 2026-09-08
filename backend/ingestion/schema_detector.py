import re
import pandas as pd
from typing import Dict, List, Any

# Canonical DecisIQ Target Schema Fields with matching regex patterns
TARGET_FIELD_PATTERNS = {
    "order_id": [
        r"^(order|invoice|txn|transaction|sale)[_\s-]*(id|no|num|number|code)?$",
        r"^id$", r"^order$"
    ],
    "customer_id": [
        r"^(customer|client|cust|user|account|buyer)[_\s-]*(id|no|num|number|code)?$",
        r"^cust_id$", r"^uid$", r"^cid$"
    ],
    "customer_name": [
        r"^(customer|client|cust|user|account|buyer|contact)[_\s-]*(name|full[_\s-]*name)?$",
        r"^name$", r"^company[_\s-]*name$"
    ],
    "email": [
        r"^(customer[_\s-]*)?(email|mail|e_mail|contact_email)$"
    ],
    "order_date": [
        r"^(order|txn|transaction|invoice|purchase|sale|event|signup)?[_\s-]*(date|time|timestamp|dt)$",
        r"^date$", r"^created[_\s-]*(at|date)$", r"^signup_date$"
    ],
    "revenue": [
        r"^(net[_\s-]*)?(amount|revenue|sales|total|price|spend|gross[_\s-]*amount|order[_\s-]*value|val|value|metric_value|target|total_spend)$",
        r"^rev$", r"^sales[_\s-]*amt$", r"^value$", r"^val$", r"^total_spend$"
    ],
    "quantity": [
        r"^(quantity|qty|units|items|volume|count|total_orders)$",
        r"^units[_\s-]*sold$", r"^total_orders$"
    ],
    "cogs": [
        r"^(cogs|cost|unit[_\s-]*cost|expense|product[_\s-]*cost|line[_\s-]*cost)$",
        r"^cost[_\s-]*price$"
    ],
    "product_id": [
        r"^(product|item|sku|part|prod|time_series|series)[_\s-]*(id|no|num|number|code)?$",
        r"^sku$", r"^item_code$", r"^time_series_code$", r"^series_code$"
    ],
    "product_name": [
        r"^(product|item|sku|prod|description|series)[_\s-]*(name|title|desc|description)?$",
        r"^title$", r"^item_name$"
    ],
    "category": [
        r"^(category|department|dept|cat|vertical|class|type|series_type)$",
        r"^product[_\s-]*category$"
    ],
    "segment": [
        r"^(segment|rfm_segment|tier|customer_tier|group|persona)$",
        r"^customer_segment$"
    ],
    "region": [
        r"^(region|region_id|country|state|city|location|territory|market|zone|area)$",
        r"^geo([_\s-]*(region|loc|location|market|area))?$", r"^shipping[_\s-]*region$", r"^region_id$"
    ],
    "channel": [
        r"^(channel|source|medium|campaign|acquisition[_\s-]*channel|lead[_\s-]*source)$",
        r"^sales[_\s-]*channel$", r"^acquisition_channel$"
    ],
    "recency_days": [
        r"^(recency|recency_days|days_since_last_order|inactive_days)$"
    ],
    "churn_probability": [
        r"^(churn|churn_prob|churn_probability|churn_score|risk_score|churn_p)$"
    ],
    "churn_risk": [
        r"^(churn_risk|churn_risk_tier|risk_tier|risk_level)$"
    ],
    "nps_score": [
        r"^(nps|nps_score|satisfaction|csat|feedback_score)$"
    ],
    "status": [
        r"^(order[_\s-]*)?(status|state|delivery[_\s-]*status|stage)$"
    ],
    "payment_method": [
        r"^(payment[_\s-]*)?(method|mode|type|gateway)$"
    ]
}

def detect_column_schema(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyzes DataFrame columns, infers data types, and matches them to DecisIQ Canonical Schema fields.
    """
    columns = list(df.columns)
    suggested_mappings = {}
    field_confidences = {}
    assigned_targets = set()

    for col in columns:
        col_clean = str(col).lower().strip()
        best_match = None
        best_confidence = 0.0

        for target_field, patterns in TARGET_FIELD_PATTERNS.items():
            if target_field in assigned_targets:
                continue

            for pat in patterns:
                if re.search(pat, col_clean, re.IGNORECASE):
                    # Direct regex match
                    confidence = 95.0 if re.match(pat, col_clean) else 80.0
                    if confidence > best_confidence:
                        best_confidence = confidence
                        best_match = target_field
                        break

        # Additional semantic heuristics based on data values
        if not best_match:
            sample_values = df[col].dropna().head(20)
            if not sample_values.empty:
                # Check for date format
                if pd.api.types.is_datetime64_any_dtype(df[col]):
                    if "order_date" not in assigned_targets:
                        best_match = "order_date"
                        best_confidence = 90.0
                elif sample_values.astype(str).str.match(r"^\d{4}[-/]\d{1,2}[-/]\d{1,2}").all():
                    if "order_date" not in assigned_targets:
                        best_match = "order_date"
                        best_confidence = 85.0
                # Check for numeric amount / revenue
                elif pd.api.types.is_numeric_dtype(df[col]):
                    col_mean = df[col].mean()
                    if col_mean > 100 and "revenue" not in assigned_targets and ("amt" in col_clean or "val" in col_clean or "tot" in col_clean or "sale" in col_clean):
                        best_match = "revenue"
                        best_confidence = 80.0
                    elif col_mean < 50 and "quantity" not in assigned_targets and ("qty" in col_clean or "count" in col_clean or "unit" in col_clean):
                        best_match = "quantity"
                        best_confidence = 75.0

        if best_match:
            suggested_mappings[col] = best_match
            field_confidences[col] = best_confidence
            assigned_targets.add(best_match)
        else:
            suggested_mappings[col] = "unmapped"
            field_confidences[col] = 0.0

    return {
        "columns": columns,
        "suggested_mappings": suggested_mappings,
        "field_confidences": field_confidences,
        "all_target_fields": list(TARGET_FIELD_PATTERNS.keys())
    }
