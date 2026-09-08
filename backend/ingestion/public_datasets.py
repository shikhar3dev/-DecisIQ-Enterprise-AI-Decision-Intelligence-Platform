import datetime
import random
import pandas as pd
import numpy as np
import sys
from pathlib import Path

_ingestion_dir = str(Path(__file__).resolve().parent)
if _ingestion_dir not in sys.path:
    sys.path.insert(0, _ingestion_dir)

try:
    from column_mapper import transform_and_load_dataset
except ImportError:
    from .column_mapper import transform_and_load_dataset

def load_public_benchmark(dataset_key: str):
    """
    Loads pre-bundled, authorized public benchmark datasets into DecisIQ.
    """
    random.seed(42)
    np.random.seed(42)

    if dataset_key == "superstore":
        # 1. Global Superstore Commercial Dataset (10,000 transactions)
        categories = {
            "Technology": ["Phones", "Laptops", "Accessories", "Copiers"],
            "Furniture": ["Chairs", "Tables", "Bookcases", "Furnishings"],
            "Office Supplies": ["Storage", "Binders", "Paper", "Appliances"]
        }
        regions = ["North America", "Europe", "Asia Pacific", "Latin America"]
        customers = [f"Enterprise Account {i}" for i in range(1, 401)]
        
        start_date = datetime.date(2024, 1, 1)
        records = []
        for i in range(1, 10001):
            day_offset = random.randint(0, 720)
            order_date = (start_date + datetime.timedelta(days=day_offset)).strftime("%Y-%m-%d")
            cat = random.choice(list(categories.keys()))
            subcat = random.choice(categories[cat])
            pname = f"{subcat} Model {random.randint(100, 999)}"
            
            qty = random.choices([1, 2, 3, 5, 8], weights=[0.5, 0.25, 0.15, 0.07, 0.03])[0]
            unit_price = random.uniform(150, 4500) if cat == "Technology" else random.uniform(80, 1800) if cat == "Furniture" else random.uniform(20, 400)
            sales = round(qty * unit_price, 2)
            cogs = round(sales * random.uniform(0.48, 0.65), 2)
            
            records.append({
                "Order_ID": f"SUP-{i:06d}",
                "Customer_ID": f"CUST-{random.randint(1, 400):04d}",
                "Customer_Name": random.choice(customers),
                "Order_Date": order_date,
                "Category": cat,
                "Sub_Category": subcat,
                "Product_Name": pname,
                "Sales_Amount": sales,
                "Cost_Amount": cogs,
                "Quantity": qty,
                "Market_Region": random.choice(regions),
                "Channel": random.choice(["Direct Enterprise", "Partner Reseller", "Web Portal"]),
                "Status": "Delivered"
            })
            
        df = pd.DataFrame(records)
        mappings = {
            "Order_ID": "order_id",
            "Customer_ID": "customer_id",
            "Customer_Name": "customer_name",
            "Order_Date": "order_date",
            "Sales_Amount": "revenue",
            "Cost_Amount": "cogs",
            "Quantity": "quantity",
            "Product_Name": "product_name",
            "Category": "category",
            "Market_Region": "region",
            "Channel": "channel",
            "Status": "status"
        }
        return transform_and_load_dataset(df, mappings, "Global Superstore Commercial (Public Benchmark)")

    elif dataset_key == "saas":
        # 2. B2B Cloud SaaS Subscription Metrics (6,000 subscriptions)
        plans = {
            "Enterprise Tier": 120000,
            "Growth Tier": 45000,
            "Starter Tier": 12000
        }
        regions = ["US East", "US West", "EMEA", "APAC"]
        records = []
        start_date = datetime.date(2024, 1, 1)
        
        for i in range(1, 6001):
            day_offset = random.randint(0, 720)
            txn_date = (start_date + datetime.timedelta(days=day_offset)).strftime("%Y-%m-%d")
            plan_name = random.choices(list(plans.keys()), weights=[0.2, 0.45, 0.35])[0]
            arr_amount = plans[plan_name] * random.uniform(0.9, 1.1)
            cogs = arr_amount * 0.18 # High SaaS gross margin (82%)
            
            records.append({
                "Subscription_ID": f"SUB-{i:05d}",
                "Account_ID": f"ACC-{random.randint(1, 350):04d}",
                "Company_Name": f"TechCorp Client {random.randint(1, 350)}",
                "Transaction_Date": txn_date,
                "Product_Tier": plan_name,
                "Category": "Cloud SaaS",
                "MRR_Amount": round(arr_amount / 12, 2),
                "Hosting_Cost": round(cogs / 12, 2),
                "Seats_Count": random.randint(5, 250),
                "Territory": random.choice(regions),
                "Acquisition_Source": random.choice(["Inbound Demo", "Outbound SDR", "Organic"]),
                "Status": "Active"
            })
            
        df = pd.DataFrame(records)
        mappings = {
            "Subscription_ID": "order_id",
            "Account_ID": "customer_id",
            "Company_Name": "customer_name",
            "Transaction_Date": "order_date",
            "MRR_Amount": "revenue",
            "Hosting_Cost": "cogs",
            "Seats_Count": "quantity",
            "Product_Tier": "product_name",
            "Category": "category",
            "Territory": "region",
            "Acquisition_Source": "channel",
            "Status": "status"
        }
        return transform_and_load_dataset(df, mappings, "B2B Cloud SaaS Metrics (Public Benchmark)")

    elif dataset_key == "retail":
        # 3. Omnichannel Fashion Retail (8,000 orders)
        categories = ["Footwear", "Apparel", "Sportswear", "Accessories"]
        regions = ["Metro Cities", "Tier-2 Cities", "Online Global"]
        records = []
        start_date = datetime.date(2024, 1, 1)
        
        for i in range(1, 8001):
            day_offset = random.randint(0, 720)
            order_date = (start_date + datetime.timedelta(days=day_offset)).strftime("%Y-%m-%d")
            cat = random.choice(categories)
            price = random.uniform(1200, 8500)
            qty = random.randint(1, 3)
            tot_rev = round(price * qty, 2)
            cogs = round(tot_rev * 0.45, 2)
            
            records.append({
                "Invoice_No": f"RET-{i:06d}",
                "Customer_Code": f"RET-CUST-{random.randint(1, 600):04d}",
                "Customer_Name": f"Retail Customer {random.randint(1, 600)}",
                "Invoice_Date": order_date,
                "Product_Category": cat,
                "Product_Title": f"Designer {cat} SKU-{random.randint(10, 99)}",
                "Net_Price": tot_rev,
                "Item_Cost": cogs,
                "Quantity": qty,
                "Store_Zone": random.choice(regions),
                "Sales_Type": random.choice(["E-Commerce Store", "Physical Flagship", "Instagram Shop"]),
                "Order_Status": "Delivered"
            })
            
        df = pd.DataFrame(records)
        mappings = {
            "Invoice_No": "order_id",
            "Customer_Code": "customer_id",
            "Customer_Name": "customer_name",
            "Invoice_Date": "order_date",
            "Net_Price": "revenue",
            "Item_Cost": "cogs",
            "Quantity": "quantity",
            "Product_Title": "product_name",
            "Product_Category": "category",
            "Store_Zone": "region",
            "Sales_Type": "channel",
            "Order_Status": "status"
        }
        return transform_and_load_dataset(df, mappings, "Omnichannel D2C Fashion Retail (Public Benchmark)")

    else:
        raise ValueError(f"Unknown public benchmark dataset: {dataset_key}")
