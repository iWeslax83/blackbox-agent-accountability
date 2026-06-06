# blackbox/tests/test_policy.py
from blackbox.policy import load_policy_pack

def test_load_policy_pack():
    pack = load_policy_pack("policies/eu_ai_act.yaml")
    assert pack.framework == "EU AI Act"
    ids = {r.id for r in pack.rules}
    assert {"data_exfiltration", "instruction_override"} <= ids
    r = next(r for r in pack.rules if r.id == "data_exfiltration")
    assert r.severity == "critical" and r.framework_ref
