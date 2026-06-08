"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";
import { ensureOrg } from "./api";

export function useSession() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const sb = getSupabase();
    // Expose the token only AFTER the user's workspace is provisioned, so the protected pages
    // (which fetch as soon as `token` is set) never race ahead of org creation and 403.
    async function apply(t: string | null) {
      if (t) await ensureOrg(t);
      setToken(t);
      setLoading(false);
    }
    sb.auth.getSession().then(({ data }) => apply(data.session?.access_token ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) =>
      apply(session?.access_token ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { token, loading };
}
