import { describe, it, expect, vi } from "vitest";
import { TeluvaneRecorder } from "../src/index";

function fakeFetch(status = 200) {
  return vi.fn(async (_url: string, init: RequestInit) => {
    return new Response(JSON.stringify({}), { status });
  });
}

describe("TeluvaneRecorder", () => {
  it("sends the API key as a bearer token", async () => {
    const fetchImpl = fakeFetch();
    const rec = new TeluvaneRecorder({
      agentId: "a", sessionId: "s", baseUrl: "http://api.test", apiKey: "tv_live_xyz", fetchImpl,
    });
    await rec.recordLlmCall({ intent: "hi" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("http://api.test/events");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tv_live_xyz");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ agent_id: "a", session_id: "s", kind: "llm_call", intent: "hi" });
  });

  it("includes model and token counts on llm_call when given", async () => {
    const fetchImpl = fakeFetch();
    const rec = new TeluvaneRecorder({
      agentId: "a", sessionId: "s", baseUrl: "http://api.test", apiKey: "k", fetchImpl,
    });
    await rec.recordLlmCall({ intent: "hi", model: "claude-sonnet-5", inputTokens: 10, outputTokens: 20 });
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body as string);
    expect(body.model).toBe("claude-sonnet-5");
    expect(body.input_tokens).toBe(10);
    expect(body.output_tokens).toBe(20);
  });

  it("records tool calls with approvedBy", async () => {
    const fetchImpl = fakeFetch();
    const rec = new TeluvaneRecorder({
      agentId: "a", sessionId: "s", baseUrl: "http://api.test", apiKey: "k", fetchImpl,
    });
    await rec.recordToolCall({ tool: "send_email", args: { to: "a@b.com" }, intent: "notify", approvedBy: "auto" });
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body as string);
    expect(body).toMatchObject({ kind: "tool_call", tool: "send_email", approved_by: "auto" });
  });

  it("throws on a non-2xx response", async () => {
    const fetchImpl = fakeFetch(401);
    const rec = new TeluvaneRecorder({
      agentId: "a", sessionId: "s", baseUrl: "http://api.test", apiKey: "bad", fetchImpl,
    });
    await expect(rec.recordLlmCall({ intent: "hi" })).rejects.toThrow(/401/);
  });
});
