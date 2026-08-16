import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard: BLACKBOX",
  description: "Manage sessions, API keys, billing, and settings for your BLACKBOX workspace.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
