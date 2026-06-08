"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const [msg, setMsg] = useState("Confirming your account…");

  useEffect(() => {
    const sb = getSupabase();
    let unsub: (() => void) | undefined;

    async function run() {
      const url = window.location.href;
      // PKCE flow: exchange the ?code= for a session. (Implicit flow with a #access_token is
      // parsed automatically by supabase-js on init via detectSessionInUrl.)
      if (url.includes("code=")) {
        try { await sb.auth.exchangeCodeForSession(url); } catch { /* fall through to getSession */ }
      }
      const { data } = await sb.auth.getSession();
      if (data.session) { router.replace("/app"); return; }
      const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
        if (session) router.replace("/app");
      });
      unsub = () => sub.subscription.unsubscribe();
      setTimeout(() => setMsg("Couldn’t confirm automatically. Please try logging in."), 5000);
    }
    run();
    return () => { if (unsub) unsub(); };
  }, [router]);

  return (
    <main className="center-screen">
      <div className="card auth-card" style={{ textAlign: "center" }}>
        <div className="brand" style={{ justifyContent: "center", marginBottom: 14 }}>
          <span className="mark">🛡</span> BLACKBOX
        </div>
        <p className="muted">{msg}</p>
        <p className="muted small" style={{ marginTop: 14 }}><a href="/login">Go to log in</a></p>
      </div>
    </main>
  );
}
