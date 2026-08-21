"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";
import { useConfirm } from "@/lib/useConfirm";
import TopNav from "@/components/TopNav";

type PolicyRule = { id: string; description: string; severity: string; keywords: string[]; custom: boolean };

export default function SettingsPage() {
  const { token } = useSession();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const confirm = useConfirm();

  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [ruleId, setRuleId] = useState("");
  const [ruleDesc, setRuleDesc] = useState("");
  const [ruleSeverity, setRuleSeverity] = useState("medium");
  const [ruleKeywords, setRuleKeywords] = useState("");
  const [ruleErr, setRuleErr] = useState<string | null>(null);
  const [ruleBusy, setRuleBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    try { setConfigured((await apiFetch("/byok", { token }) as { configured: boolean }).configured); }
    catch (e) { setErr(String(e)); }
  }, [token]);
  useEffect(() => { refresh(); }, [refresh]);

  const refreshRules = useCallback(async () => {
    if (!token) return;
    try { setRules(await apiFetch("/policy/rules", { token }) as PolicyRule[]); }
    catch (e) { setRuleErr(String(e)); }
  }, [token]);
  useEffect(() => { refreshRules(); }, [refreshRules]);

  async function save() {
    if (!token || !key) return;
    setErr(null);
    try { await apiFetch("/byok", { token, method: "PUT", body: { key } }); setKey(""); refresh(); confirm.show("Key saved"); }
    catch (e) { setErr(String(e)); }
  }
  async function clear() {
    if (!token) return;
    try { await apiFetch("/byok", { token, method: "DELETE" }); refresh(); confirm.show("Key cleared"); }
    catch (e) { setErr(String(e)); }
  }

  async function addRule() {
    if (!token || !ruleId || !ruleDesc) return;
    setRuleErr(null); setRuleBusy(true);
    try {
      const keywords = ruleKeywords.split(",").map(k => k.trim()).filter(Boolean);
      await apiFetch(`/policy/rules/${encodeURIComponent(ruleId)}`, {
        token, method: "PUT", body: { description: ruleDesc, severity: ruleSeverity, keywords },
      });
      setRuleId(""); setRuleDesc(""); setRuleKeywords(""); setRuleSeverity("medium");
      await refreshRules();
      confirm.show("Rule saved");
    } catch (e) {
      const msg = String(e);
      setRuleErr(msg.includes("402") ? "Custom policy rules are a Pro plan feature." : msg);
    } finally { setRuleBusy(false); }
  }
  async function removeRule(id: string) {
    if (!token) return;
    try { await apiFetch(`/policy/rules/${encodeURIComponent(id)}`, { token, method: "DELETE" }); await refreshRules(); }
    catch (e) { setRuleErr(String(e)); }
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
            {confirm.message && <span className="confirm" aria-live="polite">{confirm.message}</span>}
          </div>
          {err && <p className="error">{err}</p>}
        </div>

        <p className="notice">Your key is encrypted at rest and decrypted only in-memory while running your audits. It is never logged.</p>

        <div className="section-title"><h2>Custom policy rules</h2></div>
        <p className="muted small">
          Add rules on top of the built-in EU AI Act pack. Each rule flags a session when any
          of its keywords appear in the action log, and feeds both the offline detector and the
          live tribunal. Pro plan only.
        </p>

        {rules.length === 0 ? <p className="empty">No rules yet.</p> : (
          <ul className="list" style={{ marginBottom: 18 }}>
            {rules.map(r => (
              <li key={r.id}>
                <span>
                  <strong>{r.id}</strong> <span className={`sev ${r.severity}`}>{r.severity}</span>
                  <span className="meta"> · {r.description}</span>
                </span>
                {r.custom
                  ? <button className="btn btn-ghost btn-sm" onClick={() => removeRule(r.id)}>Remove</button>
                  : <span className="badge">built-in</span>}
              </li>
            ))}
          </ul>
        )}

        <div className="card" style={{ padding: 24 }}>
          <div className="field">
            <label className="label">Rule id</label>
            <input className="input" placeholder="e.g. no_offshore_pii"
                   value={ruleId} onChange={e => setRuleId(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Description</label>
            <input className="input" placeholder="What does this rule catch?"
                   value={ruleDesc} onChange={e => setRuleDesc(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Severity</label>
            <select className="input" value={ruleSeverity} onChange={e => setRuleSeverity(e.target.value)}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Keywords (comma-separated)</label>
            <input className="input" placeholder="offshore, non-eu, unencrypted"
                   value={ruleKeywords} onChange={e => setRuleKeywords(e.target.value)} />
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" style={{ width: "auto" }} onClick={addRule}
                    disabled={!ruleId || !ruleDesc || ruleBusy}>
              {ruleBusy ? "Saving…" : "Add rule"}
            </button>
          </div>
          {ruleErr && <p className="error">{ruleErr}</p>}
        </div>
      </main>
    </>
  );
}
