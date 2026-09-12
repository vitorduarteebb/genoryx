"use client";

import type { PersonalResourceDefinition, ResourceHelpView } from "@nexora/config";
import { explainPersonalResource } from "@nexora/config";
import { useEffect, useId, useRef, useState } from "react";
import "./personal-resource.css";

export type ResourceMeterView = {
  current?: number;
  definition?: PersonalResourceDefinition | null;
  help?: ResourceHelpView | null;
  compact?: boolean;
  debug?: boolean;
};

export function ResourcePips({ current, max }: { current: number; max: number }) {
  return (
    <span className="gx-res__pips" aria-hidden>
      {Array.from({ length: max }, (_, index) => (
        <i key={index} data-on={index < current ? "true" : undefined} />
      ))}
    </span>
  );
}

export function PersonalResourceHelp({ current = 0, definition, help, compact, debug }: ResourceMeterView) {
  const def = definition;
  if (!def) return null;
  const view = help ?? explainPersonalResource(def, "pt-BR");
  const maxed = current >= def.maxStacks && def.maxStacks > 0;
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const labelId = useId();

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="gx-res" data-max={maxed ? "true" : undefined} data-compact={compact ? "true" : undefined} ref={box}>
      <p className="gx-res__line">
        <span className="gx-res__icon" aria-hidden>
          {def.icon}
        </span>
        <strong>{view.title}</strong>
        <ResourcePips current={current} max={def.maxStacks} />
        <span className="gx-res__count">
          {current}/{def.maxStacks}
        </span>
        {maxed ? <em>máximo</em> : null}
        <button
          type="button"
          className="gx-res__ask"
          aria-expanded={open}
          aria-controls={labelId}
          title="Como funciona este recurso"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((value) => !value);
          }}
        >
          ?
        </button>
      </p>
      {compact ? null : <p className="gx-res__simple">{view.simple}</p>}
      {open ? (
        <div className="gx-res__pop" id={labelId} role="dialog" aria-label={view.title}>
          <p className="gx-res__pop-kicker">Recurso pessoal</p>
          <h3>
            {def.icon} {view.title}
          </h3>
          <blockquote>{view.blurb}</blockquote>
          <p>
            <b>Como gerar</b>
          </p>
          <ul>
            {view.generate.map((row) => (
              <li key={row.label}>
                {row.label} <span>{row.amount}</span>
              </li>
            ))}
          </ul>
          <p>
            <b>Limite</b> {current}/{def.maxStacks}
          </p>
          {view.effects.length > 0 ? (
            <>
              <p>
                <b>Efeitos</b>
              </p>
              <ul>
                {view.effects.map((row) => (
                  <li key={`${row.label}-${row.text}`}>
                    <b>{row.label}</b> {row.text}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {view.consume.length > 0 ? (
            <>
              <p>
                <b>Como é consumido</b>
              </p>
              <ul>
                {view.consume.map((row) => (
                  <li key={row.label}>{row.label}</li>
                ))}
              </ul>
            </>
          ) : null}
          {view.cards.length > 0 ? (
            <p>
              <b>Cartas</b> {view.cards.join(" · ")}
            </p>
          ) : null}
          <p>
            <b>Decaimento</b> {view.decay}
          </p>
          {view.risk ? (
            <p className="gx-res__risk">
              <b>Risco</b> {view.risk}
            </p>
          ) : null}
          {view.origin.length > 0 ? (
            <details>
              <summary>Origem genética</summary>
              <p>
                {view.origin
                  .map((row) => `${row.key} ${row.expression}%`)
                  .join(" · ")}
              </p>
            </details>
          ) : null}
          {debug ? <pre className="gx-res__debug">{view.debug}</pre> : null}
        </div>
      ) : null}
    </div>
  );
}
