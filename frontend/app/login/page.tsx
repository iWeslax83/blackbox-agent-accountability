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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const fn = mode === "login" ? sb.auth.signInWithPassword : sb.auth.signUp;
    const { error } = await fn({ email, password });
    if (error) return setErr(error.message);
    router.push("/app");
  }

  return (
    <main style={{ maxWidth: 360, margin: "10vh auto", fontFamily: "ui-serif, Georgia" }}>
      <h1>BLACKBOX</h1>
      <form onSubmit={submit}>
        <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="password" value={password}
               onChange={e => setPassword(e.target.value)} />
        <button type="submit">{mode === "login" ? "Log in" : "Sign up"}</button>
      </form>
      {err && <p style={{ color: "#b4451f" }}>{err}</p>}
      <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>
        {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
      </button>
    </main>
  );
}
