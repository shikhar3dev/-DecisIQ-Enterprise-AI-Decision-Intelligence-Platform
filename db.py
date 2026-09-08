"""
DecisIQ Root Database Connector Proxy
Exposes warehouse database routines across the entire project root.
"""
import sys
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent / "backend")
warehouse_dir = str(Path(__file__).resolve().parent / "backend" / "warehouse")

for d in [backend_dir, warehouse_dir]:
    if d not in sys.path:
        sys.path.insert(0, d)

try:
    from warehouse.db import (
        get_connection,
        query_df,
        execute_query,
        DB_PATH
    )
except ImportError:
    from db import (
        get_connection,
        query_df,
        execute_query,
        DB_PATH
    )

__all__ = [
    "get_connection",
    "query_df",
    "execute_query",
    "DB_PATH"
]
