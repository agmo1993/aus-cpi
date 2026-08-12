"use client";

import { useEffect, useState } from "react";

/**
 * Which color scheme the page is currently rendering in.
 *
 * Components styled with Tailwind never need this: their colors come from the
 * CSS custom properties in globals.css, which swap on their own. It exists for
 * the chart libraries that serialise colors into their own options object or
 * into SVG attributes, where a `var(--chart-1)` reference cannot resolve.
 *
 * Starts as "light" so server and first client render agree, then corrects
 * after mount.
 */
export function useColorScheme(): "light" | "dark" {
  const [scheme, setScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");

    const sync = () => {
      // An explicit .dark class on <html> wins over the OS preference,
      // matching the cascade in globals.css.
      const forcedDark = document.documentElement.classList.contains("dark");
      setScheme(forcedDark || query.matches ? "dark" : "light");
    };

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return scheme;
}
