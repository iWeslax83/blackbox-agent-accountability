"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";
import TopNav from "@/components/TopNav";

type Event = { seq: number; session_id: string; kind: string; tool?: string; intent: string };
type Verdict = { rule_id: string; severity: string; rationale: string };
type SessionRow = { session_id: string; events: number; last_ts: string };

export default function AppPage() {
  const { token, loading } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [chain, setChain] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<"" | "load" | "audit" | "demo">("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (!loading && !token) router.push("/login"); }, [loading, token, router]);

  const loadSessions = useCallback(async () => {
    if (!token) return;
    try { setSessions(await apiFetch("/sessions", { token })); } catch (e) { setErr(String(e)); }
  }, [token]);
  useEffect(() => { loadSessions(); }, [loadSessions]);

  const load = useCallback(async (sid?: string) => {
    const id = sid ?? sessionId;
    if (!token || !id) return;
    setSessionId(id); setErr(null); setBusy("load"); setVerdicts([]);
    try {
      setEvents(await apiFetch(`/events?session_id=${encodeURIComponent(id)}`, { token }));
      const v = await apiFetch(`/verify?session_id=${encodeURIComponent(id)}`, { token }) as { chain_intact: boolean };
      setChain(v.chain_intact);
    } catch (e) { setErr(String(e)); } finally { setBusy(""); }
  }, [token, sessionId]);

  async function audit() {
    if (!token || !sessionId) return;
    setErr(null); setBusy("audit");
    try {
      setVerdicts(await apiFetch(`/audit/${encodeURIComponent(sessionId)}`, { token, method: "POST" }));
    } catch (e) { setErr(String(e)); } finally { setBusy(""); }
  }

  async function seedDemo() {
    if (!token) return;
    setErr(null); setBusy("demo");
    try {
      const r = await apiFetch("/demo/seed", { token, method: "POST" }) as { session_id: string };
      await loadSessions();
      await load(r.session_id);
    } catch (e) { setErr(String(e)); } finally { setBusy(""); }
  }

  async function openEvidence() {
    if (!token || !sessionId) return;
    try {
      const html = await apiFetch(`/evidence/${encodeURIComponent(sessionId)}`, { token }) as string;
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) { setErr(String(e)); }
  }

  if (loading) return <main className="page"><p className="muted">Loading…</p></main>;
  return (
    <>
      <TopNav />
      <main className="page">
        <p className="eyebrow">Workspace</p>
        <h1 style={{ marginBottom: 6 }}>Sessions</h1>
        <p className="muted small">Pick a recorded agent session, verify its hash chain, and run the compliance tribunal.</p>

        <div className="toolbar">
          <button className="btn btn-primary" style={{ width: "auto" }} onClick={seedDemo} disabled={busy === "demo"}>
            {busy === "demo" ? "Seeding…" : "✦ Load demo session"}
          </button>
          <input className="input" placeholder="…or type a session id"
                 value={sessionId} onChange={e => setSessionId(e.target.value)} />
          <button className="btn btn-ghost" onClick={() => load()} disabled={!sessionId || busy === "load"}>
            {busy === "load" ? "Loading…" : "Load"}
          </button>
        </div>

        {sessions.length > 0 && (
          <ul className="list">
            {sessions.map(s => (
              <li key={s.session_id} style={{ cursor: "pointer" }} onClick={() => load(s.session_id)}>
                <span><strong>{s.session_id}</strong> <span className="meta">{s.events} events</span></span>
                <span className="meta">{s.session_id === sessionId ? "▶ selected" : "open"}</span>
              </li>
            ))}
          </ul>
        )}
        {sessions.length === 0 && <p className="empty">No sessions yet — click “Load demo session” to see BLACKBOX in action, or point your agent at the API.</p>}

        {err && <p className="error">{err}</p>}

        {sessionId && (
          <>
            <div className="section-title">
              <h2>Session · {sessionId}</h2>
              <div className="btn-row">
                <button className="btn btn-primary btn-sm" style={{ width: "auto" }} onClick={audit} disabled={busy === "audit"}>
                  {busy === "audit" ? "Auditing…" : "Run tribunal audit"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={openEvidence}>Evidence pack ↗</button>
              </div>
            </div>
            {chain !== null && (
              <p><span className={`badge ${chain ? "ok" : "bad"}`}>{chain ? "chain intact" : "chain TAMPERED"}</span></p>
            )}

            <div className="section-title"><h2>Events</h2><span className="muted small">{events.length}</span></div>
            {events.length === 0 ? <p className="empty">No events.</p> : (
              <ul className="list">
                {events.map(e => (
                  <li key={e.seq}>
                    <span>#{e.seq} · <strong>{e.kind}</strong>{e.tool ? ` · ${e.tool}` : ""}</span>
                    <span className="meta">{e.intent}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="section-title"><h2>Verdicts</h2><span className="muted small">{verdicts.length}</span></div>
            {verdicts.length === 0 ? <p className="empty">Run an audit to see verdicts.</p> : (
              <ul className="list">
                {verdicts.map((v, i) => (
                  <li key={i}>
                    <span><strong>{v.rule_id}</strong> <span className={`sev ${v.severity}`}>{v.severity}</span></span>
                    <span className="meta">{v.rationale}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  );
}
