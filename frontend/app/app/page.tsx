"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";
import TopNav from "@/components/TopNav";

type Event = { seq: number; session_id: string; kind: string; tool?: string; intent: string };
type Verdict = { rule_id: string; severity: string; rationale: string };

export default function AppPage() {
  const { token, loading } = useSession();
  const router = useRouter();
  const [sessionId, setSessionId] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [chain, setChain] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<"" | "load" | "audit">("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (!loading && !token) router.push("/login"); }, [loading, token, router]);

  async function load() {
    if (!token || !sessionId) return;
    setErr(null); setBusy("load");
    try {
      setEvents(await apiFetch(`/events?session_id=${encodeURIComponent(sessionId)}`, { token }));
      const v = await apiFetch(`/verify?session_id=${encodeURIComponent(sessionId)}`, { token }) as { chain_intact: boolean };
      setChain(v.chain_intact);
    } catch (e) { setErr(String(e)); } finally { setBusy(""); }
  }
  async function audit() {
    if (!token || !sessionId) return;
    setErr(null); setBusy("audit");
    try {
      setVerdicts(await apiFetch(`/audit/${encodeURIComponent(sessionId)}`, { token, method: "POST" }));
    } catch (e) { setErr(String(e)); } finally { setBusy(""); }
  }

  if (loading) return <main className="page"><p className="muted">Loading…</p></main>;
  return (
    <>
      <TopNav />
      <main className="page">
        <p className="eyebrow">Workspace</p>
        <h1 style={{ marginBottom: 6 }}>Sessions</h1>
        <p className="muted small">Inspect a recorded agent session, verify its hash chain, and run the compliance tribunal.</p>

        <div className="toolbar">
          <input className="input" placeholder="session id (e.g. demo-session)"
                 value={sessionId} onChange={e => setSessionId(e.target.value)} />
          <button className="btn btn-ghost" onClick={load} disabled={!sessionId || busy === "load"}>
            {busy === "load" ? "Loading…" : "Load"}
          </button>
          <button className="btn btn-primary" style={{ width: "auto" }} onClick={audit} disabled={!sessionId || busy === "audit"}>
            {busy === "audit" ? "Auditing…" : "Run tribunal audit"}
          </button>
          {chain !== null && (
            <span className={`badge ${chain ? "ok" : "bad"}`}>
              {chain ? "chain intact" : "chain TAMPERED"}
            </span>
          )}
        </div>

        {err && <p className="error">{err}</p>}

        <div className="section-title"><h2>Events</h2><span className="muted small">{events.length}</span></div>
        {events.length === 0 ? <p className="empty">No events loaded yet.</p> : (
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

        {sessionId && token && (
          <p style={{ marginTop: 22 }}>
            <a href={`${process.env.NEXT_PUBLIC_API_URL}/evidence/${encodeURIComponent(sessionId)}`} target="_blank" rel="noreferrer">
              Open evidence pack ↗
            </a>
          </p>
        )}
      </main>
    </>
  );
}
