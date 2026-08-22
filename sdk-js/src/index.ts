/**
 * TELUVANE client SDK: records agent steps (llm_call, tool_call, tool_result) to a TELUVANE
 * API over HTTP, using an org API key. Mirrors teluvane.recorder.TeluvaneRecorder's HTTP mode.
 */

export type ApprovedBy = `human:${string}` | "auto" | null;

export interface RecordLlmCallOptions {
  intent: string;
  output?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface RecordToolCallOptions {
  tool: string;
  args?: Record<string, unknown>;
  intent?: string;
  approvedBy?: ApprovedBy;
}

export interface RecordToolResultOptions {
  tool: string;
  output: string;
}

export interface TeluvaneRecorderOptions {
  agentId: string;
  sessionId: string;
  baseUrl: string;
  apiKey: string;
  /** Override fetch, e.g. for tests. Defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

interface EventPayload {
  agent_id: string;
  session_id: string;
  kind: "llm_call" | "tool_call" | "tool_result";
  intent?: string;
  tool?: string | null;
  args?: Record<string, unknown>;
  output?: string;
  approved_by?: ApprovedBy;
  model?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
}

export class TeluvaneRecorder {
  private readonly agentId: string;
  private readonly sessionId: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: TeluvaneRecorderOptions) {
    this.agentId = options.agentId;
    this.sessionId = options.sessionId;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async emit(payload: Omit<EventPayload, "agent_id" | "session_id">): Promise<void> {
    const body: EventPayload = { agent_id: this.agentId, session_id: this.sessionId, ...payload };
    const res = await this.fetchImpl(`${this.baseUrl}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`TELUVANE /events failed: ${res.status} ${await res.text()}`);
    }
  }

  /** `intent` should say why the call was made in one sentence: that's what the tribunal
   * audits against, not the raw prompt/completion. Pass model + token counts when known,
   * so they show up in /stats/usage cost tracking. */
  recordLlmCall(options: RecordLlmCallOptions): Promise<void> {
    return this.emit({
      kind: "llm_call",
      intent: options.intent,
      output: options.output ?? "",
      model: options.model,
      input_tokens: options.inputTokens,
      output_tokens: options.outputTokens,
    });
  }

  /** Set approvedBy (a user id, or "auto" for an allowlisted action) when a human or policy
   * explicitly authorized this call. */
  recordToolCall(options: RecordToolCallOptions): Promise<void> {
    return this.emit({
      kind: "tool_call",
      tool: options.tool,
      args: options.args ?? {},
      intent: options.intent ?? "",
      approved_by: options.approvedBy ?? null,
    });
  }

  recordToolResult(options: RecordToolResultOptions): Promise<void> {
    return this.emit({ kind: "tool_result", tool: options.tool, output: options.output });
  }
}
