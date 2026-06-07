from blackbox.db import get_pool
from blackbox.migrate import apply_migrations

def test_apply_migrations_creates_tables_idempotently():
    apply_migrations()
    apply_migrations()  # second run must not error
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT to_regclass('public.events'), to_regclass('public.verdicts')")
        events_tbl, verdicts_tbl = cur.fetchone()
    assert events_tbl == "events"
    assert verdicts_tbl == "verdicts"
