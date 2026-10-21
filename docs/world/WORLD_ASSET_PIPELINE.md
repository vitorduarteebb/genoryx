# GENORYX World — pipeline asset-driven

Canônico: ADR 0042. Runtime: ADR 0040/0041 (lógica). Esta página lista **o que falta pintar** e **como o código consome**.

O Cursor **não** desenha o cenário. Entrega arquivos em `apps/web/public/world-art/` e marca `status: "READY"` em `packages/config/src/world-assets.ts`.

## Pastas

```text
apps/web/public/world-art/
  environment/haven/
  environment/verdantis/
  characters/
  creatures/          # bake 3D em memória; disco = futuro
  fx/
  ui/
```

Resolução: `*.webp` (1x) e `*@2x.webp` (desktop/DPR ≥ 1.5). Sem 4K no telefone.

## Conceito primeiro

Antes de produzir plates: uma imagem-conceito da Genesis Plaza (isométrico 2.5D HD, fantasia estilizada, câmera ¾, player no terço inferior). O código só encaixa o que essa imagem definir.

## Lista de produção — HAVEN

| assetId | arquivo 1x | camada | status |
|---|---|---|---|
| `haven.sky` | `environment/haven/sky.webp` | background | NEEDS_ART |
| `haven.plazaBase` | `environment/haven/genesis-plaza-base.webp` | base | NEEDS_ART |
| `haven.genesisCore` | `environment/haven/genesis-core.webp` | architecture | NEEDS_ART |
| `haven.houseA` | `environment/haven/house-a.webp` | architecture | NEEDS_ART |
| `haven.houseB` | `environment/haven/house-b.webp` | architecture | NEEDS_ART |
| `haven.houseC` | `environment/haven/house-c.webp` | architecture | NEEDS_ART |
| `haven.market` | `environment/haven/market.webp` | architecture | NEEDS_ART |
| `haven.lyraShrine` | `environment/haven/lyra-shrine.webp` | architecture | NEEDS_ART |
| `haven.arenaEntrance` | `environment/haven/arena-entrance.webp` | architecture | NEEDS_ART |
| `haven.southGate` | `environment/haven/south-gate.webp` | architecture | NEEDS_ART |
| `haven.bench` | `environment/haven/bench.webp` | props | NEEDS_ART |
| `haven.lamp` | `environment/haven/lamp.webp` | props | NEEDS_ART |
| `haven.banner` | `environment/haven/banner.webp` | props | NEEDS_ART |
| `haven.crate` | `environment/haven/crate.webp` | props | NEEDS_ART |
| `haven.planter` | `environment/haven/planter.webp` | props | NEEDS_ART |
| `haven.treeAncient01` | `environment/haven/tree-ancient-01.webp` | foreground | NEEDS_ART |
| `haven.vegetation` | `environment/haven/vegetation.webp` | foreground | NEEDS_ART |

Plate `haven.plazaBase` cobre chão, ruas, canteiros e sombras baked. Sem diamantes de tile.

## Lista de produção — VERDANTIS

| assetId | arquivo 1x | camada | status |
|---|---|---|---|
| `verdantis.sky` | `environment/verdantis/sky.webp` | background | NEEDS_ART |
| `verdantis.roadBase` | `environment/verdantis/green-road-base.webp` | base | NEEDS_ART |
| `verdantis.forestEdge` | `environment/verdantis/forest-edge.webp` | background | NEEDS_ART |
| `verdantis.tree01` | `environment/verdantis/tree-01.webp` | foreground | NEEDS_ART |
| `verdantis.bush` | `environment/verdantis/bush.webp` | props | NEEDS_ART |
| `verdantis.rock` | `environment/verdantis/rock.webp` | props | NEEDS_ART |
| `verdantis.roots` | `environment/verdantis/roots.webp` | props | NEEDS_ART |
| `verdantis.water` | `environment/verdantis/water.webp` | base | NEEDS_ART |
| `verdantis.waystone` | `environment/verdantis/waystone.webp` | architecture | NEEDS_ART |
| `verdantis.crystalHollow` | `environment/verdantis/crystal-hollow.webp` | architecture | NEEDS_ART |

## Lista de produção — CHARACTERS

| assetId | arquivo | notas |
|---|---|---|
| `character.tamer` | atlas 8 dirs IDLE/WALK/RUN | bake do Character 3D (mesmo contrato da criatura) |
| `npc.guard` | atlas ou sprite | archetype GUARD |
| `npc.merchant` | atlas ou sprite | MERCHANT |
| `npc.researcher` | atlas ou sprite | RESEARCHER |
| `npc.breeder` | atlas ou sprite | BREEDER |
| `npc.adventurer` | atlas ou sprite | ADVENTURER |
| `npc.civilian` | atlas ou sprite | CIVILIAN |

Criatura de mundo: **não substituir**. Pipeline atual (`bakeCreatureWorldAvatar`) é canônico. Melhorar só sombra, escala, idle/walk, transição de direção.

## Debug

| Query | Efeito |
|---|---|
| `?debugArt=1` | força kit procedural (não é produção) |
| `?debugArt=0` | só assets READY; o resto some |
| `?hitmap=1` | walk / collision / POI / NPC / exit sobre a arte |

Sem plate READY, `debugArt` default é ligado para o Alpha não ficar vazio. Isso **não** torna o kit production art.

## O que o mapa lógico continua a fazer

Grid invisível, pathfinding, tap-to-move, colliders, POIs, NPC anchors, wild spawn, encounter, South Gate, Green Road. O jogador não vê o grid quando a plate existe.
