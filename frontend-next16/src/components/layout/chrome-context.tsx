"use client";

/**
 * Site chrome immersion: when the basket questionnaire is active, the header
 * and footer animate away and the form takes the viewport.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ChromeContextValue {
  immersive: boolean;
  setImmersive: (value: boolean) => void;
}

const ChromeContext = createContext<ChromeContextValue | null>(null);

export function ChromeProvider({ children }: { children: React.ReactNode }) {
  const [immersive, setImmersiveState] = useState(false);
  const setImmersive = useCallback((value: boolean) => {
    setImmersiveState(value);
  }, []);

  const value = useMemo(
    () => ({ immersive, setImmersive }),
    [immersive, setImmersive]
  );

  return (
    <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>
  );
}

export function useChrome(): ChromeContextValue {
  const ctx = useContext(ChromeContext);
  if (!ctx) {
    throw new Error("useChrome must be used within a ChromeProvider");
  }
  return ctx;
}
