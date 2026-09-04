import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppChrome, SiteFooter } from "@/components/layout";
import { getLatestReleaseMonth } from "@/lib/queries";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let latestMonthKey: string | null = null;
  try {
    latestMonthKey = await getLatestReleaseMonth();
  } catch {
    latestMonthKey = null;
  }

  return (
    <html lang="en-AU" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="absolute left-4 top-4 z-[100] -translate-y-[200%] rounded-md bg-background px-4 py-2 shadow ring-2 ring-ring transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <AppChrome footer={<SiteFooter latestMonthKey={latestMonthKey} />}>
          {children}
        </AppChrome>
      </body>
    </html>
  );
}
