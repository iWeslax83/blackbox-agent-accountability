import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StickyMobileCta from "./StickyMobileCta";

describe("StickyMobileCta", () => {
  it("links to signup", () => {
    render(<StickyMobileCta />);
    expect(screen.getByRole("link", { name: /get started free/i, hidden: true }).getAttribute("href")).toBe("/login");
  });
});
