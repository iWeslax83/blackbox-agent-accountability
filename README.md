## BLACKBOX — AI Agent Accountability & Compliance Tool

BLACKBOX records every step an AI agent takes, chains them into a tamper-evident audit log, evaluates each session against configurable compliance policies, and surfaces violations in a real-time dashboard. To run the full stack: start the ingest API with `uvicorn blackbox.ingest:app`, then run a demo agent with `python demo/agent.py`, and finally open `ui/dashboard.html` in a browser to inspect events, hashes, and verdicts.
