import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PricingZigzag from "./PricingZigzag";

describe("PricingZigzag", () => {
  it("renders all three tiers with their CTAs", () => {
    render(<PricingZigzag />);
    expect(screen.getByText("$0")).toBeTruthy();
    expect(screen.getByText("$19.99")).toBeTruthy();
    expect(screen.getByText("Custom")).toBeTruthy();
    expect(screen.getByRole("link", { name: /view on github/i }).getAttribute("href")).toBe("https://github.com/iWeslax83/teluvane");
    expect(screen.getAllByRole("link", { name: /get started free/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /contact us/i }).getAttribute("href")).toBe("/login");
  });
});
