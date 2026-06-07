"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const { token } = useSession();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [key, setKey] = useState("");

  async function refresh() {
    if (token) setConfigured((await apiFetch("/byok", { token }) as any).configured);
  }
  useEffect(() => { refresh(); }, [token]);

  async function save() {
    if (!token) return;
    await apiFetch("/byok", { token, method: "PUT", body: { key } });
    setKey(""); refresh();
  }
  async function clear() {
    if (!token) return;
    await apiFetch("/byok", { token, method: "DELETE" }); refresh();
  }

  return (
    <main style={{ maxWidth: 700, margin: "4vh auto", fontFamily: "ui-serif, Georgia" }}>
      <h1>Settings — Anthropic key (BYOK)</h1>
      <p>Status: {configured === null ? "…" : configured ? "✓ configured" : "not set"}</p>
      <input type="password" placeholder="sk-ant-…" value={key} onChange={e => setKey(e.target.value)} />
      <button onClick={save}>Save</button>
      <button onClick={clear}>Clear</button>
      <p style={{ color: "#8a8275" }}>Your key is encrypted at rest and used only to run your audits.</p>
    </main>
  );
}
