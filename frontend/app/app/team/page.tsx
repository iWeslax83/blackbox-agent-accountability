"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { useConfirm } from "@/lib/useConfirm";
import TopNav from "@/components/TopNav";

type Member = { user_id: string; role: string; email: string | null };
type Invite = { id: number; email: string; role: string; created_at: string };

export default function TeamPage() {
  const { token, loading } = useSession();
  const router = useRouter();
  const [selfId, setSelfId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();

  useEffect(() => { if (!loading && !token) router.push("/login"); }, [loading, token, router]);
  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => setSelfId(data.user?.id ?? null));
  }, []);

  const isOwner = members.find(m => m.user_id === selfId)?.role === "owner";

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [m, i] = await Promise.all([
        apiFetch("/orgs/members", { token }) as Promise<Member[]>,
        apiFetch("/orgs/invites", { token }) as Promise<Invite[]>,
      ]);
      setMembers(m); setInvites(i);
    } catch (e) { setErr(String(e)); }
  }, [token]);
  useEffect(() => { refresh(); }, [refresh]);

  async function invite() {
    if (!token || !email) return;
    setErr(null); setBusy(true);
    try {
      await apiFetch("/orgs/invites", { token, method: "POST", body: { email, role } });
      setEmail(""); setRole("member");
      await refresh();
      confirm.show("Invite created");
    } catch (e) { setErr(String(e)); } finally { setBusy(false); }
  }
  async function revokeInvite(id: number) {
    if (!token) return;
    try { await apiFetch(`/orgs/invites/${id}`, { token, method: "DELETE" }); await refresh(); }
    catch (e) { setErr(String(e)); }
  }
  async function changeRole(userId: string, newRole: string) {
    if (!token) return;
    try { await apiFetch(`/orgs/members/${userId}`, { token, method: "PUT", body: { role: newRole } }); await refresh(); }
    catch (e) { setErr(String(e)); }
  }
  async function removeMember(userId: string) {
    if (!token) return;
    try { await apiFetch(`/orgs/members/${userId}`, { token, method: "DELETE" }); await refresh(); }
    catch (e) { setErr(String(e)); }
  }

  if (loading) return <main className="page"><p className="muted">Loading…</p></main>;
  return (
    <>
      <TopNav />
      <main className="page">
        <p className="eyebrow">Workspace</p>
        <h1 style={{ marginBottom: 6 }}>Team</h1>
        <p className="muted small">
          Invite people to your org. A new invite matches by email: whoever signs up with that
          address joins your team automatically, no email delivery needed on our end.
        </p>

        <div className="section-title"><h2>Members</h2></div>
        <ul className="list" style={{ marginBottom: 18 }}>
          {members.map(m => (
            <li key={m.user_id}>
              <span>
                <strong>{m.email ?? m.user_id}</strong>{m.user_id === selfId ? " (you)" : ""}
                <span className="meta"> · {m.role}</span>
              </span>
              {isOwner && m.user_id !== selfId && (
                <span className="btn-row">
                  <button className="btn btn-ghost btn-sm"
                          onClick={() => changeRole(m.user_id, m.role === "owner" ? "member" : "owner")}>
                    Make {m.role === "owner" ? "member" : "owner"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeMember(m.user_id)}>Remove</button>
                </span>
              )}
            </li>
          ))}
        </ul>

        {isOwner && (
          <>
            <div className="section-title"><h2>Pending invites</h2></div>
            {invites.length === 0 ? <p className="empty">None.</p> : (
              <ul className="list" style={{ marginBottom: 18 }}>
                {invites.map(i => (
                  <li key={i.id}>
                    <span><strong>{i.email}</strong><span className="meta"> · {i.role}</span></span>
                    <button className="btn btn-ghost btn-sm" onClick={() => revokeInvite(i.id)}>Revoke</button>
                  </li>
                ))}
              </ul>
            )}

            <div className="card" style={{ padding: 24 }}>
              <div className="field">
                <label className="label">Email</label>
                <input className="input" placeholder="teammate@company.com"
                       value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Role</label>
                <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="member">member</option>
                  <option value="owner">owner</option>
                </select>
              </div>
              <div className="btn-row">
                <button className="btn btn-primary" style={{ width: "auto" }} onClick={invite} disabled={!email || busy}>
                  {busy ? "Inviting…" : "Send invite"}
                </button>
                {confirm.message && <span className="confirm" aria-live="polite">{confirm.message}</span>}
              </div>
              {err && <p className="error">{err}</p>}
            </div>
          </>
        )}
      </main>
    </>
  );
}
