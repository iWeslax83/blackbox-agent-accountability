# blackbox/tests/test_store.py
from blackbox.store import Store
from blackbox.schema import Event

def make_event(i):
    return Event(agent_id="a1", session_id="s1", kind="tool_call",
                 tool="send_email", args={"to": f"x{i}@y.com"}, intent="notify")

def test_append_assigns_seq_and_chains_hash(tmp_path):
    s = Store(str(tmp_path / "t.db"))
    e0 = s.append(make_event(0))
    e1 = s.append(make_event(1))
    assert e0.seq == 1 and e1.seq == 2
    assert e0.prev_hash == "GENESIS"
    assert e1.prev_hash == e0.hash
    assert e0.hash and e1.hash and e0.hash != e1.hash

def test_verify_chain_detects_tamper(tmp_path):
    dbp = str(tmp_path / "t.db")
    s = Store(dbp)
    for i in range(3):
        s.append(make_event(i))
    assert s.verify_chain() is True
    # tamper directly in sqlite
    import sqlite3
    con = sqlite3.connect(dbp)
    con.execute("UPDATE events SET output='HACKED' WHERE seq=2")
    con.commit(); con.close()
    assert s.verify_chain() is False
