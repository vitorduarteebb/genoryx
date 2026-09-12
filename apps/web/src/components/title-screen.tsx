"use client";

import { brandConfig } from "@nexora/config";
import Link from "next/link";
import type { ReactNode } from "react";
import { isAlpha } from "../lib/release";
import { useAuthStore } from "../lib/auth-store";
import "./title-screen.css";

export function TitleScreen({ children }: { children: ReactNode }) {
  return (
    <div className="title-screen">
      <span className="title-horizon" aria-hidden />
      <span className="title-silhouette" aria-hidden />
      <span className="title-mote" aria-hidden />
      <span className="title-mote" aria-hidden />
      <span className="title-mote" aria-hidden />
      <span className="title-mote" aria-hidden />
      <div className="title-frame">{children}</div>
    </div>
  );
}

export function TitleHome() {
  const ready = useAuthStore((state) => state.ready);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const signedIn = Boolean(ready && accessToken);
  const continueHref = user?.hasCharacter ? "/game/creatures" : "/create-character";

  return (
    <TitleScreen>
      <div className="title-seal" aria-hidden>
        <div className="title-glyph" />
      </div>
      <p className="title-kicker">{isAlpha ? "Alpha" : "Aethera"}</p>
      <h1 className="title-name">
        {brandConfig.name}
        <span className="title-chapter">Genesis</span>
      </h1>
      <span className="title-rule" aria-hidden />
      <p className="title-tagline">{brandConfig.tagline}</p>
      <p className="title-lead">
        Cada criatura nasce com um DNA próprio. A linhagem é sua. O mundo muda com ela.
      </p>

      <div className="title-actions">
        {signedIn ? (
          <Link href={continueHref} className="title-cta">
            Continuar
          </Link>
        ) : (
          <>
            <Link href="/login" className="title-cta">
              Entrar
            </Link>
            <Link href="/register" className="title-cta title-cta--ghost">
              Criar conta
            </Link>
          </>
        )}
      </div>
      <p className="title-foot">Aethera</p>
    </TitleScreen>
  );
}
