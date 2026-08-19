import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard: TELUVANE",
  description: "Manage sessions, API keys, billing, and settings for your TELUVANE workspace.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
