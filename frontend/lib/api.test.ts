import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "./api";

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://api.test";
  vi.stubGlobal("fetch", vi.fn(async () =>
    new Response(JSON.stringify({ ok: true }), { status: 200,
      headers: { "content-type": "application/json" } })));
});

describe("apiFetch", () => {
  it("attaches the bearer token", async () => {
    await apiFetch("/keys", { token: "jwt-123" });
    const [, init] = (fetch as any).mock.calls[0];
    expect(init.headers["Authorization"]).toBe("Bearer jwt-123");
  });
  it("prefixes the API base url", async () => {
    await apiFetch("/verify", { token: "t" });
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toBe("http://api.test/verify");
  });
  it("throws on non-2xx", async () => {
    (fetch as any).mockResolvedValueOnce(new Response("nope", { status: 401 }));
    await expect(apiFetch("/keys", { token: "t" })).rejects.toThrow();
  });
});
