import type { Metadata } from "next";

/**
 * Chat route layout. The page itself uses a fixed full-height shell under the
 * 72px TopNav (`fixed inset-x-0 bottom-0 top-[72px]`) so it escapes the root
 * container padding and covers the site footer while chatting.
 */

export const metadata: Metadata = {
  title: "Chat · Aus-CPI",
  description:
    "Ask about Australian CPI figures. Numbers come from the AusCPI database; AI selects tools and writes short prose.",
};

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
