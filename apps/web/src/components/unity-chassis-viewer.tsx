"use client";

import type { ChassisView } from "@nexora/config";
import { useEffect, useRef, useState } from "react";
import { CHASSIS_FRAME_SRC, CHASSIS_MESSAGE, postChassisDna } from "../lib/unity-chassis-bridge";

/**
 * O Unity sobe no boot oficial (`/unity-game/index.html`), isolado do ciclo do React.
 * createUnityInstance no canvas do Next quebrava: o player abortava e a coleção
 * caía em "WebGL indisponível" com o bundle inteiro já no ar.
 */
export function UnityChassisViewer({
  dna,
  className = "",
}: {
  dna: ChassisView | null | undefined;
  className?: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data?.type !== CHASSIS_MESSAGE) {
        return;
      }
      if (event.data.action === "ready") {
        setStatus("ready");
        setDetail(null);
        postChassisDna(frame.current?.contentWindow, dna);
        return;
      }
      if (event.data.action === "error") {
        setStatus("missing");
        setDetail(typeof event.data.message === "string" ? event.data.message : "falha no WebGL");
      }
    }
    window.addEventListener("message", onMessage);
    const timeout = window.setTimeout(() => {
      setStatus((current) => {
        if (current !== "loading") {
          return current;
        }
        setDetail("o player não respondeu");
        return "missing";
      });
    }, 90000);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timeout);
    };
    // dna entra pelo efeito abaixo depois do ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }
    postChassisDna(frame.current?.contentWindow, dna);
  }, [dna, status]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gold/25 bg-black ${className}`}>
      <iframe
        ref={frame}
        title="Chassi 3D GENORYX"
        src={CHASSIS_FRAME_SRC}
        className="block h-full min-h-[420px] w-full border-0 bg-black"
        allow="fullscreen"
      />
      {status !== "ready" ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[10px] uppercase tracking-[0.18em] text-crystal">
          {status === "missing"
            ? `WebGL do chassi indisponível${detail ? ` · ${detail}` : ""}`
            : "Montando o chassi 3D…"}
        </p>
      ) : null}
    </div>
  );
}
