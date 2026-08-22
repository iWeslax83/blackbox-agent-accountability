# @teluvane/sdk

Node/browser client for recording agent events to [TELUVANE](https://github.com/iWeslax83/teluvane)
without hand-rolling HTTP calls to `/events`.

```bash
npm install @teluvane/sdk
```

```ts
import { TeluvaneRecorder } from "@teluvane/sdk";

const recorder = new TeluvaneRecorder({
  agentId: "checkout-agent",
  sessionId: "session-123",
  baseUrl: "https://your-api.onrender.com",
  apiKey: process.env.TELUVANE_API_KEY!,
});

await recorder.recordLlmCall({
  intent: "summarize the cart before checkout",
  model: "claude-sonnet-5",
  inputTokens: 512,
  outputTokens: 128,
});

await recorder.recordToolCall({
  tool: "charge_card",
  args: { amount_cents: 4999 },
  intent: "charge the customer for their cart total",
  approvedBy: "auto",
});

await recorder.recordToolResult({ tool: "charge_card", output: "charge_id=ch_123" });
```

`model` + `inputTokens`/`outputTokens` are optional but drive TELUVANE's `/stats/usage`
cost tracking for any model in its pricing table (see `teluvane/cost.py`); unknown models
are recorded without a computed cost.

For MCP-based agents (Claude Desktop, Claude Code, etc.), use the `teluvane-mcp` server
instead, it auto-logs without any SDK calls, see the main repo README.
