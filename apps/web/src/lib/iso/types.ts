import type { AdventureAreaId } from "../adventure-return";

export type AdventureInteractKind = "npc" | "poi" | "exit" | "wild" | "collectable" | "captureZone";

export type AdventureInteractable = {
  id: string;
  name: string;
  prompt: string;
  body: string;
  kind: AdventureInteractKind;
  payload?: string;
  zoneId?: string;
  element?: string;
  danger?: string;
  temperament?: string;
  x: number;
  z: number;
  radius: number;
};

export type AdventureHudState = {
  area: AdventureAreaId;
  region: string;
  player: { x: number; z: number };
  destination: { x: number; z: number } | null;
  nearby: AdventureInteractable | null;
  selected?: string | null;
  discovered: string[];
  toast: string | null;
  wildVisible: boolean;
  metrics?: { fps: number; sprites: number; avatar: "sprite-atlas" | "fallback" | "needs-art"; debugArt?: boolean };
};
