"use client";

/**
 * Top Navigation
 * Brand plus the primary sections.
 */

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TopNavProps {
  className?: string;
}

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/category", label: "Categories" },
  { href: "/basket", label: "Your basket" },
  { href: "/about", label: "About" },
];

const TopNav: React.FC<TopNavProps> = ({ className }) => {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      {/* Capped at 72px so the nav never eats the viewport, and one line at every width */}
      <div className="container mx-auto flex h-[72px] max-w-7xl items-center gap-8 px-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/images/logo.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-contain"
            priority
          />
          <span className="text-lg font-semibold leading-none tracking-tight">
            AusCPI
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default TopNav;
