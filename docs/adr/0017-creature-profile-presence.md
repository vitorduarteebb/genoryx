# ADR 0017 — Ficha V2 e presença 3D sem rig

- Status: aceito
- Data: 2026-09-02

## Contexto

A POC Meshy (ADR 0016) entregou um GLB estático da Florune. O modelo é bom. A ficha ainda parecia um registro técnico: viewport pequeno, retrato 2D duplicado, criatura imóvel.

O auto-rig da Meshy não serve para QUADRUPED. Não vamos recortar PNG nem regenerar o GLB para “fazer a criatura viver”.

## Decisão

1. A ficha é presentation-first. O 3D READY é o hero. O retrato canônico continua nos cards, market, battle e NFT — não abaixo do modelo.
2. `CreaturePresenceController` vive em `@nexora/game-engine` e anima o root mesmo sem skeleton. RNG só via `visualSeed` (`createSeededRandom`). Sem `Math.random`.
3. Temperament, life stage e BodyPlan compõem o motion profile. Florune BABY FERAL QUADRUPED é a prova.
4. Se o GLB tiver clip `idle` ou skeleton, isso complementa; nunca é obrigatório.
5. Enquadramento é bounding box + hint de BodyPlan. Nunca câmera hardcoded por espécie.
6. DNA, `CreatureVisualAsset` e o GLB atual não mudam nesta fatia.

## Consequências

- Viewer Three.js só na ficha; grid continua portrait.
- Fallback: se o GLB falhar, o retrato permanece e a ficha não quebra.
- Blink real só quando houver morph/bone compatível. Sem hack.
