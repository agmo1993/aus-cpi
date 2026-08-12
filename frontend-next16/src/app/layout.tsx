import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/layout";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const description =
  "Track Australian consumer price index data from the Australian Bureau of Statistics: headline inflation, movements by category, and comparisons between the eight capital cities.";

export const metadata: Metadata = {
  title: "Aus-CPI",
  description,
  openGraph: {
    title: "Aus-CPI",
    images: [
      "https://aus-cpi.vercel.app/_next/image?url=%2Fimages%2Flogo.png&w=384&q=75",
    ],
    description,
  },
  icons: {
    icon: {
      url: "/favicon.png",
      type: "image/png",
    },
    shortcut: { url: "/favicon.png", type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <TopNav />

        {/* 100dvh rather than 100vh, which jumps as the mobile address bar hides */}
        <main className="min-h-[100dvh]">
          <div className="container mx-auto p-6 max-w-7xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
