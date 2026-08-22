import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TeamPage from "./page";

const push = vi.fn();
const apiFetch = vi.fn();
const getUser = vi.fn().mockResolvedValue({ data: { user: { id: "user-owner" } } });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/app/team",
}));

vi.mock("@/lib/useSession", () => ({
  useSession: () => ({ token: "test-token", loading: false }),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ auth: { getUser } }),
}));

beforeEach(() => {
  apiFetch.mockReset();
  push.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

function mockMembers() {
  apiFetch.mockImplementation((path: string) => {
    if (path === "/orgs/members") return Promise.resolve([
      { user_id: "user-owner", role: "owner", email: "owner@example.com" },
      { user_id: "user-2", role: "member", email: "member@example.com" },
    ]);
    if (path === "/orgs/invites") return Promise.resolve([{ id: 1, email: "invitee@example.com", role: "member", created_at: "2026-01-01" }]);
    return Promise.resolve({});
  });
}

describe("TeamPage", () => {
  it("lists members and pending invites for the owner", async () => {
    mockMembers();
    render(<TeamPage />);
    await waitFor(() => expect(screen.getByText("owner@example.com")).toBeTruthy());
    expect(screen.getByText("member@example.com")).toBeTruthy();
    expect(screen.getByText("invitee@example.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: /remove/i })).toBeTruthy();
  });

  it("sends an invite when the owner submits the form", async () => {
    mockMembers();
    render(<TeamPage />);
    await waitFor(() => expect(screen.getByText("owner@example.com")).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText(/teammate@company.com/i), { target: { value: "new@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send invite/i }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/orgs/invites", {
      token: "test-token", method: "POST", body: { email: "new@example.com", role: "member" },
    }));
  });
});
