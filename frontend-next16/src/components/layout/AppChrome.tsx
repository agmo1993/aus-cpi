"use client";

/**
 * Client shell around TopNav, main, and footer so chrome can animate away
 * when the basket questionnaire is immersive. Root layout stays a server
 * component and passes the footer (with release month) as children.
 */

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import TopNav from "./TopNav";
import { ChromeProvider, useChrome } from "./chrome-context";

interface AppChromeProps {
  children: React.ReactNode;
  footer: React.ReactNode;
}

function AppChromeInner({ children, footer }: AppChromeProps) {
  const { immersive } = useChrome();

  useEffect(() => {
    if (!immersive) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [immersive]);

  return (
    <>
      <TopNav />

      {/* Subtract the sticky 72px header so the page does not grow an extra scroll.
          Immersive drops the offset and container padding for a full-bleed form. */}
      <main
        id="main-content"
        className={cn(
          "transition-[min-height] duration-500 ease-in-out motion-reduce:transition-none",
          immersive ? "min-h-dvh" : "min-h-[calc(100dvh-72px)]"
        )}
      >
        <div
          className={cn(
            "mx-auto max-w-7xl transition-[padding] duration-500 ease-in-out motion-reduce:transition-none",
            immersive ? "p-0" : "container mx-auto p-6"
          )}
        >
          {children}
        </div>
      </main>

      <div
        className={cn(
          "transition-all duration-500 ease-in-out motion-reduce:transition-none",
          immersive
            ? "pointer-events-none translate-y-full opacity-0 motion-reduce:translate-y-0"
            : "translate-y-0 opacity-100"
        )}
        aria-hidden={immersive || undefined}
      >
        {footer}
      </div>
    </>
  );
}

export default function AppChrome({ children, footer }: AppChromeProps) {
  return (
    <ChromeProvider>
      <AppChromeInner footer={footer}>{children}</AppChromeInner>
    </ChromeProvider>
  );
}
