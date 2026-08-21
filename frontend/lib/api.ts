type Options = { token: string; method?: string; body?: unknown; timeoutMs?: number };

const DEFAULT_TIMEOUT_MS = 15000;

async function rawFetch(path: string, opts: Options): Promise<Response> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${opts.token}`,
    "Content-Type": "application/json",
  };
  // A hung backend (accepts the connection, never responds) would otherwise leave this fetch
  // pending forever, which stalls every caller that awaits it, e.g. useSession's loading state.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    return res;
  } catch (e) {
    if (controller.signal.aborted) throw new Error(`API request to ${path} timed out`);
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiFetch<T = unknown>(path: string, opts: Options): Promise<T> {
  const res = await rawFetch(path, opts);
  const ct = res.headers.get("content-type") ?? "";
  return (ct.includes("application/json") ? await res.json() : (await res.text())) as T;
}

/** For binary responses (e.g. PDF exports) that apiFetch's json/text coercion would corrupt. */
export async function apiFetchBlob(path: string, opts: Options): Promise<Blob> {
  const res = await rawFetch(path, opts);
  return res.blob();
}

export async function ensureOrg(token: string, name = "My workspace"): Promise<void> {
  // Idempotent: POST /orgs returns the caller's existing org or creates one. Bootstraps a
  // workspace for a freshly-signed-up user so later dashboard calls don't 403 "user has no org".
  try {
    await apiFetch("/orgs", { token, method: "POST", body: { name } });
  } catch {
    // Non-fatal: never block sign-in on bootstrap, pages surface their own errors.
  }
}
