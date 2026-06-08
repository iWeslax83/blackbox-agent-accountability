import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BLACKBOX — AI Agent Accountability",
  description: "Tamper-evident flight recorder + autonomous compliance tribunal for AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
