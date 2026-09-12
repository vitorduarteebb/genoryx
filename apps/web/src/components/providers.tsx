"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../lib/auth-store";

export function AuthHydrator({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return children;
}
