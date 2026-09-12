"use client";

import type { ReactNode } from "react";

export function Tip({
  help,
  children,
  className = "",
}: {
  help: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`gx-tip ${className}`.trim()} tabIndex={0} data-help={help} title={help}>
      {children}
    </span>
  );
}
