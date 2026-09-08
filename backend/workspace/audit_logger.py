import datetime
import uuid
import sys
from pathlib import Path
from typing import List, Dict, Any

_workspace_dir = str(Path(__file__).resolve().parent)
if _workspace_dir not in sys.path:
    sys.path.insert(0, _workspace_dir)

try:
    from workspace_db import get_db
except ImportError:
    from .workspace_db import get_db

def log_audit_event(user_name: str, action: str, target_entity: str, details: str, status: str = "Success") -> Dict[str, Any]:
    """
    Appends an immutable audit event to the activity log.
    """
    event_id = f"evt_{uuid.uuid4().hex[:8]}"
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO audit_events (event_id, timestamp, user_name, action, target_entity, details, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (event_id, now, user_name, action, target_entity, details, status))
    conn.commit()
    conn.close()

    return {
        "event_id": event_id,
        "timestamp": now,
        "user_name": user_name,
        "action": action,
        "target_entity": target_entity,
        "details": details,
        "status": status
    }

def get_audit_log(limit: int = 50) -> List[Dict[str, Any]]:
    """
    Retrieves the most recent audit activity events in descending order.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT event_id, timestamp, user_name, action, target_entity, details, status
        FROM audit_events
        ORDER BY timestamp DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]
