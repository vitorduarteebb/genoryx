# WORLD ART INTEGRATION CONTRACT

**ADR 0042:** arte de produção = arquivos em `apps/web/public/world-art/` + `packages/config/src/world-assets.ts`. Lista: `docs/world/WORLD_ASSET_PIPELINE.md`.

Kit Canvas (`iso-kit.ts`) é **debug fallback**. Não entregar primitivas como visual final.

Art Strike Team **não** reimplementa movement, pathfinding, encounter, battle, routing, return-state, combat, party, world state.


## Arquivos que o Art NÃO toca

```
apps/web/src/lib/iso/renderer.ts
apps/web/src/lib/iso/maps.ts
apps/web/src/lib/iso/types.ts
apps/web/src/lib/iso/projection.ts
apps/web/src/lib/adventure-world.ts
apps/web/src/lib/adventure-return.ts
apps/web/src/app/game/adventure/page.tsx
apps/unity-game/Assets/GENORYX/Scripts/World/WorldAreaManager.cs
apps/unity-game/Assets/GENORYX/Scripts/World/PlayerMotor.cs
apps/unity-game/Assets/GENORYX/Scripts/World/WorldEncounterSystem.cs
apps/unity-game/Assets/GENORYX/Scripts/World/WorldTransitionSystem.cs
apps/unity-game/Assets/GENORYX/Scripts/World/HavenSliceBuilder.cs
apps/unity-game/Assets/GENORYX/Scripts/World/VerdantisGreenRoadBuilder.cs
```

Não sobrescrever estes arquivos. Consumir os hooks abaixo.

## Swap visual (Web) — 4 linhas

Em `apps/web/src/lib/iso/renderer.ts`:

```ts
import { buildWorldArtKit as buildIsoKit } from "../world-art";
import { bakeWorldAvatar } from "../world-art/creature-world-avatar";
import { buildWorldTamerAtlas as buildTamerAtlas, paintWorldNpc as paintNpc } from "../world-art/tamer";
import { paintWorldMinimap as drawMinimap } from "../world-art/minimap";
```

`drawMinimap` no renderer atual é função local. Substituir o corpo pela chamada `paintWorldMinimap(ctx, map, player, w, h)`.

HUD skin, em `adventure/page.tsx` **depois** de `adventure.css`:

```ts
import "../../../lib/world-art/world-art-hud.css";
```

Densidade extra, em `maps.ts` (append, não reescrever interacts):

```ts
import { havenArtDensity, verdantisArtDensity } from "../world-art/composition";
// haven: props: [...props, ...havenArtDensity]
// verdantis: props: [...props, ...verdantisArtDensity]
```

Companion offset recomendado: `companionWorldOffset()` → `{ x: -0.82, z: 0.62 }`.

## Swap visual (Unity)

Trocar primitivas internas por:

```csharp
using Genoryx.WorldArt;

WorldArtLighting.ApplyHaven();
WorldLandmarkVisual.SpawnGenesisCore(Vector3.zero, mobile);
WorldBuildingVisual.SpawnHouse("HavenHouseA", east, 18f, HavenHouseSilhouette.Compact);
WorldBuildingVisual.SpawnHouse("HavenHouseB", west, -14f, HavenHouseSilhouette.Tall);
WorldBuildingVisual.SpawnHouse("HavenHouseC", marketEast, 8f, HavenHouseSilhouette.Wide);
WorldBuildingVisual.SpawnMarketStall(marketPos);
WorldLandmarkVisual.SpawnLyraShrine(lyraPos);
WorldLandmarkVisual.SpawnArenaApproach(arenaPos);
WorldLandmarkVisual.SpawnSouthGate(gatePos);
WorldVegetationVisual.SpawnHavenTree(pos, variant);
// Verdantis
WorldArtLighting.ApplyVerdantis();
WorldLandmarkVisual.SpawnWaystone(waystonePos);
WorldLandmarkVisual.SpawnCrystalHollow(hollowPos);
WorldVegetationVisual.SpawnVerdantisTree(pos, variant);
CreatureWorldAvatarRenderer.SpawnBlobShadow(creatureTransform);
CreatureWorldAvatarRenderer.ApplyGroundAnchor(creatureTransform);
```

Manter `WorldInteractable`, blockers e `WorldSession` como estão. Só a malha visual muda.

## APIs / configs para consumir

| Config | Path |
|---|---|
| Paletas, quality, scale, VFX | `@nexora/config` → `havenPalette`, `verdantisPalette`, `worldQualityPresets`, `worldDisplayScale`, `worldGroundAnchor`, `worldVfxProfiles` |
| Kit iso | `buildWorldArtKit()` |
| Avatar baker | `bakeCreatureWorldAvatar(input, lod?)` |
| Qualidade | `detectWorldQuality()` |

## Prefabs / components visuais

| Nome | Onde | Status |
|---|---|---|
| HavenCorePrefab | `WorldLandmarkVisual.SpawnGenesisCore` + prop `core` | TEMP (stylized kit, não sculpt final) |
| HavenHousePrefab A/B/C | `WorldBuildingVisual.SpawnHouse` + `houseA/B/C` | TEMP |
| HavenMarketStallPrefab | `SpawnMarketStall` + `stall` | TEMP |
| HavenLyraShrinePrefab | `SpawnLyraShrine` + `shrine` | TEMP |
| HavenArenaApproachPrefab | `SpawnArenaApproach` + `arena` | TEMP |
| HavenSouthGatePrefab | `SpawnSouthGate` + `gate` | TEMP |
| VerdantisWaystonePrefab | `SpawnWaystone` + `waystone` | TEMP |
| VerdantisHollowPrefab | `SpawnCrystalHollow` + `hollow` | TEMP |
| CreatureWorldAvatarRenderer | web baker + Unity scale/shadow | TEMP (bake READY quando 3D ok; senão WORLD_AVATAR_PENDING) |
| WorldBuildingVisual | Unity | TEMP |
| WorldVegetationVisual | Unity + props tree* | TEMP |
| WorldLandmarkVisual | Unity | TEMP |
| WorldInteractionVisual | marker de chão | TEMP |

Nada acima é produção final de arte (sculpt/texture). São **production-intent kits** para parar de parecer engine demo.

## Placeholders restantes

Ver `WORLD_ASSET_MANIFEST_V2.md` coluna Status `PLACEHOLDER` / `NEEDS_ART`.

## Regras

- Art não decide gameplay (`if treeColor == blue` é proibido).
- Quality levels não escondem POIs, wilds, exits.
- Não gerar centenas de PNGs. Atlas em memória no bake web. Manifest no objeto `CreatureWorldAvatar.manifest`.
- Core HighProfile vs MobileProfile: Unity `mobile` flag; web usa `detectWorldQuality()`.
