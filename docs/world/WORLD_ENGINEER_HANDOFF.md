# WORLD ENGINEER HANDOFF

Art Strike Team V2 terminou a camada visual desacoplada. Vocês continuam donos do runtime.

## Assets prontos

- Paletas Haven/Verdantis em `@nexora/config`
- Kit iso V2: `buildWorldArtKit()` (mesmas chaves de `iso/kit.ts` + extras)
- Tamer maior + NPCs
- Minimap com caminho/landmarks
- Baker de avatar 8 direções a partir do 3D
- Densidade extra `havenArtDensity` / `verdantisArtDensity`
- HUD CSS `world-art-hud.css`
- Unity `Genoryx.WorldArt.*`

## Prefabs prontos (Unity)

`SpawnGenesisCore`, `SpawnHouse`, `SpawnMarketStall`, `SpawnLyraShrine`, `SpawnArenaApproach`, `SpawnSouthGate`, `SpawnWaystone`, `SpawnCrystalHollow`, árvores Haven/Verdantis.

Instanciar e **não** recriar primitivas equivalentes no builder.

## Como instanciar (Web)

1. Trocar imports do kit/tamer/avatar/minimap (contrato).
2. Append density arrays.
3. Importar o CSS do HUD.
4. Companion: `companionWorldOffset()`.
5. Player scale: tamer V2 já nasce 96×148; aumentar `zoom` portrait se ainda pequeno (isso é câmera — vocês).

## Como trocar placeholders

| Agora no Engineer | Trocar por |
|---|---|
| `buildIsoKit()` | `buildWorldArtKit()` |
| `bakeWorldAvatar` em `iso/avatar.ts` | `bakeWorldAvatar` em `world-art/creature-world-avatar.ts` |
| `GenesisCore()` cilindro 13 m | `WorldLandmarkVisual.SpawnGenesisCore` |
| `House(...)` caixa | `WorldBuildingVisual.SpawnHouse` |
| `treeL` bola | `treeHaven*` / `SpawnHavenTree` |

Não precisa conhecer facetas do cristal. Chame o prefab.

## Hooks visuais

- `WorldInteractionVisual.SpawnGroundMarker` no selecionado (sem outline neon).
- `CreatureWorldAvatarRenderer.SpawnBlobShadow` em companion/wild/NPC.
- `detectWorldQuality()` para FPS de animação de criatura **somente**. Walk speed permanece a de vocês.

## Arquivos que vocês NÃO devem modificar da pasta Art

```
packages/config/src/world-art.ts
apps/web/src/lib/world-art/**
apps/unity-game/Assets/GENORYX/Scripts/WorldArt/**
docs/world/WORLD_ART_*
```

Se o kit estiver feio, abrir issue para Art — não patchar hex solto no renderer.

## Preview local

`/dev/world-art` — board dos props. Não entra no loop do jogador.

## Integração final

Um terceiro agente (Integration + Visual QA) faz o merge das 4 linhas de import, testa 390×844 / 844×390 / 1920×1080, e só então publica. Art **não** faz deploy.
