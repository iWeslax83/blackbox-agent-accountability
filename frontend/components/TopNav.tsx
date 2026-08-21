"use client";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function TopNav() {
  const router = useRouter();
  async function logout() {
    await getSupabase().auth.signOut();
    router.push("/login");
  }
  return (
    <header className="topnav">
      <div className="inner">
        <a href="/app" className="brand"><span className="mark">T</span> TELUVANE</a>
        <nav className="navlinks">
          <a href="/app">Sessions</a>
          <a href="/app/team">Team</a>
          <a href="/app/keys">API keys</a>
          <a href="/app/billing">Billing</a>
          <a href="/app/settings">Settings</a>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
        </nav>
      </div>
    </header>
  );
}
