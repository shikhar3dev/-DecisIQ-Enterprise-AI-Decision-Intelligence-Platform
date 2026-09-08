import sqlite3
import os
import pandas as pd
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "enterprise_warehouse.db"

def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def execute_query(query: str, params=()):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return cursor.fetchall()

def query_df(query: str, params=()) -> pd.DataFrame:
    with get_connection() as conn:
        return pd.read_sql_query(query, conn, params=params)

def execute_script(script_path: Path):
    with get_connection() as conn:
        with open(script_path, "r", encoding="utf-8") as f:
            sql_script = f.read()
        conn.executescript(sql_script)
        conn.commit()
