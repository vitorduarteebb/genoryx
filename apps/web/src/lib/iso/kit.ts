import { buildWorldArtKit, type WorldArtIsoKit } from "../world-art/iso-kit";

export type IsoKit = WorldArtIsoKit;

/** Debug fallback only (ADR 0042). Production art comes from WorldAssetRegistry. */
export function buildIsoKit(): IsoKit {
  return buildWorldArtKit();
}
