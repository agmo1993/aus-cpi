/**
 * Site footer with ABS attribution and the latest release month from data.
 */

import Link from "next/link";
import { formatMonth } from "@/lib/format";

interface SiteFooterProps {
  latestMonthKey: string | null;
}

export default function SiteFooter({ latestMonthKey }: SiteFooterProps) {
  const latestMonth = formatMonth(latestMonthKey ?? undefined);

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:px-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[65ch]">
          CPI figures are from the Australian Bureau of Statistics
          {latestMonth ? `, latest release ${latestMonth}` : ""}. AusCPI is an
          independent visualisation and is not affiliated with the ABS.
        </p>
        <nav className="flex flex-wrap gap-4 shrink-0" aria-label="Footer">
          <Link href="/about" className="hover:text-foreground underline-offset-4 hover:underline">
            About
          </Link>
          <a
            href="https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia"
            className="hover:text-foreground underline-offset-4 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            ABS CPI release
          </a>
        </nav>
      </div>
    </footer>
  );
}
