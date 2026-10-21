# WORLD ASSET MANIFEST V2

Status: READY = produção; TEMP = kit stylized usável; PLACEHOLDER = primitive/protótipo; NEEDS_ART = falta peça.

MobileReady: sim = sem refraction / particle spam / muitos point lights.

| Asset | Area | Category | Path | Status | MobileReady | MaterialCount | LOD | Notes |
|---|---|---|---|---|---|---|---|---|
| HavenPalette | Haven | palette | packages/config/src/world-art.ts | READY | sim | 0 | — | Fonte única de hex |
| VerdantisPalette | Verdantis | palette | packages/config/src/world-art.ts | READY | sim | 0 | — | Fonte única de hex |
| plaza / stone / path / grass tiles | Haven | ground | world-art/iso-kit.ts | TEMP | sim | 1 | none | Variação via speckles, não cor chapada |
| moss / earth / water tiles | Verdantis | ground | world-art/iso-kit.ts | TEMP | sim | 1 | none | Water = UV fake no stroke |
| Genesis Core V2 | Haven | landmark | iso-kit `core` + WorldLandmarkVisual | TEMP | sim | 4 | High/Mobile | Altura ~4.2 m. Não usar cilindro tronco v9 |
| House A/B/C | Haven | architecture | houseA/B/C + SpawnHouse | TEMP | sim | 3 | none | Mesmo kit, 3 silhuetas |
| Market kit | Haven | props | stall + SpawnMarketStall | TEMP | sim | 3 | none | Counter/canopy/crates |
| Lyra shrine | Haven | landmark | shrine + SpawnLyraShrine | TEMP | sim | 3 | none | Violeta vs cyan |
| Arena approach | Haven | landmark | arena + SpawnArenaApproach | TEMP | sim | 2 | none | Só entrada |
| South Gate | Haven | landmark | gate + SpawnSouthGate | TEMP | sim | 3 | none | Segundo landmark |
| Haven trees A/B/C | Haven | vegetation | treeHaven* / treeL/M/S | TEMP | sim | 2 | far cull | Não esfera única |
| Verdantis trees A–D | Verdantis | vegetation | treeVerd* | TEMP | sim | 2 | far cull | Copa mais profunda |
| Vegetation library | both | vegetation | bush*, grassClump, flowers, mushroom, rocks, log, vine | TEMP | sim | 1 | cull | Kit pequeno |
| Waystone | Verdantis | landmark | waystone + SpawnWaystone | TEMP | sim | 3 | none | Ancient Genesis |
| Crystal Hollow | Verdantis | landmark | hollow + SpawnCrystalHollow | TEMP | sim | 3 | none | Convite de entrada |
| Wall/door/window/roof modules | Haven | architecture | Unity kit parcial via House | PLACEHOLDER | sim | 2 | none | Módulos soltos wall_straight etc. ainda NEEDS_ART como peças isoladas |
| wall_straight / corner / cap | Haven | architecture | — | NEEDS_ART | sim | — | — | Encapsulado nas casas por enquanto |
| Water kit SSR | Verdantis | fx | tile water | TEMP | sim | 1 | none | Sem refraction |
| World tamer | Haven | character | world-art/tamer.ts | TEMP | sim | 1 | none | 96×148, blob shadow |
| NPC paints | Haven | character | paintWorldNpc | TEMP | sim | 1 | none | Nameplate só por proximidade (Engineer) |
| Creature world avatar | both | creature | creature-world-avatar.ts | TEMP | sim | 0 | near/med/far | Bake 8 dirs do 3D real |
| Blob shadow | both | fx | baker + SpawnBlobShadow | TEMP | sim | 1 | none | Obrigatório |
| Lighting Haven/Verdantis | both | lighting | world-art.ts + WorldArtLighting | TEMP | sim | — | quality | Sem deixar o mapa ilegível |
| VFX kit | both | fx | vfx.ts + WorldArtVfx | TEMP | sim | — | quality | Motes baixos |
| HUD skin | both | ui | world-art-hud.css | TEMP | sim | — | — | Integrado em `/game/adventure` |
| Minimap skin | both | ui | minimap.ts | TEMP | sim | — | collapsed mobile | Integrado; tap expande no portrait |
| Quality presets | both | perf | worldQualityPresets | READY | sim | — | L/M/H | Ligado ao FPS de animação do world |
| Foreground occlusion fade | both | camera | iso/renderer.ts | TEMP | sim | — | — | Fade simples em props layer ≥ 11 sobre o player |
| Parallax foreground | both | camera | — | PLACEHOLDER | sim | — | — | Fora desta fatia (V2.1) |
| Ambient NPC loops | Haven | life | iso/renderer.ts | TEMP | sim | — | — | Sway mínimo; sem AI |
| Atlas files on disk | creatures | pipeline | creature-world/<id>/<stage>/ | PLACEHOLDER | sim | — | — | Cache em memória na sessão; disco = V2.1 |

## Ainda PLACEHOLDER / NEEDS_ART

Módulos de parede isolados, parallax, atlas persistido em disco, tamer atlas pintado oficial. O kit estilizado V2 está **integrado** em `/game/adventure` (production-intent, não sculpt final).
