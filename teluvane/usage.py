# teluvane/teluvane/usage.py
import os
from datetime import datetime, timezone

from .db import get_pool

# How many hosted-key (non-BYOK) tribunal audits a pro org gets per calendar month before
# falling back to the offline detector. Keeps a runaway pro org from spending unbounded
# amounts of our Anthropic budget on a flat $19/mo plan.
HOSTED_AUDIT_MONTHLY_LIMIT = int(os.environ.get("HOSTED_AUDIT_MONTHLY_LIMIT", "50"))


def current_period() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def hosted_audit_count(org_id: str, period: str | None = None) -> int:
    period = period or current_period()
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT count FROM hosted_audit_usage WHERE org_id=%s AND period=%s",
                    (org_id, period))
        row = cur.fetchone()
    return row[0] if row else 0


def under_hosted_audit_limit(org_id: str) -> bool:
    return hosted_audit_count(org_id) < HOSTED_AUDIT_MONTHLY_LIMIT


def increment_hosted_audit_usage(org_id: str, period: str | None = None) -> int:
    period = period or current_period()
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO hosted_audit_usage(org_id,period,count) VALUES(%s,%s,1) "
            "ON CONFLICT (org_id,period) DO UPDATE SET count = hosted_audit_usage.count + 1 "
            "RETURNING count",
            (org_id, period))
        new_count = cur.fetchone()[0]
        conn.commit()
    return new_count
