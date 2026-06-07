import { describe, it, expect } from "vitest";
import { getSupabase } from "./supabase";

describe("getSupabase", () => {
  it("returns a singleton client", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    expect(getSupabase()).toBe(getSupabase());
  });
});
