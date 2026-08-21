# teluvane/teluvane/webhooks.py
import hashlib, hmac, json, logging, secrets
from typing import Optional
import httpx
from .db import get_pool
from .schema import Verdict

TIMEOUT_SECONDS = 5

def set_webhook(org_id: str, url: str) -> str:
    """Create or replace the org's webhook, returning its signing secret."""
    secret = secrets.token_hex(24)
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO org_webhooks(org_id,url,secret) VALUES(%s,%s,%s) "
            "ON CONFLICT (org_id) DO UPDATE SET url=EXCLUDED.url, secret=EXCLUDED.secret, "
            "created_at=now()", (org_id, url, secret))
        conn.commit()
    return secret

def get_webhook(org_id: str) -> Optional[dict]:
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT url, secret FROM org_webhooks WHERE org_id=%s", (org_id,))
        row = cur.fetchone()
    return {"url": row[0], "secret": row[1]} if row else None

def delete_webhook(org_id: str) -> None:
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM org_webhooks WHERE org_id=%s", (org_id,))
        conn.commit()

def _sign(secret: str, body: bytes) -> str:
    return "sha256=" + hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()

def _slack_payload(org_id: str, session_id: str, verdicts: list[Verdict]) -> dict:
    lines = [f"*{v.rule_id}* ({v.severity}) — {v.rationale}" for v in verdicts]
    return {"text": f"TELUVANE: {len(verdicts)} violation(s) in session `{session_id}`\n" + "\n".join(lines)}

def send_webhook(org_id: str, session_id: str, verdicts: list[Verdict]) -> None:
    """Fire-and-forget: a broken or slow receiving endpoint must never fail the audit that
    triggered it, so every failure mode here is caught and only logged."""
    if not verdicts:
        return
    hook = get_webhook(org_id)
    if not hook:
        return
    is_slack = "hooks.slack.com" in hook["url"]
    payload = _slack_payload(org_id, session_id, verdicts) if is_slack else {
        "org_id": org_id, "session_id": session_id,
        "verdicts": [v.model_dump() for v in verdicts],
    }
    body = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if not is_slack:
        headers["X-Teluvane-Signature"] = _sign(hook["secret"], body)
    try:
        httpx.post(hook["url"], content=body, headers=headers, timeout=TIMEOUT_SECONDS)
    except Exception:
        logging.exception("webhook delivery failed for org %s", org_id)
