"use client";
import { useRouter, usePathname } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

const LINKS = [
  { href: "/app", label: "Sessions" },
  { href: "/app/insights", label: "Insights" },
  { href: "/app/team", label: "Team" },
  { href: "/app/keys", label: "API keys" },
  { href: "/app/billing", label: "Billing" },
  { href: "/app/settings", label: "Settings" },
  { href: "/accessibility", label: "Accessibility" },
];

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  async function logout() {
    await getSupabase().auth.signOut();
    router.push("/login");
  }
  return (
    <header className="topnav">
      <div className="inner">
        <a href="/app" className="brand"><span className="mark">T</span> TELUVANE</a>
        <nav className="navlinks">
          {LINKS.map(({ href, label }) => {
            // /app itself must match exactly, or every page (which also starts with /app) would light up.
            const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
            return (
              <a key={href} href={href} aria-current={active ? "page" : undefined}>
                {label}
              </a>
            );
          })}
          <button className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
        </nav>
      </div>
    </header>
  );
}
