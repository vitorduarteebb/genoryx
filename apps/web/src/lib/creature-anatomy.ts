/** Presentation of existing expressed genes; no new allele, random roll or genome write. */
export const headProfiles: Record<string, { width: number; height: number; length: number; label: string }> = {
  HEAD_01_SMOOTH: { width: 1.14, height: 1.16, length: 0.82, label: "Arredondada" },
  HEAD_02_PREDATOR: { width: 1.28, height: 0.84, length: 1.1, label: "Mandíbula robusta" },
  HEAD_03_DRACONIC: { width: 0.88, height: 0.98, length: 1.34, label: "Dracônica alongada" },
  HEAD_04_ARCANE: { width: 0.8, height: 1.28, length: 1.08, label: "Arcana alta" },
};
export const eyeProfiles: Record<string, { size: number; label: string }> = {
  EYES_01_PREDATOR: { size: 0.74, label: "Fenda pequena" },
  EYES_02_AZURE: { size: 1.48, label: "Grande e aberto" },
  EYES_03_AMBER: { size: 1.0, label: "Médio" },
  EYES_04_NATURE: { size: 1.26, label: "Amendoado" },
  EYES_05_VOID: { size: 0.86, label: "Profundo" },
};
export function headPoint(x: number, y: number, z: number, head: string, eyes: string): [number, number, number] {
  const profile = headProfiles[head] ?? headProfiles.HEAD_01_SMOOTH;
  const eye = eyeProfiles[eyes]?.size ?? 1;
  // One continuous deformation for face, eyelids, iris and ornaments. Neck attachment stays fixed.
  const w = Math.max(0, Math.min(1, (z + 0.04) / 0.25));
  const ease = w * w * (3 - 2 * w);
  const dx = Math.abs(x) - 0.19;
  const dy = y + 0.055;
  const dz = z - 0.35;
  const orbit = Math.exp(-(dx * dx / 0.016 + dy * dy / 0.014 + dz * dz / 0.019)) * ease;
  y += (y + 0.055) * (eye - 1) * orbit;
  z += (z - 0.35) * (eye - 1) * orbit;
  return [x * (1 + (profile.width - 1) * ease), y * (1 + (profile.height - 1) * ease), z + (z - 0.04) * (profile.length - 1) * ease];
}
