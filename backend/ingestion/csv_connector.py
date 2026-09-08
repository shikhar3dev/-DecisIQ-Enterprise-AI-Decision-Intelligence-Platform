import io
import csv
import json
import re
import pandas as pd
from typing import Tuple, Dict, Any

# Known canonical header schemas to infer when headerless CSV is pasted
KNOWN_SCHEMAS = {
    14: [
        "customer_id", "customer_name", "email", "region_id", "segment", 
        "acquisition_channel", "signup_date", "total_spend", "total_orders", 
        "avg_order_value", "recency_days", "churn_probability", "churn_risk", "nps_score"
    ],
    13: [
        "order_id", "customer_id", "order_date", "channel_id", "region_id", 
        "gross_amount", "discount_amount", "net_amount", "cost_amount", 
        "profit_amount", "order_status", "payment_method", "delivery_days"
    ],
    8: [
        "order_id", "customer_name", "order_date", "product_name", 
        "category", "revenue", "quantity", "region"
    ]
}

def is_likely_data_row(row_items: list) -> bool:
    """Checks if a row contains indicators of being data rather than column headers."""
    for item in row_items:
        s = str(item).strip()
        # Check for ID formats (CUST-..., ORD-..., INV-..., REG-..., PRD-...)
        if re.match(r"^(CUST|ORD|INV|REG|PRD|ITM|TEL)-\d+", s, re.IGNORECASE):
            return True
        # Check for email format
        if "@" in s and "." in s and not any(k in s.lower() for k in ["email", "mail", "contact"]):
            return True
        # Check for ISO Date format
        if re.match(r"^\d{4}[-/]\d{1,2}[-/]\d{1,2}", s):
            return True
        # Check for float / decimal numbers
        if re.match(r"^\d+\.\d+$", s):
            return True
    return False

def parse_uploaded_file(file_bytes: bytes, filename: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Parses uploaded CSV, TSV, Excel, or JSON bytes into a sanitized Pandas DataFrame.
    Automatically identifies whether raw input has headers or is headerless data rows.
    Resilient to encodings, delimiters, bad lines, and formatting anomalies.
    """
    fname_lower = (filename or "").lower().strip()
    df = None
    file_type = "csv"
    headers_auto_assigned = False

    # 1. Excel format handling
    if fname_lower.endswith(".xlsx") or fname_lower.endswith(".xls"):
        file_type = "excel"
        try:
            df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
        except Exception:
            try:
                df = pd.read_excel(io.BytesIO(file_bytes))
            except Exception as e:
                raise ValueError(f"Failed to extract Excel file '{filename}': {e}")

    # 2. JSON format handling
    elif fname_lower.endswith(".json"):
        file_type = "json"
        try:
            json_data = json.loads(file_bytes.decode("utf-8-sig", errors="replace"))
            if isinstance(json_data, list):
                df = pd.DataFrame(json_data)
            elif isinstance(json_data, dict):
                for k in ["data", "records", "items", "orders", "results", "rows"]:
                    if k in json_data and isinstance(json_data[k], list):
                        df = pd.DataFrame(json_data[k])
                        break
                if df is None:
                    df = pd.json_normalize(json_data)
        except Exception as e:
            raise ValueError(f"Failed to extract JSON file '{filename}': {e}")

    # 3. Delimited Text (CSV, TSV, TXT, or unknown extension fallback)
    if df is None:
        file_type = "tsv" if fname_lower.endswith(".tsv") else "csv"
        encodings = ["utf-8-sig", "utf-8", "latin-1", "cp1252", "iso-8859-1"]
        
        for enc in encodings:
            try:
                text_sample = file_bytes[:32768].decode(enc, errors="replace")
                
                # Delimiter detection
                delim = ","
                if fname_lower.endswith(".tsv"):
                    delim = "\t"
                else:
                    try:
                        sniffer = csv.Sniffer()
                        dialect = sniffer.sniff(text_sample, delimiters=",;\t|")
                        delim = dialect.delimiter
                    except Exception:
                        first_lines = "\n".join(text_sample.strip().split("\n")[:5])
                        counts = {",": first_lines.count(","), ";": first_lines.count(";"), "\t": first_lines.count("\t"), "|": first_lines.count("|")}
                        best_delim = max(counts, key=counts.get)
                        if counts[best_delim] > 0:
                            delim = best_delim

                lines = [l for l in text_sample.strip().split("\n") if l.strip()]
                first_line_items = [c.strip() for c in lines[0].split(delim)] if lines else []
                has_no_header = is_likely_data_row(first_line_items)

                # Attempt 1: Standard read
                try:
                    if has_no_header:
                        df = pd.read_csv(io.BytesIO(file_bytes), encoding=enc, sep=delim, header=None, on_bad_lines="skip")
                        num_cols = len(df.columns)
                        if num_cols in KNOWN_SCHEMAS:
                            df.columns = KNOWN_SCHEMAS[num_cols][:num_cols]
                        else:
                            df.columns = [f"column_{i+1}" for i in range(num_cols)]
                        headers_auto_assigned = True
                    else:
                        df = pd.read_csv(io.BytesIO(file_bytes), encoding=enc, sep=delim, on_bad_lines="skip")
                except Exception:
                    # Attempt 2: Python engine fallback
                    df = pd.read_csv(io.BytesIO(file_bytes), encoding=enc, sep=delim, engine="python", on_bad_lines="skip")

                if df is not None and not df.empty:
                    break
            except Exception:
                continue

    if df is None or df.empty:
        # Ultimate fallback: attempt openpyxl if it might be an unlabelled excel file
        try:
            df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
            file_type = "excel"
        except Exception:
            pass

    if df is None or df.empty:
        raise ValueError(f"Could not extract data from '{filename}'. Please ensure the file is a valid CSV, Excel (.xlsx/.xls), or JSON dataset.")

    # Sanitize column names: remove BOM, leading/trailing whitespace, newlines
    df.columns = [str(c).replace("\ufeff", "").strip() for c in df.columns]

    # Clean preview records for JSON serialization (handle NaN, Timestamp, etc.)
    preview_df = df.head(10).copy()
    for col in preview_df.columns:
        if pd.api.types.is_datetime64_any_dtype(preview_df[col]):
            preview_df[col] = preview_df[col].astype(str)
    preview_rows = preview_df.fillna("").to_dict(orient="records")

    metadata = {
        "filename": filename or "uploaded_dataset.csv",
        "file_type": file_type,
        "total_rows": int(len(df)),
        "total_columns": int(len(df.columns)),
        "columns": [str(c) for c in df.columns],
        "headers_auto_assigned": bool(headers_auto_assigned),
        "preview": preview_rows
    }

    return df, metadata
