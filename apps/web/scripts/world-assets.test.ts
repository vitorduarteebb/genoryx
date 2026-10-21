import assert from "node:assert/strict";
import test from "node:test";
import {
  npcArchetypeFromRole,
  npcAssetId,
  worldAssetById,
  worldAssetCatalog,
  worldAssetForProp,
  worldPlate,
} from "@nexora/config";
import { havenMap } from "../src/lib/iso/maps";

test("catálogo do mundo é asset-driven e a praça ainda não tem arte READY", () => {
  assert.ok(worldAssetCatalog.length >= 20);
  assert.equal(worldPlate("haven", "base")?.status, "NEEDS_ART");
  assert.equal(worldPlate("verdantis", "base")?.status, "NEEDS_ART");
  assert.equal(worldAssetForProp("core")?.id, "haven.genesisCore");
  assert.equal(worldAssetById("character.tamer")?.kind, "atlas");
  assert.ok(worldAssetCatalog.every((row) => row.status === "NEEDS_ART" || row.status === "READY"));
  assert.ok(worldAssetCatalog.some((row) => row.status === "NEEDS_ART"));
});

test("NPCs do mapa têm archetype e o registry aponta o sprite", () => {
  const haven = havenMap();
  assert.ok(haven.npcs.every((npc) => npc.archetype));
  assert.equal(haven.npcs.find((npc) => npc.id === "npc.guard")?.archetype, "GUARD");
  assert.equal(npcArchetypeFromRole("mercador"), "MERCHANT");
  assert.equal(npcAssetId("GUARD"), "npc.guard");
});
