"use client";

import { useState } from "react";

export function InlineRename({
  name,
  busy,
  onRename,
}: {
  name: string;
  busy: boolean;
  onRename: (next: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  async function confirm() {
    const next = draft.trim();
    if (!next || next === name) {
      setEditing(false);
      setDraft(name);
      return;
    }
    await onRename(next);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="mt-1 flex items-center gap-2">
        <h1 className="font-display text-4xl text-gold md:text-5xl">{name}</h1>
        <button
          type="button"
          aria-label="Renomear"
          onClick={() => {
            setDraft(name);
            setEditing(true);
          }}
          className="mt-2 text-muted hover:text-gold"
        >
          ✎
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <input
        autoFocus
        value={draft}
        maxLength={16}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void confirm();
          if (event.key === "Escape") {
            setDraft(name);
            setEditing(false);
          }
        }}
        className="min-w-[12rem] flex-1 rounded-xl border border-gold/40 bg-void px-3 py-2 font-display text-2xl text-gold outline-none"
      />
      <button type="button" disabled={busy} onClick={() => void confirm()} className="text-sm text-gold">
        {busy ? "…" : "OK"}
      </button>
      <button
        type="button"
        onClick={() => {
          setDraft(name);
          setEditing(false);
        }}
        className="text-sm text-muted"
      >
        Cancelar
      </button>
    </div>
  );
}
