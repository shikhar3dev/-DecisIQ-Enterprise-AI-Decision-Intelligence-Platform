import sys
import json
import urllib.request

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

def test_workspace():
    print("[*] 1. Testing GET /api/workspace/catalog...")
    req = urllib.request.Request(f"{BASE_URL}/api/workspace/catalog")
    cat = json.loads(urllib.request.urlopen(req).read())
    print(f"    Found {cat['total_datasets']} datasets | Active records: {cat['active_records_total']:,}")
    for d in cat["datasets"]:
        print(f"    - {d['name']} ({d['category']}): {d['row_count']:,} rows, Health: {d['health_status']}, Ver: {d['version_tag']}")

    print("[*] 2. Testing GET /api/workspace/versions/ds_orders...")
    req = urllib.request.Request(f"{BASE_URL}/api/workspace/versions/ds_orders")
    vers = json.loads(urllib.request.urlopen(req).read())
    print(f"    Found {len(vers)} versions for ds_orders:")
    for v in vers:
        print(f"    - {v['version_tag']} ({v['file_name']}): {v['row_count']:,} rows, Status: {v['status']}, Hash: {v['file_hash']}")

    print("[*] 3. Testing POST /api/workspace/compare (v2 vs v3)...")
    comp_data = json.dumps({"version_a_id": "ver_orders_v2", "version_b_id": "ver_orders_v3"}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/workspace/compare", data=comp_data, headers={"Content-Type": "application/json"})
    comp = json.loads(urllib.request.urlopen(req).read())
    print(f"    Revenue Delta: ₹{comp['deltas']['revenue_cr']:+.2f} Cr ({comp['deltas']['revenue_pct']:+.1f}%) | Rows Delta: {comp['deltas']['rows']:+,}")
    print(f"    AI Narrative: \"{comp['ai_explanation']}\"")

    print("[*] 4. Testing GET /api/workspace/lineage/revenue_cr...")
    req = urllib.request.Request(f"{BASE_URL}/api/workspace/lineage/revenue_cr")
    lin = json.loads(urllib.request.urlopen(req).read())
    print(f"    Metric: {lin['metric_name']} = {lin['current_value']}")
    print(f"    Lineage Nodes ({len(lin['lineage_nodes'])} steps):")
    for n in lin['lineage_nodes']:
        print(f"    [{n['step']}] {n['title']} -> {n['desc']}")

    print("[*] 5. Testing GET /api/workspace/audit-log...")
    req = urllib.request.Request(f"{BASE_URL}/api/workspace/audit-log?limit=5")
    events = json.loads(urllib.request.urlopen(req).read())
    print(f"    Recent Audit Events ({len(events)}):")
    for e in events:
        print(f"    [{e['timestamp']}] {e['user_name']} -> {e['action']} ({e['target_entity']})")

    print("[*] 6. Testing GET /api/workspace/analysis-runs...")
    req = urllib.request.Request(f"{BASE_URL}/api/workspace/analysis-runs")
    runs = json.loads(urllib.request.urlopen(req).read())
    print(f"    Found {len(runs)} Historical Analysis Runs:")
    for r in runs:
        print(f"    - Run #{r['run_number']} on {r['dataset_name']}: Rev ₹{r['revenue_cr']} Cr, Forecast ₹{r['forecast_target_cr']} Cr")

    print("[+] All Enterprise Data Workspace Tests Passed Successfully!")

if __name__ == "__main__":
    test_workspace()
