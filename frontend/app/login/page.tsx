"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const sb = getSupabase();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    // Call directly on sb.auth — destructuring/aliasing the method drops its `this`, which makes
    // the supabase client read `this.fetch` off undefined ("can't access property fetch").
    const { error } = mode === "login"
      ? await sb.auth.signInWithPassword({ email, password })
      : await sb.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setErr(error.message);
    router.push("/app");
  }

  return (
    <main className="center-screen">
      <div className="card auth-card">
        <div className="brand" style={{ marginBottom: 16 }}>
          <span className="mark">🛡</span> BLACKBOX
        </div>
        <p className="eyebrow" style={{ marginBottom: 18 }}>AI agent accountability</p>
        <h1 style={{ marginBottom: 4 }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="muted small" style={{ marginBottom: 24 }}>
          {mode === "login"
            ? "Log in to your workspace."
            : "Start auditing your AI agents in minutes."}
        </p>

        <form onSubmit={submit}>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" autoComplete="email" placeholder="you@company.com"
                   value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" autoComplete="current-password" placeholder="••••••••"
                   value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        {err && <p className="error">{err}</p>}

        <p className="muted small" style={{ marginTop: 20 }}>
          {mode === "login" ? "Need an account? " : "Have an account? "}
          <button className="btn-link" type="button"
                  onClick={() => { setErr(null); setMode(mode === "login" ? "signup" : "login"); }}>
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </main>
  );
}
