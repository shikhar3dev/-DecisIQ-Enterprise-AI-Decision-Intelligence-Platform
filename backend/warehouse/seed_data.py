import os
import sys
import random
import datetime
import numpy as np
import pandas as pd
from pathlib import Path

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure module path resolution
sys.path.append(str(Path(__file__).resolve().parent))
from db import get_connection, DB_PATH

random.seed(42)
np.random.seed(42)

def seed_enterprise_warehouse():
    print("[*] Initializing Enterprise Data Warehouse Star-Schema...")
    schema_file = Path(__file__).resolve().parent / "schema.sql"
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Drop existing tables cleanly without Windows file lock issues
    tables = [
        "fact_order_items", "fact_orders", "dim_customers", "dim_products",
        "dim_regions", "dim_marketing_campaigns", "fact_daily_business_pulse",
        "fact_customer_telemetry"
    ]
    for tbl in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {tbl}")
    conn.commit()
    
    with open(schema_file, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    
    # 1. Seed Regions
    regions = [
        ("REG-NORTH", "North Region", "New Delhi", "Tier-1", 1.15, 0.88),
        ("REG-SOUTH", "South Region", "Bengaluru", "Tier-1", 1.25, 0.96),
        ("REG-WEST", "West Region", "Mumbai", "Tier-1", 1.30, 0.95),
        ("REG-EAST", "East Region", "Kolkata", "Tier-2", 0.95, 0.90),
        ("REG-CENTRAL", "Central Region", "Hyderabad", "Tier-2", 1.05, 0.92),
    ]
    cursor.executemany(
        "INSERT INTO dim_regions VALUES (?, ?, ?, ?, ?, ?)",
        regions
    )
    
    # 2. Seed Products
    products = [
        # Electronics
        ("PRD-ELEC-01", "SKU-EL-001", "UltraBook Pro 15 M3", "Electronics", "Laptops", 62000, 89999, 31.1, 450, 80, 14, -1.1),
        ("PRD-ELEC-02", "SKU-EL-002", "NoiseCancel X900 Headset", "Electronics", "Audio", 4500, 8990, 49.9, 1200, 200, 7, -1.4),
        ("PRD-ELEC-03", "SKU-EL-003", "4K Ultra-Wide Studio Display", "Electronics", "Monitors", 24000, 39999, 40.0, 320, 60, 21, -0.9),
        ("PRD-ELEC-04", "SKU-EL-004", "AI Edge Compute Hub", "Electronics", "IoT", 11000, 18499, 40.5, 600, 100, 10, -1.2),
        ("PRD-ELEC-05", "SKU-EL-005", "Smart Sensor Array Pro", "Electronics", "IoT", 3200, 5999, 46.6, 950, 150, 7, -1.3),
        
        # Fashion & Apparel
        ("PRD-FASH-01", "SKU-FA-001", "Executive Merino Wool Blazer", "Fashion", "Outerwear", 3800, 7999, 52.5, 800, 120, 12, -1.6),
        ("PRD-FASH-02", "SKU-FA-002", "Ergonomic Performance Tech-Suit", "Fashion", "Apparel", 2200, 4999, 56.0, 1500, 250, 10, -1.7),
        ("PRD-FASH-03", "SKU-FA-003", "Full-Grain Leather Courier Briefcase", "Fashion", "Accessories", 2900, 6499, 55.4, 400, 80, 15, -1.2),
        ("PRD-FASH-04", "SKU-FA-004", "All-Weather Commuter Trench", "Fashion", "Outerwear", 3100, 6899, 55.1, 600, 100, 14, -1.5),
        
        # Home & Living
        ("PRD-HOME-01", "SKU-HM-001", "Smart Dual-Motor Standing Desk", "Home & Living", "Office Furniture", 16000, 27999, 42.8, 350, 50, 18, -1.0),
        ("PRD-HOME-02", "SKU-HM-002", "Ergonomic Mesh Lumbar Chair Pro", "Home & Living", "Office Furniture", 8500, 15999, 46.9, 700, 120, 14, -1.3),
        ("PRD-HOME-03", "SKU-HM-003", "HEPA-14 Smart Ambient Air Purifier", "Home & Living", "Appliances", 6200, 11499, 46.1, 850, 140, 10, -1.4),
        ("PRD-HOME-04", "SKU-HM-004", "Minimalist Brass Desk Lighting Suite", "Home & Living", "Lighting", 1800, 3999, 55.0, 1100, 180, 7, -1.5),
        
        # Health & Wellness
        ("PRD-HLTH-01", "SKU-HW-001", "Pro Biometric Sleep & HRV Tracker", "Health & Wellness", "Wearables", 4800, 9999, 52.0, 1400, 200, 7, -1.3),
        ("PRD-HLTH-02", "SKU-HW-002", "Precision Cold-Brew Hydro Pod", "Health & Wellness", "Nutrition", 1200, 2899, 58.6, 1800, 300, 5, -1.8),
        ("PRD-HLTH-03", "SKU-HW-003", "Orthopedic Contour Memory Pillow", "Health & Wellness", "Sleep Care", 950, 2499, 62.0, 2200, 400, 5, -1.6),
    ]
    cursor.executemany(
        "INSERT INTO dim_products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        products
    )
    
    # 3. Seed Marketing Campaigns
    campaigns = [
        ("CMP-001", "Google Search - High Intent Enterprise", "Google Search", "All", 2500000, 2480000, 1200000, 94000, 4200, 14500000, 5.85, 590, "Active"),
        ("CMP-002", "Meta Retargeting - Cart Dropoffs", "Meta Ads", "At-Risk", 1200000, 1190000, 850000, 58000, 3100, 8400000, 7.06, 383, "Active"),
        ("CMP-003", "Meta Ads - Summer Rush Promotion", "Meta Ads", "Potential", 1800000, 1800000, 1500000, 42000, 850, 1260000, 0.70, 2117, "Paused"), # Wasteful campaign
        ("CMP-004", "LinkedIn B2B Ergonomic Campaign", "LinkedIn", "Champions", 1500000, 1450000, 450000, 28000, 1450, 9200000, 6.34, 1000, "Active"),
        ("CMP-005", "YouTube Tech Influencer Showcases", "YouTube", "Potential", 3000000, 2950000, 4200000, 210000, 5600, 16800000, 5.69, 526, "Active"),
        ("CMP-006", "VIP Customer Retention Automated CRM", "Email CRM", "Champions", 400000, 390000, 320000, 96000, 4800, 18400000, 47.18, 81, "Active"),
        ("CMP-007", "Organic Search & SEO Content Hub", "Organic", "All", 600000, 580000, 3800000, 340000, 8900, 28500000, 49.13, 65, "Active"),
    ]
    cursor.executemany(
        "INSERT INTO dim_marketing_campaigns VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        campaigns
    )
    
    # 4. Generate Customers (4,000 customers)
    first_names = ["Aarav", "Aditi", "Rohan", "Priya", "Vikram", "Sneha", "Kabir", "Ananya", "Rahul", "Meera",
                   "Arjun", "Neha", "Dev", "Isha", "Karan", "Pooja", "Siddharth", "Tanvi", "Nikhil", "Rhea",
                   "Sameer", "Divya", "Aditya", "Tara", "Amit", "Kavya", "Manish", "Simran", "Varun", "Shruti"]
    last_names = ["Sharma", "Verma", "Patel", "Mehta", "Iyer", "Nair", "Reddy", "Singhania", "Kapoor", "Bose",
                  "Gupta", "Deshmukh", "Chopra", "Malhotra", "Joshi", "Bhatia", "Saxena", "Sen", "Menon", "Trivedi"]
    
    channels = ["Google Search", "Meta Ads", "Organic", "Referral", "LinkedIn", "Email CRM"]
    channel_weights = [0.30, 0.25, 0.20, 0.12, 0.08, 0.05]
    
    region_ids = [r[0] for r in regions]
    region_weights = [0.28, 0.26, 0.24, 0.11, 0.11]
    
    start_date = datetime.date(2024, 1, 1)
    end_date = datetime.date(2025, 12, 31)
    total_days = (end_date - start_date).days
    
    customers = []
    customer_ids = []
    
    for i in range(1, 4001):
        cid = f"CUST-{i:05d}"
        customer_ids.append(cid)
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        name = f"{fn} {ln}"
        email = f"{fn.lower()}.{ln.lower()}{random.randint(10,99)}@corpmail.com"
        reg_id = random.choices(region_ids, weights=region_weights)[0]
        acq_chan = random.choices(channels, weights=channel_weights)[0]
        acq_day_offset = random.randint(0, total_days - 30)
        acq_date = start_date + datetime.timedelta(days=acq_day_offset)
        
        # Segment tier assignment logic (will update exact totals after orders)
        segment = random.choices(
            ["Champions", "Loyal", "Potential", "At-Risk", "Lost"],
            weights=[0.15, 0.25, 0.30, 0.18, 0.12]
        )[0]
        
        churn_risk = random.uniform(0.02, 0.25)
        risk_tier = "Low"
        if segment == "At-Risk":
            churn_risk = random.uniform(0.65, 0.92)
            risk_tier = "High"
        elif segment == "Lost":
            churn_risk = random.uniform(0.85, 0.99)
            risk_tier = "High"
        elif segment == "Potential":
            churn_risk = random.uniform(0.20, 0.55)
            risk_tier = "Medium"
            
        nps = random.randint(7, 10) if churn_risk < 0.4 else random.randint(2, 6)
        
        customers.append((
            cid, name, email, reg_id, segment, acq_chan, str(acq_date),
            0.0, 0, 0.0, 0, round(churn_risk, 3), risk_tier, nps
        ))
        
    cursor.executemany(
        "INSERT INTO dim_customers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        customers
    )
    
    print("[*] Generating 45,000+ realistic transaction records with seasonality & anomalies...")
    
    orders = []
    order_items = []
    customer_spend = {cid: {"orders": 0, "spend": 0.0, "last_date": start_date} for cid in customer_ids}
    
    order_counter = 1
    item_counter = 1
    
    payment_methods = ["Credit Card", "UPI / Instant", "Net Banking", "Corporate Invoicing"]
    order_statuses = ["Delivered", "Delivered", "Delivered", "Delivered", "Processing", "Cancelled", "Returned"]
    
    current_date = start_date
    daily_pulse = []
    
    # Product lookup dict
    prod_dict = {p[0]: {"price": p[6], "cost": p[5], "cat": p[3]} for p in products}
    prod_ids = list(prod_dict.keys())
    
    # Intentional Anomaly Dates:
    # 1. Payment gateway breakdown on 2025-08-12 (severe drop)
    # 2. Diwali surge on 2024-11-01 & 2025-10-20
    # 3. North Region electronics stockout from 2025-07-01 to 2025-09-30
    
    while current_date <= end_date:
        day_str = str(current_date)
        is_weekend = current_date.weekday() >= 5
        month = current_date.month
        year = current_date.year
        
        # Base daily order volume
        base_orders = 55 + (15 if is_weekend else 0)
        
        # Seasonality factor (Q4 festival spike, summer boost)
        seasonal_mult = 1.0
        if month in [10, 11]: # Q4 Festive Peak (Diwali / Black Friday)
            seasonal_mult = 1.85
        elif month in [12]:
            seasonal_mult = 1.45
        elif month in [6, 7]:
            seasonal_mult = 1.15
        elif month in [2, 3]:
            seasonal_mult = 0.90
            
        day_orders_count = int(np.random.normal(base_orders * seasonal_mult, 8))
        day_orders_count = max(20, day_orders_count)
        
        is_anomaly = 0
        anomaly_sev = "Normal"
        anomaly_reason = None
        
        # Anomaly 1: Payment Gateway Outage (2025-08-12)
        if current_date == datetime.date(2025, 8, 12):
            day_orders_count = int(day_orders_count * 0.35)
            is_anomaly = 1
            anomaly_sev = "Critical"
            anomaly_reason = "Payment Gateway Outage (UPI & Card API Timeout Spike 44.8%)"
            
        # Anomaly 2: Flash Sale Spike (2025-10-25)
        elif current_date == datetime.date(2025, 10, 25):
            day_orders_count = int(day_orders_count * 2.8)
            is_anomaly = 1
            anomaly_sev = "Moderate"
            anomaly_reason = "Pre-Festive Mega Flash Sale Activation Surge"
            
        # Anomaly 3: Sudden Return Rate Spike (2025-03-18)
        elif current_date == datetime.date(2025, 3, 18):
            is_anomaly = 1
            anomaly_sev = "Moderate"
            anomaly_reason = "Logistics Carrier Quality Incident in West Region"
            
        day_rev = 0.0
        day_cogs = 0.0
        
        for _ in range(day_orders_count):
            oid = f"ORD-{order_counter:07d}"
            order_counter += 1
            
            cust_id = random.choice(customer_ids)
            reg_id = random.choices(region_ids, weights=region_weights)[0]
            chan_id = random.choices(["CMP-001", "CMP-002", "CMP-004", "CMP-005", "CMP-006", "CMP-007"], weights=[0.25, 0.20, 0.15, 0.20, 0.10, 0.10])[0]
            
            # Select 1 to 4 items per order
            num_items = random.choices([1, 2, 3, 4], weights=[0.55, 0.28, 0.12, 0.05])[0]
            
            # North region electronics supply shock between July 2025 and Sept 2025
            is_north_q3 = (reg_id == "REG-NORTH" and year == 2025 and month in [7, 8, 9])
            
            order_gross = 0.0
            order_discount = 0.0
            order_cost = 0.0
            
            for _ in range(num_items):
                item_id = f"ITM-{item_counter:08d}"
                item_counter += 1
                
                # If North Q3, heavily suppress electronics selection due to stockouts
                if is_north_q3:
                    available_prods = [pid for pid in prod_ids if prod_dict[pid]["cat"] != "Electronics"]
                    pid = random.choice(available_prods)
                else:
                    pid = random.choice(prod_ids)
                    
                pinfo = prod_dict[pid]
                qty = random.choices([1, 2, 3], weights=[0.82, 0.14, 0.04])[0]
                uprice = pinfo["price"]
                ucost = pinfo["cost"]
                
                disc_pct = random.choices([0.0, 0.05, 0.10, 0.15, 0.20], weights=[0.50, 0.25, 0.15, 0.07, 0.03])[0]
                disc_amt = round(uprice * qty * disc_pct, 2)
                line_tot = round(uprice * qty - disc_amt, 2)
                line_cost = round(ucost * qty, 2)
                line_prof = round(line_tot - line_cost, 2)
                
                order_gross += uprice * qty
                order_discount += disc_amt
                order_cost += line_cost
                
                order_items.append((
                    item_id, oid, pid, qty, uprice, disc_amt, line_tot, line_cost, line_prof
                ))
                
            order_net = round(order_gross - order_discount, 2)
            order_profit = round(order_net - order_cost, 2)
            
            status = random.choices(order_statuses, weights=[0.82, 0.05, 0.04, 0.03, 0.03, 0.02, 0.01])[0]
            pay_method = random.choice(payment_methods)
            delivery_days = random.randint(2, 6)
            
            orders.append((
                oid, cust_id, day_str, chan_id, reg_id,
                order_gross, order_discount, order_net, order_cost, order_profit,
                status, pay_method, delivery_days
            ))
            
            if status != "Cancelled":
                day_rev += order_net
                day_cogs += order_cost
                customer_spend[cust_id]["orders"] += 1
                customer_spend[cust_id]["spend"] += order_net
                customer_spend[cust_id]["last_date"] = current_date
                
        # Compute daily pulse row
        day_aov = round(day_rev / day_orders_count, 2) if day_orders_count > 0 else 0
        day_margin = round(((day_rev - day_cogs) / day_rev * 100), 2) if day_rev > 0 else 0
        visitors = int(day_orders_count * random.uniform(28, 42))
        abandons = int(visitors * random.uniform(0.08, 0.16))
        conv_rate = round((day_orders_count / visitors) * 100, 2) if visitors > 0 else 0
        ret_rate = round(random.uniform(1.8, 3.8), 2)
        if current_date == datetime.date(2025, 3, 18):
            ret_rate = 14.6
        if current_date == datetime.date(2025, 8, 12):
            abandons = int(visitors * 0.448)
            conv_rate = 0.85
            
        daily_pulse.append((
            day_str, round(day_rev, 2), day_orders_count, day_aov, day_margin,
            int(day_orders_count * 0.9), abandons, visitors, conv_rate, ret_rate,
            is_anomaly, anomaly_sev, anomaly_reason
        ))
        
        current_date += datetime.timedelta(days=1)
        
    # Bulk insert orders and items in chunks for speed
    print(f"[*] Inserting {len(orders)} orders into fact_orders...")
    cursor.executemany("INSERT INTO fact_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", orders)
    
    print(f"[*] Inserting {len(order_items)} items into fact_order_items...")
    cursor.executemany("INSERT INTO fact_order_items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", order_items)
    
    print("[*] Inserting daily telemetry pulse records...")
    cursor.executemany("INSERT INTO fact_daily_business_pulse VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", daily_pulse)
    
    # 6. Update Customer RFM Metrics and Recency
    print("[*] Updating Customer 360 Aggregations & Telemetry...")
    cust_updates = []
    telemetry_logs = []
    telem_id = 1
    
    for cid, stat in customer_spend.items():
        total_sp = round(stat["spend"], 2)
        total_ord = stat["orders"]
        aov = round(total_sp / total_ord, 2) if total_ord > 0 else 0
        recency = (end_date - stat["last_date"]).days
        
        # Dynamic segment classification
        if total_sp > 150000 and total_ord >= 6 and recency <= 45:
            seg = "Champions"
            churn_p = round(random.uniform(0.02, 0.15), 3)
            risk_t = "Low"
        elif total_ord >= 4 and recency <= 75:
            seg = "Loyal"
            churn_p = round(random.uniform(0.10, 0.30), 3)
            risk_t = "Low"
        elif total_sp > 60000 and recency > 90:
            seg = "At-Risk"
            churn_p = round(random.uniform(0.68, 0.94), 3)
            risk_t = "High"
        elif total_ord <= 2 and recency <= 60:
            seg = "Potential"
            churn_p = round(random.uniform(0.25, 0.50), 3)
            risk_t = "Medium"
        else:
            seg = "Lost" if recency > 150 else "Potential"
            churn_p = round(random.uniform(0.75, 0.98), 3) if seg == "Lost" else round(random.uniform(0.35, 0.60), 3)
            risk_t = "High" if seg == "Lost" else "Medium"
            
        cust_updates.append((total_sp, total_ord, aov, recency, churn_p, risk_t, seg, cid))
        
        # Generate Telemetry entry
        t_duration = random.randint(120, 1800) if churn_p < 0.5 else random.randint(20, 300)
        pages = random.randint(4, 25) if churn_p < 0.5 else random.randint(1, 5)
        abandons = random.randint(0, 2) if churn_p < 0.5 else random.randint(2, 6)
        tickets = random.randint(0, 1) if churn_p < 0.5 else random.randint(2, 5)
        disc_search = random.randint(0, 1) if seg == "Champions" else random.randint(2, 8)
        
        telemetry_logs.append((
            f"TEL-{telem_id:06d}", cid, f"2025-12-30 {random.randint(9,21):02d}:{random.randint(0,59):02d}:00",
            t_duration, pages, abandons, tickets, disc_search
        ))
        telem_id += 1
        
    cursor.executemany("""
        UPDATE dim_customers
        SET total_spend = ?, total_orders = ?, aov = ?, recency_days = ?, churn_probability = ?, churn_risk_tier = ?, segment = ?
        WHERE customer_id = ?
    """, cust_updates)
    
    cursor.executemany("INSERT INTO fact_customer_telemetry VALUES (?, ?, ?, ?, ?, ?, ?, ?)", telemetry_logs)
    
    conn.commit()
    conn.close()
    print("[+] Enterprise Data Warehouse Seeded Successfully!")
    print(f"   * Customers: {len(customers):,}")
    print(f"   * Products: {len(products):,}")
    print(f"   * Orders: {len(orders):,}")
    print(f"   * Line Items: {len(order_items):,}")
    print(f"   * Daily Pulse Points: {len(daily_pulse):,}")

if __name__ == "__main__":
    seed_enterprise_warehouse()
