"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";
import TopNav from "@/components/TopNav";

type ApiKey = { id: number; name: string; prefix: string; revoked_at: string | null };

export default function KeysPage() {
  const { token } = useSession();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [created, setCreated] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    try { setKeys(await apiFetch("/keys", { token })); } catch (e) { setErr(String(e)); }
  }, [token]);
  useEffect(() => { refresh(); }, [refresh]);

  async function create() {
    if (!token || !name) return;
    setErr(null);
    try {
      const r = await apiFetch("/keys", { token, method: "POST", body: { name } }) as { key: string };
      setCreated(r.key);
      setName("");
      refresh();
    } catch (e) { setErr(String(e)); }
  }
  async function revoke(id: number) {
    if (!token) return;
    try { await apiFetch(`/keys/${id}`, { token, method: "DELETE" }); refresh(); }
    catch (e) { setErr(String(e)); }
  }

  return (
    <>
      <TopNav />
      <main className="page">
        <p className="eyebrow">Workspace</p>
        <h1 style={{ marginBottom: 6 }}>API keys</h1>
        <p className="muted small">Use a key as a bearer token so your agents can record events to BLACKBOX.</p>

        <div className="toolbar">
          <input className="input" placeholder="key name (e.g. production)"
                 value={name} onChange={e => setName(e.target.value)} />
          <button className="btn btn-primary" style={{ width: "auto" }} onClick={create} disabled={!name}>
            Create key
          </button>
        </div>

        {created && (
          <div className="notice">
            Copy this now — it’s shown only once:&nbsp;<span className="code">{created}</span>
          </div>
        )}
        {err && <p className="error">{err}</p>}

        {keys.length === 0 ? <p className="empty">No keys yet.</p> : (
          <ul className="list">
            {keys.map(k => (
              <li key={k.id}>
                <span><span className="code">{k.prefix}…</span> &nbsp;{k.name}</span>
                {k.revoked_at
                  ? <span className="badge bad">revoked</span>
                  : <button className="btn btn-ghost btn-sm" onClick={() => revoke(k.id)}>Revoke</button>}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
