# 📊 Enterprise AI Decision Intelligence Platform — Power BI Asset Pack

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
