import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPage from "./page";

const apiFetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ auth: { signOut: vi.fn() } }),
}));

vi.mock("@/lib/useSession", () => ({
  useSession: () => ({ token: "test-token", loading: false }),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const DEFAULTS: Record<string, unknown> = {
  "/byok": { configured: false },
  "/policy/rules": [],
  "/orgs/framework": { framework: "eu_ai_act", available: ["eu_ai_act", "soc2", "nist_ai_rmf", "iso42001"] },
  "/schedule": { enabled: false, interval_minutes: 60, last_run_at: null },
  "/webhooks": { url: null, secret: null },
};

function mockDefaults(overrides: Record<string, unknown> = {}) {
  const values = { ...DEFAULTS, ...overrides };
  apiFetch.mockImplementation((path: string) => {
    if (path in values) return Promise.resolve(values[path]);
    return Promise.resolve({});
  });
}

beforeEach(() => {
  apiFetch.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("SettingsPage", () => {
  it("shows BYOK status and the compliance framework options", async () => {
    mockDefaults();
    render(<SettingsPage />);
    await waitFor(() => expect(screen.getByText("not set")).toBeTruthy());
    expect(screen.getByRole("option", { name: "SOC 2" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "ISO/IEC 42001" })).toBeTruthy();
  });

  it("saves an Anthropic key", async () => {
    mockDefaults();
    render(<SettingsPage />);
    await waitFor(() => expect(screen.getByText("not set")).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText(/sk-ant/i), { target: { value: "sk-ant-abc123" } });
    mockDefaults({ "/byok": { configured: true } });
    fireEvent.click(screen.getAllByRole("button", { name: /^save$/i })[0]);

    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/byok", {
      token: "test-token", method: "PUT", body: { key: "sk-ant-abc123" },
    }));
  });

  it("adds a custom policy rule", async () => {
    mockDefaults();
    render(<SettingsPage />);
    await waitFor(() => expect(screen.getByText(/no rules yet/i)).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText(/no_offshore_pii/i), { target: { value: "no_offshore" } });
    fireEvent.change(screen.getByPlaceholderText(/what does this rule catch/i), { target: { value: "Blocks offshore transfers" } });
    fireEvent.change(screen.getByPlaceholderText(/offshore, non-eu/i), { target: { value: "offshore, non-eu" } });
    fireEvent.click(screen.getByRole("button", { name: /add rule/i }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/policy/rules/no_offshore", {
      token: "test-token", method: "PUT",
      body: { description: "Blocks offshore transfers", severity: "medium", keywords: ["offshore", "non-eu"] },
    }));
  });
});
