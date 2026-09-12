import { chassisPaletteRgb, type ChassisView } from "@nexora/config";

export function gxrRgb(id: string | undefined, fallback: [number, number, number]): [number, number, number] {
  const row = id ? chassisPaletteRgb[id] : undefined;
  if (!row) {
    return fallback;
  }
  return [row[0], row[1], row[2]];
}

export function gxrPalette(chassis?: ChassisView | null, element?: string | null) {
  const fallback = ELEMENT_FALLBACK[String(element ?? "").toUpperCase()] ?? ELEMENT_FALLBACK.ARCANE;
  return {
    primary: gxrRgb(chassis?.primaryColorId, fallback.primary),
    secondary: gxrRgb(chassis?.secondaryColorId, fallback.secondary),
    accent: gxrRgb(chassis?.eyeColorId ?? chassis?.coreColorId, fallback.accent),
  };
}

const ELEMENT_FALLBACK: Record<string, { primary: [number, number, number]; secondary: [number, number, number]; accent: [number, number, number] }> = {
  FIRE: { primary: [0.82, 0.28, 0.12], secondary: [0.28, 0.1, 0.06], accent: [0.95, 0.55, 0.16] },
  WATER: { primary: [0.22, 0.55, 0.78], secondary: [0.08, 0.2, 0.32], accent: [0.45, 0.85, 0.92] },
  NATURE: { primary: [0.36, 0.62, 0.28], secondary: [0.16, 0.22, 0.1], accent: [0.7, 0.86, 0.28] },
  EARTH: { primary: [0.55, 0.4, 0.22], secondary: [0.22, 0.14, 0.08], accent: [0.86, 0.7, 0.32] },
  ELECTRIC: { primary: [0.86, 0.72, 0.18], secondary: [0.28, 0.2, 0.06], accent: [0.98, 0.9, 0.4] },
  ICE: { primary: [0.62, 0.8, 0.88], secondary: [0.16, 0.24, 0.32], accent: [0.78, 0.94, 1] },
  LIGHT: { primary: [0.9, 0.84, 0.62], secondary: [0.32, 0.28, 0.18], accent: [1, 0.95, 0.72] },
  DARK: { primary: [0.28, 0.16, 0.38], secondary: [0.08, 0.05, 0.12], accent: [0.7, 0.32, 0.86] },
  ARCANE: { primary: [0.42, 0.36, 0.82], secondary: [0.14, 0.1, 0.28], accent: [0.72, 0.62, 1] },
};

export function shortCreatureId(id: string) {
  const compact = id.replace(/-/g, "");
  const tail = compact.slice(-8);
  const n = Number.parseInt(tail, 16);
  if (Number.isFinite(n)) {
    return String(n % 10_000_000);
  }
  return compact.slice(-6).toUpperCase();
}
