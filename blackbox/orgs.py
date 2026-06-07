# blackbox/blackbox/orgs.py
import uuid
from typing import Optional
from .db import get_pool

def create_org(name: str, owner_user_id: str) -> str:
    org_id = "org_" + uuid.uuid4().hex[:12]
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO orgs(id,name,owner_user_id) VALUES(%s,%s,%s)",
                    (org_id, name, owner_user_id))
        cur.execute("INSERT INTO org_members(org_id,user_id,role) VALUES(%s,%s,'owner')",
                    (org_id, owner_user_id))
        conn.commit()
    return org_id

def org_for_user(user_id: str) -> Optional[str]:
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT org_id FROM org_members WHERE user_id=%s ORDER BY role DESC LIMIT 1",
                    (user_id,))
        row = cur.fetchone()
    return row[0] if row else None
