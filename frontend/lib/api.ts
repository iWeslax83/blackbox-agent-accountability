type Options = { token: string; method?: string; body?: unknown };

export async function apiFetch<T = unknown>(path: string, opts: Options): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${opts.token}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(`${base}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const ct = res.headers.get("content-type") ?? "";
  return (ct.includes("application/json") ? await res.json() : (await res.text())) as T;
}

export async function ensureOrg(token: string, name = "My workspace"): Promise<void> {
  // Idempotent: POST /orgs returns the caller's existing org or creates one. Bootstraps a
  // workspace for a freshly-signed-up user so later dashboard calls don't 403 "user has no org".
  try {
    await apiFetch("/orgs", { token, method: "POST", body: { name } });
  } catch {
    // Non-fatal — never block sign-in on bootstrap; pages surface their own errors.
  }
}
