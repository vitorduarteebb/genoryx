export function geneticHash(parts: readonly (string | number | null | undefined)[]): string {
  let hash = 2166136261;
  const input = parts.map((part) => String(part ?? "")).join("|");
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function seedFromParts(parts: readonly (string | number)[]): number {
  const hex = geneticHash(parts);
  const unsigned = Number.parseInt(hex, 16) >>> 0;
  return (unsigned % 2147483647) + 1;
}
