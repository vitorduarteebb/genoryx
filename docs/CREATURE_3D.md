# Modelo 3D da Creature — GENORYX

A IA 2D é o diretor de arte. A Meshy é o escultor. O DNA não muda.

```
BREEDING → DNA → GPT IMAGE (retrato canônico)
                 → GPT turnaround FRONT/SIDE/BACK
                 → MESHY Multi-Image-to-3D
                 → model.glb
                 → Three.js na ficha
```

ADR: `0016`. Retrato: ADR `0015`.

## POC

Creature `84ae443c-a1e8-41eb-afe1-aff5763eaf01` (Florune BABY FERAL QUADRUPED). Sem as outras 44. Sem animação. Sem auto-rig Meshy.

CLI: `generate-creature-model --creatureId=<id> --process`

## Presença (sem rig)

O GLB estático ganha vida no cliente via `CreaturePresenceController` (ADR 0017): respiração, sway, micro-eventos a partir do `visualSeed`. Temperament + life stage + BodyPlan. Sem regenerar modelo.

Ficha: 3D é o hero. Retrato 2D só no loading/erro e nos grids.

## Segredo

`MESHY_API_KEY` só em `/opt/nexora/.env.production`. Nunca git, frontend, chat ou logs.
