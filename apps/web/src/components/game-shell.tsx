"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { getRefreshToken, useAuthStore } from "../lib/auth-store";
import { api } from "../lib/api";
import { useEvolutionQueue } from "../lib/use-evolution-queue";
import { useGameSession } from "../lib/use-game-session";
import { useGenesisQueue } from "../lib/use-genesis-queue";
import "./game-shell.css";

const links = [
  { href: "/game/creatures", label: "Coleção", hint: "suas criaturas" },
  { href: "/game/party", label: "Time", hint: "formação de batalha" },
  { href: "/game/deck", label: "Cartas", hint: "grimório" },
  { href: "/game/breeding", label: "Gênese", hint: "cruzar criaturas" },
  { href: "/game/chamber", label: "Despertar", hint: "evolução" },
  { href: "/game/arena", label: "Arena", hint: "combate" },
  { href: "/game/market", label: "Mercado", hint: "negociar" },
  { href: "/game/inventory", label: "Inventário", hint: "itens" },
  { href: "/game/shop", label: "Loja", hint: "Theo" },
] as const;

function toneFor(path: string) {
  if (path.startsWith("/game/breeding") || path.startsWith("/game/genesis")) return "arcane";
  if (
    path.startsWith("/game/arena") ||
    path.startsWith("/game/lab") ||
    path.startsWith("/game/battle") ||
    path.startsWith("/game/party")
  ) {
    return "ember";
  }
  if (path.startsWith("/game/chamber") || path.startsWith("/game/evolution")) return "gold";
  return "crystal";
}

function formatGold(value: string | undefined) {
  if (!value) return "0";
  try {
    return BigInt(value).toLocaleString("pt-BR");
  } catch {
    return value;
  }
}

export function GameShell({
  title,
  subtitle,
  kicker,
  children,
  header,
  wide,
  stage,
}: {
  title?: string;
  subtitle?: string;
  kicker?: string;
  children: ReactNode;
  header?: ReactNode;
  wide?: boolean;
  stage?: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const { character } = useGameSession();
  const { clearSession } = useAuthStore();
  const gold = character?.wallets.find((wallet) => wallet.currency === "GOLD")?.balance;
  const nex = character?.wallets.find((wallet) => wallet.currency === "NEX")?.balance;

  async function logout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await api("/auth/logout", { method: "POST", body: { refreshToken } }).catch(() => undefined);
    }
    clearSession();
    router.replace("/");
  }

  return (
    <div className="gx-realm" data-tone={toneFor(path)} data-wide={wide || stage ? "true" : "false"} data-stage={stage ? "true" : "false"}>
      <div className="gx-realm__veil" aria-hidden />
      <div className="gx-realm__aurora" aria-hidden />
      <div className="gx-realm__motes" aria-hidden>
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="gx-realm__frame" aria-hidden />

      <div className="gx-realm__inner">
        <header className="gx-hud">
          <div className="gx-hud__brand">
            <span className="gx-hud__seal" aria-hidden>
              <span className="gx-hud__glyph" />
            </span>
            <div>
              <p className="gx-hud__kicker">Genesis</p>
              <p className="gx-hud__name">GENORYX</p>
            </div>
          </div>
          <div className="gx-hud__vitals">
            <div className="gx-hud__chip">
              <span>Treinador</span>
              <strong>{character ? `${character.name} · ${character.level}` : "…"}</strong>
            </div>
            <div className="gx-hud__chip gx-hud__chip--crystal">
              <span>Gold</span>
              <strong>{formatGold(gold)}</strong>
            </div>
            <div className="gx-hud__chip">
              <span>NEX</span>
              <strong>{formatGold(nex)}</strong>
            </div>
            <button type="button" className="gx-hud__leave" onClick={() => void logout()}>
              Sair
            </button>
          </div>
        </header>

        {stage ? null : (
          <nav className="gx-nav">
            {links.map((link) => {
              const active = path === link.href || path.startsWith(`${link.href}/`);
              return (
                <Link key={link.href} href={link.href} className="gx-nav__link" data-active={active}>
                  {link.label}
                  <small>{link.hint}</small>
                </Link>
              );
            })}
          </nav>
        )}

        {stage ? null : <GenesisBanner />}
        {stage ? null : <EvolutionBanner />}

        {stage ? null : header ?? (
          <header>
            {kicker ? <p className="gx-page__kicker">{kicker}</p> : null}
            <h1 className="gx-page__title">{title}</h1>
            <div className="gx-page__rule" aria-hidden />
            {subtitle ? <p className="gx-page__lead">{subtitle}</p> : null}
          </header>
        )}
        {children}
      </div>
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`gx-panel ${className}`.trim()}>{children}</section>;
}

function GenesisBanner() {
  const path = usePathname();
  const queue = useGenesisQueue();
  if (!queue || queue.count === 0 || path.startsWith("/game/genesis")) {
    return null;
  }
  const first = queue.items[0];
  return (
    <Link href={first ? `/game/genesis/${first.creatureId}` : "/game/genesis"} className="gx-omen">
      Uma linhagem espera ser revelada · {queue.count} criatura{queue.count === 1 ? "" : "s"} no círculo.
    </Link>
  );
}

function EvolutionBanner() {
  const path = usePathname();
  const queue = useEvolutionQueue();
  if (!queue || queue.count === 0 || path.startsWith("/game/evolution")) {
    return null;
  }
  const first = queue.items[0];
  return (
    <Link href={first ? "/game/chamber" : "/game/creatures"} className="gx-omen gx-omen--crystal">
      {first ? `${first.name} está pronta para despertar.` : `${queue.count} criaturas prontas para despertar.`}
    </Link>
  );
}
