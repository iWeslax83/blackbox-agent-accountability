"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";

type Event = { seq: number; session_id: string; kind: string; tool?: string; intent: string };

export default function AppPage() {
  const { token, loading } = useSession();
  const router = useRouter();
  const [sessionId, setSessionId] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [verdicts, setVerdicts] = useState<any[]>([]);
  const [chain, setChain] = useState<boolean | null>(null);

  useEffect(() => { if (!loading && !token) router.push("/login"); }, [loading, token]);

  async function load() {
    if (!token || !sessionId) return;
    setEvents(await apiFetch(`/events?session_id=${sessionId}`, { token }));
    const v = await apiFetch(`/verify?session_id=${sessionId}`, { token }) as { chain_intact: boolean };
    setChain(v.chain_intact);
  }
  async function audit() {
    if (!token || !sessionId) return;
    setVerdicts(await apiFetch(`/audit/${sessionId}`, { token, method: "POST" }));
  }

  if (loading) return <p>…</p>;
  return (
    <main style={{ maxWidth: 880, margin: "4vh auto", fontFamily: "ui-serif, Georgia" }}>
      <nav><a href="/app/keys">API keys</a> · <a href="/app/settings">Settings</a></nav>
      <h1>Sessions</h1>
      <input placeholder="session id" value={sessionId} onChange={e => setSessionId(e.target.value)} />
      <button onClick={load}>Load</button>
      <button onClick={audit}>Run tribunal audit</button>
      {chain !== null && <p>Chain integrity: {chain ? "✓ intact" : "✗ TAMPERED"}</p>}
      <h2>Events ({events.length})</h2>
      <ul>{events.map(e => <li key={e.seq}>#{e.seq} [{e.kind}] {e.tool} — {e.intent}</li>)}</ul>
      <h2>Verdicts ({verdicts.length})</h2>
      <ul>{verdicts.map((v, i) => <li key={i}>{v.rule_id} — {v.severity} — {v.rationale}</li>)}</ul>
      {sessionId && token &&
        <a href={`${process.env.NEXT_PUBLIC_API_URL}/evidence/${sessionId}`} target="_blank">
          Open evidence pack</a>}
      {/* Plan 5 TODO: replace the evidence link above with a JWT-fetch-to-Blob button that calls
          apiFetch('/evidence/'+sessionId, {token}) and opens the HTML as a Blob URL, so the JWT
          is sent in the Authorization header rather than exposed in an anchor href. */}
    </main>
  );
}
