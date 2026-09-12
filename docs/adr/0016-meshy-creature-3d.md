# ADR 0016 — Modelo 3D via Meshy a partir da arte canônica

- Status: aceito (POC)
- Data: 2026-09-02

## Contexto

A arte oficial da Creature é o retrato GPT Image (`CreatureVisualAsset`, ADR 0015). Recortar esse PNG em sockets 2D perde identidade. A Meshy oferece Multi-Image-to-3D (GLB). O auto-rig da Meshy **não** é adequado para não-humanoides (QUADRUPED, SERPENT, ARACHNID, etc.).

## Decisão

1. GPT Image continua o **diretor de arte**: identidade, cores, temperament, mutation, life stage.
2. Meshy é só o **escultor**: geometria + textura + `model.glb`. Nunca escolhe genes.
3. O NFT/Creature ID não muda. Retrato canônico e GLB são representações do mesmo indivíduo.
4. Turnaround (FRONT / SIDE / BACK) nasce do GPT com a PNG 3/4 aprovada como referência. Sem redesenhar chifres, olhos, cores, cauda, asas, pattern.
5. Multi-Image-to-3D recebe até 4 vistas. Primeira imagem = FRONT (`meshy-7` / `latest`).
6. Chave `MESHY_API_KEY` só no backend/VPS. Nunca frontend, Phaser, `NEXT_PUBLIC_*`, logs ou banco.
7. Auto-rig/animação Meshy **não** entra no Alpha para QUADRUPED. Rigs GENORYX por BodyPlan são fase posterior.
8. POC: uma Florune (`84ae443c-a1e8-41eb-afe1-aff5763eaf01`) → GLB → visualizador Three.js na ficha. Idle sem rig: ADR 0017. Sem batch.
9. Phaser permanece o mundo 2D. Three.js só renderiza o GLB na ficha (e, no futuro, market/detail).

## Consequências

- `CreatureVisualAsset.imageHash` do retrato 3/4 não muda.
- `geneticHash` não muda.
- Coleção/grid continua no retrato estático se o modelo não estiver READY.
- Sem endpoint público de “gerar 3D”. CLI admin explícito.
