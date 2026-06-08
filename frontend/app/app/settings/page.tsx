"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";
import TopNav from "@/components/TopNav";

export default function SettingsPage() {
  const { token } = useSession();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    try { setConfigured((await apiFetch("/byok", { token }) as { configured: boolean }).configured); }
    catch (e) { setErr(String(e)); }
  }, [token]);
  useEffect(() => { refresh(); }, [refresh]);

  async function save() {
    if (!token || !key) return;
    setErr(null);
    try { await apiFetch("/byok", { token, method: "PUT", body: { key } }); setKey(""); refresh(); }
    catch (e) { setErr(String(e)); }
  }
  async function clear() {
    if (!token) return;
    try { await apiFetch("/byok", { token, method: "DELETE" }); refresh(); }
    catch (e) { setErr(String(e)); }
  }

  return (
    <>
      <TopNav />
      <main className="page">
        <p className="eyebrow">Workspace</p>
        <h1 style={{ marginBottom: 6 }}>Anthropic key (BYOK)</h1>
        <p className="muted small">
          Add your own Anthropic key to run the live Claude tribunal. Without one, audits use the
          deterministic offline detector.
        </p>

        <div className="card" style={{ marginTop: 18, padding: 24 }}>
          <div className="row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span className="label" style={{ margin: 0 }}>Status</span>
            <span className={`badge ${configured ? "ok" : ""}`}>
              {configured === null ? "checking…" : configured ? "configured" : "not set"}
            </span>
          </div>
          <div className="field">
            <label className="label">Anthropic API key</label>
            <input className="input" type="password" placeholder="sk-ant-…"
                   value={key} onChange={e => setKey(e.target.value)} />
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" style={{ width: "auto" }} onClick={save} disabled={!key}>Save</button>
            <button className="btn btn-ghost" onClick={clear} disabled={!configured}>Clear</button>
          </div>
          {err && <p className="error">{err}</p>}
        </div>

        <p className="notice">🔒 Your key is encrypted at rest and decrypted only in-memory while running your audits. It is never logged.</p>
      </main>
    </>
  );
}
