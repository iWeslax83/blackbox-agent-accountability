"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function ResetPassword() {
  const sb = getSupabase();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const url = window.location.href;
    async function run() {
      if (url.includes("code=")) {
        try { await sb.auth.exchangeCodeForSession(url); } catch { /* fall through */ }
      }
      const { data } = await sb.auth.getSession();
      setReady(!!data.session);
    }
    run();
  }, [sb]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const { error } = await sb.auth.updateUser({ password });
      if (error) return setErr(error.message);
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main id="main-content" tabIndex={-1} className="center-screen">
        <div className="card auth-card">
          <div className="brand" style={{ marginBottom: 16 }}><span className="mark">T</span> TELUVANE</div>
          <h1 style={{ marginBottom: 8 }}>Password updated</h1>
          <p className="muted small" style={{ marginBottom: 20 }}>You can log in with your new password now.</p>
          <button className="btn btn-primary" onClick={() => router.push("/app")}>Go to workspace</button>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="center-screen">
      <div className="card auth-card">
        <div className="brand" style={{ marginBottom: 16 }}><span className="mark">T</span> TELUVANE</div>
        <h1 style={{ marginBottom: 4 }}>Choose a new password</h1>
        <p className="muted small" style={{ marginBottom: 24 }}>
          {ready ? "Set a new password for your account." : "Confirming your reset link…"}
        </p>

        <form onSubmit={submit}>
          <div className="field">
            <label className="label">New password</label>
            <input className="input" type="password" autoComplete="new-password" placeholder="••••••••"
                   value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                   disabled={!ready} autoFocus />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy || !ready}>
            {busy ? "…" : "Update password"}
          </button>
        </form>

        {err && <p className="error" role="alert" aria-live="polite">{err}</p>}

        <p className="muted small" style={{ marginTop: 20 }}>
          <a href="/login">Back to log in</a>
        </p>
      </div>
    </main>
  );
}
