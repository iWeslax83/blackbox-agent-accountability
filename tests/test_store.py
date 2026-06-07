import pytest
from blackbox.schema import Event, Verdict

def _ev(session_id="s1", **kw):
    return Event(agent_id="a", session_id=session_id, kind="tool_call", **kw)

def _vd(session_id="s1"):
    return Verdict(session_id=session_id, rule_id="data_exfiltration", severity="critical",
                   violation=True, confidence=0.9, evidence_seqs=[1])

def test_append_assigns_seq_hash_and_org(store):
    e = store.append("orgA", _ev())
    assert e.seq is not None and e.hash and e.prev_hash == "GENESIS" and e.org_id == "orgA"

def test_chain_links_within_org_session(store):
    e1 = store.append("orgA", _ev())
    e2 = store.append("orgA", _ev())
    assert e2.prev_hash == e1.hash

def test_chain_is_independent_per_org(store):
    store.append("orgA", _ev(session_id="s1"))
    b1 = store.append("orgB", _ev(session_id="s1"))
    assert b1.prev_hash == "GENESIS"     # orgB starts its own genesis, not chained to orgA

def test_events_are_scoped_to_org(store):
    store.append("orgA", _ev())
    store.append("orgB", _ev())
    evs = store.events("orgA")
    assert len(evs) == 1 and all(e.org_id == "orgA" for e in evs)

def test_tenant_isolation_no_cross_read(store):   # <-- GATE TEST
    store.append("orgA", _ev(session_id="secret"))
    assert store.events("orgB", session_id="secret") == []

def test_verify_chain_true_for_intact_org_chain(store):
    store.append("orgA", _ev()); store.append("orgA", _ev())
    assert store.verify_chain("orgA") is True

def test_verdicts_scoped_to_org(store):
    store.append("orgA", _ev())
    store.add_verdict("orgA", _vd())
    assert len(store.verdicts("orgA")) == 1
    assert store.verdicts("orgB") == []

def test_assert_scoped_rejects_empty_org(store):
    with pytest.raises(ValueError):
        store._assert_scoped("", "SELECT 1 FROM events WHERE org_id=%s")

def test_assert_scoped_rejects_unscoped_sql(store):
    with pytest.raises(ValueError):
        store._assert_scoped("orgA", "SELECT 1 FROM events")

@pytest.mark.parametrize("call", [
    lambda s: s.events(""),
    lambda s: s.verdicts(""),
    lambda s: s.verify_chain(""),
    lambda s: s.append("", _ev()),
    lambda s: s.add_verdict("", _vd()),
])
def test_every_public_method_requires_org(store, call):
    with pytest.raises(ValueError):
        call(store)
