import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EvidenceLogCard from "./EvidenceLogCard";

describe("EvidenceLogCard", () => {
  it("renders the hash-chained event log with an intact chain", () => {
    render(<EvidenceLogCard />);
    expect(screen.getByText(/agent_log\.chain/i)).toBeTruthy();
    expect(screen.getByText("INTACT")).toBeTruthy();
    expect(screen.getByText("send_email")).toBeTruthy();
  });
});
