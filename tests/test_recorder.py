# blackbox/tests/test_recorder.py
from blackbox.recorder import BlackBoxRecorder
from blackbox.store import Store

def test_recorder_writes_tool_events():
    s = Store()
    rec = BlackBoxRecorder(agent_id="demo", session_id="s1", store=s, org_id="orgT")
    rec.record_tool_call(tool="send_email", args={"to": "a@b.com"}, intent="notify user")
    rec.record_tool_result(tool="send_email", output="sent")
    evs = s.events("orgT", "s1")
    assert [e.kind for e in evs] == ["tool_call", "tool_result"]
    assert evs[0].tool == "send_email" and evs[0].intent == "notify user"
