# blackbox/tests/test_tribunal.py
from blackbox.tribunal import consolidate
from blackbox.schema import Verdict

def v(rule, viol, conf, sev="high"):
    return Verdict(session_id="s1", rule_id=rule, severity=sev, violation=viol,
                   confidence=conf, evidence_seqs=[2], framework_ref="x")

def test_consolidate_requires_consensus_and_confidence():
    out = consolidate([v("data_exfiltration", True, 0.9), v("data_exfiltration", True, 0.8)])
    assert any(x.rule_id == "data_exfiltration" and x.violation for x in out)

def test_consolidate_drops_low_confidence_singletons():
    out = consolidate([v("pii_mishandling", True, 0.4)])
    assert all(not x.violation for x in out)
