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
