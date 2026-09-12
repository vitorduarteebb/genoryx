"use client";

export function BattleSilhouette({ name, loading }: { name: string; loading?: boolean }) {
  return (
    <div className="gx-silhouette" data-loading={loading ? "true" : undefined} aria-hidden>
      <span className="gx-silhouette__shape" />
      <p>{loading ? "Formando…" : name}</p>
    </div>
  );
}
