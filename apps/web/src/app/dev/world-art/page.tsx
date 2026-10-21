"use client";

import { worldAssetCatalog } from "@nexora/config";

export default function WorldArtBoard() {
  const ready = worldAssetCatalog.filter((row) => row.status === "READY").length;
  return (
    <main style={{ minHeight: "100vh", background: "#0c100e", color: "#f4efe4", padding: "24px" }}>
      <p style={{ letterSpacing: "0.24em", color: "#3de0d0", fontSize: 12 }}>GENORYX · WORLD ASSET REGISTRY</p>
      <h1 style={{ fontFamily: "Cinzel, serif", fontWeight: 600 }}>Pipeline asset-driven</h1>
      <p style={{ maxWidth: 720, color: "#c8c0b0" }}>
        ADR 0042. O kit Canvas deixou de ser arte de produção. {ready}/{worldAssetCatalog.length} READY. Sem plate
        READY o Adventure usa debug art (`?debugArt=1`, `?hitmap=1`).
      </p>
      <table style={{ width: "100%", maxWidth: 960, borderCollapse: "collapse", marginTop: 24, fontSize: 13 }}>
        <thead>
          <tr style={{ color: "#c9a24a", textAlign: "left" }}>
            <th style={{ padding: "8px 6px" }}>assetId</th>
            <th>área</th>
            <th>camada</th>
            <th>status</th>
            <th>arquivo</th>
          </tr>
        </thead>
        <tbody>
          {worldAssetCatalog.map((row) => (
            <tr key={row.id} style={{ borderTop: "1px solid #2a322c" }}>
              <td style={{ padding: "8px 6px" }}>{row.id}</td>
              <td>{row.area}</td>
              <td>{row.layer}</td>
              <td style={{ color: row.status === "READY" ? "#3de0d0" : "#c45c48" }}>{row.status}</td>
              <td style={{ color: "#8c968c" }}>{row.src}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
