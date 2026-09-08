import os
import sys
import pandas as pd
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent / "warehouse"))
sys.path.append(str(Path(__file__).resolve().parent.parent))

from db import query_df, get_connection

def generate_powerbi_asset_pack():
    """
    Exports all warehouse tables to clean CSVs and creates Power BI / Tableau Starter Assets.
    """
    export_dir = Path(__file__).resolve().parent.parent.parent / "powerbi_export_pack"
    export_dir.mkdir(parents=True, exist_ok=True)
    
    tables = [
        "dim_customers",
        "dim_products",
        "dim_regions",
        "dim_marketing_campaigns",
        "fact_orders",
        "fact_order_items",
        "fact_daily_business_pulse",
        "fact_customer_telemetry"
    ]
    
    exported_files = []
    
    for tbl in tables:
        df = query_df(f"SELECT * FROM {tbl}")
        csv_path = export_dir / f"{tbl}.csv"
        df.to_csv(csv_path, index=False)
        exported_files.append(str(csv_path))
        
    # Generate Power BI Integration Readme & Schema Mapping
    readme_path = export_dir / "README_POWERBI_INTEGRATION.md"
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write("""# 📊 Enterprise AI Decision Intelligence Platform — Power BI Asset Pack

## 🚀 How to Load into Power BI Desktop:
1. Open **Power BI Desktop**.
2. Click **Get Data** -> **Text/CSV** -> Select the `.csv` files in this folder.
3. Establish Relationships in **Model View**:
   - `fact_orders[customer_id]` (Many) ➔ `dim_customers[customer_id]` (One)
   - `fact_orders[region_id]` (Many) ➔ `dim_regions[region_id]` (One)
   - `fact_order_items[order_id]` (Many) ➔ `fact_orders[order_id]` (One)
   - `fact_order_items[product_id]` (Many) ➔ `dim_products[product_id]` (One)
4. Open the `03_powerbi_dax_measures.dax` file in the `sql_analytics/` directory and copy the DAX measures into your Power BI model.

---

## 📈 Included Tables:
- `dim_customers.csv` (Customer 360, RFM segments, churn risk probabilities)
- `dim_products.csv` (SKUs, categories, margins, safety stock, price elasticity)
- `dim_regions.csv` (Market tiers, regional GDP index, logistics scores)
- `dim_marketing_campaigns.csv` (Channel spend, impressions, conversions, ROAS, CAC)
- `fact_orders.csv` (Order grain transactions with delivery days & payment methods)
- `fact_order_items.csv` (Line item unit prices, discounts, and margins)
- `fact_daily_business_pulse.csv` (Daily revenue, AOV, conversion rate, anomaly flags)
""")

    return {
        "status": "success",
        "export_directory": str(export_dir),
        "exported_files": exported_files,
        "readme": str(readme_path)
    }

if __name__ == "__main__":
    res = generate_powerbi_asset_pack()
    print("[+] Exported Power BI pack:", res)
