"use client";

import { brandConfig } from "@nexora/config";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { TitleScreen } from "./title-screen";

export function AuthForm({
  title,
  subtitle,
  submitLabel,
  error,
  pending,
  children,
  onSubmit,
}: {
  title: string;
  subtitle: string;
  submitLabel: string;
  error: string | null;
  pending: boolean;
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <TitleScreen>
      <Link href="/" className="title-glyph" aria-label={brandConfig.name} />
      <p className="title-kicker">{brandConfig.name}</p>
      <div className="title-panel mt-6">
        <h1 className="font-display text-3xl text-gold">{title}</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {children}
          {error ? <p className="text-sm text-ember">{error}</p> : null}
          <button type="submit" disabled={pending} className="title-cta w-full disabled:opacity-50">
            {pending ? "Aguarde..." : submitLabel}
          </button>
        </form>
      </div>
    </TitleScreen>
  );
}

export function Field({
  label,
  name,
  type,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm text-muted">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        suppressHydrationWarning
        className="mt-1 w-full rounded-xl border border-[#2a2438] bg-panel px-3 py-2 text-[#f4efe4] outline-none focus:border-crystal"
      />
    </label>
  );
}
