import type { CreatureVisualInput } from "../creature-visual-contract";
import { bakeWorldAvatar as bakeCreatureWorldAvatar } from "../world-art/creature-world-avatar";
import type { IsoDir } from "./projection";

export type WorldAvatar = {
  id: string;
  width: number;
  height: number;
  frames: Record<IsoDir, { idle: HTMLCanvasElement[]; walk: HTMLCanvasElement[] }>;
  source: "sprite-atlas" | "fallback";
};

/** Single official baker: 3D CreatureAssembler → directional world atlas. */
export async function bakeWorldAvatar(input: CreatureVisualInput): Promise<WorldAvatar> {
  return bakeCreatureWorldAvatar(input);
}
