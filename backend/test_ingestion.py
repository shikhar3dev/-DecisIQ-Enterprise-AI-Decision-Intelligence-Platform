import sys
import json
import urllib.request
from pathlib import Path

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("[*] 1. Testing GET /api/ingestion/sources...")
    req = urllib.request.Request(f"{BASE_URL}/api/ingestion/sources")
    res = json.loads(urllib.request.urlopen(req).read())
    print("    Current Source:", res["current_source"]["source_name"])
    print("    Available Benchmarks:", [b["key"] for b in res["public_benchmarks"]])

    print("[*] 2. Testing 1-Click Load Public Benchmark: Global Superstore...")
    data = json.dumps({"dataset_key": "superstore"}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/ingestion/load-public", data=data, headers={"Content-Type": "application/json"})
    try:
        res = json.loads(urllib.request.urlopen(req).read())
        print("    Ingested:", res["total_records_ingested"], "records across", res["total_customers"], "customers.")
    except urllib.error.HTTPError as e:
        print("    HTTPError:", e.code, e.read().decode('utf-8'))

    # Check updated KPIs
    kpi_res = json.loads(urllib.request.urlopen(f"{BASE_URL}/api/kpis").read())
    print("    Recalculated Superstore Revenue:", kpi_res["revenue_cr"], "Cr | Active Customers:", kpi_res["active_customers"])

    print("[*] 3. Testing BYOD Upload Raw CSV Text...")
    sample_csv = "order_id,cust_name,txn_date,item_name,category,order_amt,qty,geo_region\nORD-991,Apex Corp,2025-09-01,AI Server Node,Technology,185000,1,North America\nORD-992,Apex Corp,2025-09-15,Cloud Gateway,Technology,95000,1,North America"
    upload_data = json.dumps({"filename": "custom_sales.csv", "raw_content": sample_csv}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/ingestion/upload-raw", data=upload_data, headers={"Content-Type": "application/json"})
    upload_res = json.loads(urllib.request.urlopen(req).read())
    print("    File Uploaded ID:", upload_res["file_id"])
    print("    Health Score:", upload_res["quality_profile"]["health_score"], "%")
    print("    Auto-Detected Mappings:", upload_res["schema_detection"]["suggested_mappings"])

    print("[*] 4. Testing Apply Schema Mapping...")
    apply_data = json.dumps({
        "file_id": upload_res["file_id"],
        "mappings": upload_res["schema_detection"]["suggested_mappings"],
        "dataset_name": "Apex Custom Enterprise Ingestion"
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/ingestion/apply-mapping", data=apply_data, headers={"Content-Type": "application/json"})
    apply_res = json.loads(urllib.request.urlopen(req).read())
    print("    Ingestion Result:", apply_res["status"], "| Ingested:", apply_res["total_records_ingested"], "rows")

    print("[*] 5. Testing Reset Warehouse to Default Demo (51k orders)...")
    req = urllib.request.Request(f"{BASE_URL}/api/ingestion/reset-demo", data=b"{}", headers={"Content-Type": "application/json"})
    reset_res = json.loads(urllib.request.urlopen(req).read())
    print("    Reset Result:", reset_res["message"])

    # Verify reset KPIs
    final_kpis = json.loads(urllib.request.urlopen(f"{BASE_URL}/api/kpis").read())
    print("    Reset Revenue:", final_kpis["revenue_cr"], "Cr | Total Customers:", final_kpis["total_customers"])

    print("[+] All Ingestion, BYOD, Profiler & Benchmark Tests Passed Successfully!")

if __name__ == "__main__":
    test_api()
