import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar, BottomBar } from "@/components/layout";
import packageJson from "../../package.json";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aus-CPI",
  description: `AusCPI is a powerful dashboard that offers users a range of tools to
  analyze and visualize consumer price index (CPI) data from the
  Australian Bureau of Statistics.`,
  openGraph: {
    title: "Aus-CPI",
    images: [
      "https://aus-cpi.vercel.app/_next/image?url=%2Fimages%2Flogo.png&w=384&q=75",
    ],
    description: `AusCPI is a powerful dashboard that offers users a range of tools to
    analyze and visualize consumer price index (CPI) data from the
    Australian Bureau of Statistics.`,
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
    <html lang="en">
      <body className={inter.className}>
        {/* Desktop Sidebar */}
        <Sidebar version={packageJson.version} />

        {/* Main Content Area */}
        <main className="md:pl-64 pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>

        {/* Mobile Bottom Bar */}
        <BottomBar />
      </body>
    </html>
  );
}
