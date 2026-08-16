import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in: BLACKBOX",
  description: "Log in to your BLACKBOX workspace to audit your AI agents.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
