"use client";

/**
 * BottomBar Component
 * Mobile navigation bottom bar
 */

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, MapPin, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomBar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/category", label: "Category", icon: TrendingUp },
    { href: "/city", label: "City", icon: MapPin },
    { href: "/about", label: "About", icon: Info },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Logo on mobile */}
        <Link href="/" className="flex flex-col items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="AusCPI"
            width={40}
            height={40}
            priority
          />
        </Link>

        {/* Nav items */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-lg transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomBar;
