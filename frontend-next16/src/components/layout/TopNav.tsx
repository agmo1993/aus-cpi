"use client";

/**
 * Top Navigation
 * Brand plus the primary sections. Sticky header; mobile menu is a dialog
 * drawer with Escape and focus trap (Radix Dialog).
 */

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChrome } from "./chrome-context";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const { immersive } = useChrome();

  const linkClass = (href: string, mobile = false) => {
    const isActive =
      href === "/" ? pathname === "/" : pathname.startsWith(href);
    return cn(
      mobile
        ? "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
        : "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
    );
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-transform duration-500 ease-in-out motion-reduce:transition-none",
        immersive && "-translate-y-full pointer-events-none",
        className
      )}
      aria-hidden={immersive || undefined}
    >
      <div className="container mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
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

        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={linkClass(item.href)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          id="mobile-nav"
          showCloseButton={false}
          className="fixed inset-y-0 left-0 top-0 z-50 flex h-dvh w-[min(100%,20rem)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-y-0 border-l-0 border-r p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-none sm:rounded-none"
        >
          <div className="flex h-[72px] items-center justify-between border-b px-4">
            <DialogTitle className="text-base font-semibold">Menu</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
          <nav className="flex flex-col gap-1 p-4" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={linkClass(item.href, true)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default TopNav;
