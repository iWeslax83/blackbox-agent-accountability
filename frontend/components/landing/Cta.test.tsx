import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Cta from "./Cta";

describe("Cta", () => {
  it("links the primary action to signup", () => {
    render(<Cta />);
    expect(screen.getByRole("link", { name: /get started free/i }).getAttribute("href")).toBe("/login");
  });

  it("says no credit card is required", () => {
    render(<Cta />);
    expect(screen.getByText(/no credit card required/i)).toBeTruthy();
  });
});
