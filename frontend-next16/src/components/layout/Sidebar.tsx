"use client";

/**
 * Sidebar Component
 * Desktop navigation sidebar
 */

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  version?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ version = "0.1.0" }) => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", id: "home" },
    { href: "/city", label: "City", id: "city" },
    { href: "/category", label: "Category", id: "category" },
    { href: "/about", label: "About", id: "about" },
  ];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r">
      {/* Logo */}
      <div className="flex items-center justify-center p-6 border-b">
        <Image
          src="/images/logo.png"
          alt="AusCPI"
          width={170}
          height={170}
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Version */}
      <div className="p-4 border-t">
        <Link
          href="/about"
          className="block text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          v{version}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
