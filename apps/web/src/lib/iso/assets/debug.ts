import { worldPlate, type WorldAssetArea } from "@nexora/config";

export type WorldDebugFlags = {
  debugArt: boolean;
  hitmap: boolean;
};

export function readWorldDebugFlags(area: "haven" | "verdantis" = "haven"): WorldDebugFlags {
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const forced = params.get("debugArt");
  const plateReady = worldPlate(area, "base")?.status === "READY";
  return {
    debugArt: forced === "1" ? true : forced === "0" ? false : !plateReady,
    hitmap: params.get("hitmap") === "1",
  };
}

export function usesDebugWorldArt(area: WorldAssetArea | "haven" | "verdantis") {
  return readWorldDebugFlags(area === "shared" ? "haven" : area).debugArt;
}
