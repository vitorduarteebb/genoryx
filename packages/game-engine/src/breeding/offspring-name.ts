import { speciesVisuals } from "@nexora/config";
import { createSeededRandom } from "../random/random-service";

/** Primeira sílaba. A combinação com o fim é o espaço de nomes únicos. */
const HEADS = [
  "Vey", "Sol", "Kael", "Lun", "Nox", "Ryn", "Ori", "Ael", "Mir", "Tal",
  "Nyx", "Ser", "Vor", "Eli", "Cal", "Dor", "Fen", "Ira", "Jor", "Kes",
  "Lio", "Mor", "Nel", "Pax", "Rav", "Sae", "Tor", "Una", "Vel", "Zan",
  "Bryn", "Cyr", "Dax", "Eir", "Fae", "Gai", "Hyn", "Ivo", "Kyr", "Lae",
] as const;

const TAILS = [
  "ara", "ion", "is", "ael", "or", "en", "ix", "el", "yn", "ar",
  "os", "iel", "un", "ae", "ok", "um", "ir", "al", "eth", "on",
] as const;

const MARKS = ["Bruma", "Eco", "Cinza", "Aurora", "Vinha", "Orvalho", "Âmbar", "Véu"] as const;

const RESERVED = new Set(
  Object.values(speciesVisuals).flatMap((row) => [normalizeOffspringName(row.key)]),
);

export function normalizeOffspringName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function isReservedOffspringName(value: string): boolean {
  const key = normalizeOffspringName(value);
  return key.length < 4 || RESERVED.has(key);
}

function title(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function nameAt(index: number): string {
  const span = HEADS.length * TAILS.length;
  const slot = index % span;
  const cycle = Math.floor(index / span);
  const head = HEADS[slot % HEADS.length] ?? "Vey";
  const tail = TAILS[Math.floor(slot / HEADS.length) % TAILS.length] ?? "ara";
  const base = title(`${head}${tail}`);
  if (cycle === 0) {
    return base;
  }
  const mark = MARKS[(cycle - 1) % MARKS.length] ?? "Eco";
  return `${base} ${mark}`;
}

/**
 * Nome de cruzo: aleatório a partir da semente, nunca um nome de espécie,
 * e o primeiro da sequência que ainda não está em `taken` (já normalizado).
 */
export function uniqueOffspringName(seed: number, taken: ReadonlySet<string>): string {
  const rng = createSeededRandom(seed ^ 0x51ed_9e37);
  const span = HEADS.length * TAILS.length;
  const start = rng.nextInt(0, span - 1);
  const limit = span * (MARKS.length + 1);
  for (let step = 0; step < limit; step += 1) {
    const candidate = nameAt(start + step);
    const key = normalizeOffspringName(candidate);
    if (isReservedOffspringName(candidate) || taken.has(key)) {
      continue;
    }
    return candidate;
  }
  const fallback = `${nameAt(start)} ${rng.nextInt(10, 99)}`;
  return taken.has(normalizeOffspringName(fallback)) ? `${fallback} ${rng.nextInt(100, 999)}` : fallback;
}
