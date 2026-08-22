"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";
import { useConfirm } from "@/lib/useConfirm";
import TopNav from "@/components/TopNav";

type PolicyRule = { id: string; description: string; severity: string; keywords: string[]; custom: boolean };
type FrameworkInfo = { framework: string; available: string[] };
const FRAMEWORK_LABELS: Record<string, string> = {
  eu_ai_act: "EU AI Act", soc2: "SOC 2", nist_ai_rmf: "NIST AI RMF", iso42001: "ISO/IEC 42001",
};
type Schedule = { enabled: boolean; interval_minutes: number; last_run_at: string | null };
type Webhook = { url: string | null; secret: string | null };

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

  const [frameworkInfo, setFrameworkInfo] = useState<FrameworkInfo | null>(null);
  const [frameworkBusy, setFrameworkBusy] = useState(false);
  const [frameworkErr, setFrameworkErr] = useState<string | null>(null);

  const refreshFramework = useCallback(async () => {
    if (!token) return;
    try { setFrameworkInfo(await apiFetch("/orgs/framework", { token }) as FrameworkInfo); }
    catch (e) { setFrameworkErr(String(e)); }
  }, [token]);
  useEffect(() => { refreshFramework(); }, [refreshFramework]);

  async function changeFramework(framework: string) {
    if (!token) return;
    setFrameworkErr(null); setFrameworkBusy(true);
    try {
      await apiFetch("/orgs/framework", { token, method: "PUT", body: { framework } });
      await Promise.all([refreshFramework(), refreshRules()]);
      confirm.show("Framework updated");
    } catch (e) { setFrameworkErr(String(e)); } finally { setFrameworkBusy(false); }
  }

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

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [scheduleInterval, setScheduleInterval] = useState(60);
  const [scheduleErr, setScheduleErr] = useState<string | null>(null);
  const [scheduleBusy, setScheduleBusy] = useState(false);

  const refreshSchedule = useCallback(async () => {
    if (!token) return;
    try {
      const s = await apiFetch("/schedule", { token }) as Schedule;
      setSchedule(s); setScheduleInterval(s.interval_minutes);
    } catch (e) { setScheduleErr(String(e)); }
  }, [token]);
  useEffect(() => { refreshSchedule(); }, [refreshSchedule]);

  async function saveSchedule(enabled: boolean) {
    if (!token) return;
    setScheduleErr(null); setScheduleBusy(true);
    try {
      await apiFetch("/schedule", { token, method: "PUT",
        body: { enabled, interval_minutes: scheduleInterval } });
      await refreshSchedule();
    } catch (e) {
      const msg = String(e);
      setScheduleErr(msg.includes("402") ? "Automated tribunal runs are a Pro plan feature." : msg);
    } finally { setScheduleBusy(false); }
  }

  const [webhook, setWebhook] = useState<Webhook | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookErr, setWebhookErr] = useState<string | null>(null);
  const [webhookBusy, setWebhookBusy] = useState(false);

  const refreshWebhook = useCallback(async () => {
    if (!token) return;
    try {
      const w = await apiFetch("/webhooks", { token }) as Webhook;
      setWebhook(w); setWebhookUrl(w.url ?? "");
    } catch (e) { setWebhookErr(String(e)); }
  }, [token]);
  useEffect(() => { refreshWebhook(); }, [refreshWebhook]);

  async function saveWebhook() {
    if (!token || !webhookUrl) return;
    setWebhookErr(null); setWebhookBusy(true);
    try { await apiFetch("/webhooks", { token, method: "PUT", body: { url: webhookUrl } }); await refreshWebhook(); confirm.show("Webhook saved"); }
    catch (e) { setWebhookErr(String(e)); } finally { setWebhookBusy(false); }
  }
  async function clearWebhook() {
    if (!token) return;
    try { await apiFetch("/webhooks", { token, method: "DELETE" }); setWebhookUrl(""); await refreshWebhook(); }
    catch (e) { setWebhookErr(String(e)); }
  }

  return (
    <>
      <TopNav />
      <main id="main-content" tabIndex={-1} className="page">
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

        <div className="section-title"><h2>Compliance framework</h2></div>
        <p className="muted small">Which built-in policy pack the tribunal audits against.</p>
        <div className="card" style={{ padding: 24, marginBottom: 18 }}>
          <div className="field">
            <label className="label">Framework</label>
            <select className="input" value={frameworkInfo?.framework ?? "eu_ai_act"}
                    onChange={e => changeFramework(e.target.value)} disabled={frameworkBusy}>
              {(frameworkInfo?.available ?? ["eu_ai_act"]).map(f => (
                <option key={f} value={f}>{FRAMEWORK_LABELS[f] ?? f}</option>
              ))}
            </select>
          </div>
          {frameworkErr && <p className="error">{frameworkErr}</p>}
        </div>

        <div className="section-title"><h2>Custom policy rules</h2></div>
        <p className="muted small">
          Add rules on top of the {FRAMEWORK_LABELS[frameworkInfo?.framework ?? "eu_ai_act"]} pack.
          Each rule flags a session when any of its keywords appear in the action log, and feeds both the offline detector and the
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

        <div className="section-title"><h2>Automated tribunal runs</h2></div>
        <p className="muted small">
          Re-audit every session on a timer instead of clicking &ldquo;Run tribunal audit&rdquo;
          by hand. Runs while the API is warm, on the interval below. Pro plan only.
        </p>

        <div className="card" style={{ padding: 24 }}>
          <div className="row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span className="label" style={{ margin: 0 }}>Status</span>
            <span className={`badge ${schedule?.enabled ? "ok" : ""}`}>
              {schedule === null ? "checking…" : schedule.enabled ? "enabled" : "disabled"}
            </span>
            {schedule?.last_run_at && (
              <span className="meta">last ran {new Date(schedule.last_run_at).toLocaleString()}</span>
            )}
          </div>
          <div className="field">
            <label className="label">Interval (minutes, minimum 15)</label>
            <input className="input" type="number" min={15} value={scheduleInterval}
                   onChange={e => setScheduleInterval(Math.max(15, Number(e.target.value) || 15))} />
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" style={{ width: "auto" }}
                    onClick={() => saveSchedule(true)} disabled={scheduleBusy}>
              {scheduleBusy ? "Saving…" : schedule?.enabled ? "Update interval" : "Enable"}
            </button>
            {schedule?.enabled && (
              <button className="btn btn-ghost" onClick={() => saveSchedule(false)} disabled={scheduleBusy}>
                Disable
              </button>
            )}
          </div>
          {scheduleErr && <p className="error">{scheduleErr}</p>}
        </div>

        <div className="section-title"><h2>Alerts</h2></div>
        <p className="muted small">
          Get notified when the tribunal confirms a violation. Paste a Slack incoming-webhook
          URL for a formatted Slack message, or any other URL for a signed JSON POST
          (verify it with the <code className="code">X-Teluvane-Signature</code> header, HMAC-SHA256
          of the body using the secret below).
        </p>

        <div className="card" style={{ padding: 24 }}>
          <div className="field">
            <label className="label">Webhook URL</label>
            <input className="input" placeholder="https://hooks.slack.com/services/... or your own endpoint"
                   value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
          </div>
          {webhook?.secret && (
            <div className="field">
              <label className="label">Signing secret</label>
              <span className="code">{webhook.secret}</span>
            </div>
          )}
          <div className="btn-row">
            <button className="btn btn-primary" style={{ width: "auto" }} onClick={saveWebhook} disabled={!webhookUrl || webhookBusy}>
              {webhookBusy ? "Saving…" : "Save"}
            </button>
            {webhook?.url && (
              <button className="btn btn-ghost" onClick={clearWebhook}>Remove</button>
            )}
          </div>
          {webhookErr && <p className="error">{webhookErr}</p>}
        </div>
      </main>
    </>
  );
}
