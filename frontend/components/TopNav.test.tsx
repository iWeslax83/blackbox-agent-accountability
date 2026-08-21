import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TopNav from "./TopNav";

const push = vi.fn();
const signOut = vi.fn().mockResolvedValue({});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ auth: { signOut } }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("TopNav", () => {
  it("renders links to every app section", () => {
    render(<TopNav />);
    expect(screen.getByRole("link", { name: /sessions/i }).getAttribute("href")).toBe("/app");
    expect(screen.getByRole("link", { name: /insights/i }).getAttribute("href")).toBe("/app/insights");
    expect(screen.getByRole("link", { name: /team/i }).getAttribute("href")).toBe("/app/team");
    expect(screen.getByRole("link", { name: /api keys/i }).getAttribute("href")).toBe("/app/keys");
    expect(screen.getByRole("link", { name: /billing/i }).getAttribute("href")).toBe("/app/billing");
    expect(screen.getByRole("link", { name: /^settings$/i }).getAttribute("href")).toBe("/app/settings");
    expect(screen.getByRole("link", { name: /accessibility/i }).getAttribute("href")).toBe("/accessibility");
  });

  it("signs out and redirects to /login on logout", async () => {
    render(<TopNav />);
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    await vi.waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(push).toHaveBeenCalledWith("/login");
  });
});
