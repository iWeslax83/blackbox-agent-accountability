"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";

export default function KeysPage() {
  const { token } = useSession();
  const [keys, setKeys] = useState<any[]>([]);
  const [created, setCreated] = useState<string | null>(null);
  const [name, setName] = useState("");

  async function refresh() { if (token) setKeys(await apiFetch("/keys", { token })); }
  useEffect(() => { refresh(); }, [token]);

  async function create() {
    if (!token) return;
    const r = await apiFetch("/keys", { token, method: "POST", body: { name } }) as { key: string };
    setCreated(r.key);   // shown once
    refresh();
  }
  async function revoke(id: number) {
    if (!token) return;
    await apiFetch(`/keys/${id}`, { token, method: "DELETE" });
    refresh();
  }

  return (
    <main style={{ maxWidth: 700, margin: "4vh auto", fontFamily: "ui-serif, Georgia" }}>
      <h1>API keys</h1>
      <input placeholder="name" value={name} onChange={e => setName(e.target.value)} />
      <button onClick={create}>Create key</button>
      {created && <p>Copy now — shown once: <code>{created}</code></p>}
      <ul>{keys.map(k =>
        <li key={k.id}>{k.prefix}… {k.name} {k.revoked_at ? "(revoked)" :
          <button onClick={() => revoke(k.id)}>revoke</button>}</li>)}</ul>
    </main>
  );
}
