"""
Enterprise Database Connector Proxy
Exposes warehouse database routines (query_df, execute_query, get_connection, DB_PATH)
to all analytics, ML, simulation, and workspace modules.
"""
import sys
from pathlib import Path

_backend_dir = str(Path(__file__).resolve().parent)
_warehouse_dir = str(Path(__file__).resolve().parent / "warehouse")
for _p in [_backend_dir, _warehouse_dir]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

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
