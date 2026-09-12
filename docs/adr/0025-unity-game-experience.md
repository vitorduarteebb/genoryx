# ADR 0025 — Unity Game Experience V1 + Maturação PvE

- Status: aceito
- Data: 2026-09-03

## Contexto

O Alpha é jogável, mas a apresentação ainda parece interface web. A POC Unity (`/dev/unity-battle`, ADR 0020) não substitui o jogo. Evolução hoje dispara só com Combat XP / level — um BABY pode ficar READY sem explorar o World.

## Decisão

1. Unity é o **renderer oficial V1** de WORLD e BATTLE. React/Next fica com conta, coleção, breed, market, inventário, deck, menus, overlays e admin.
2. Servidor continua authoritative. Unity envia intenção (movimento, interact, target click). Não calcula dano, RNG, loot, XP, captura, breed, evolução, moeda nem posse.
3. Flags: `WORLD_RENDERER=web|unity`, `BATTLE_RENDERER=web|unity`. Default **web**. Phaser e a arena React permanecem fallback. Rota experimental `/game-unity`. `/game` não muda até o WebGL estar estável.
4. **Maturation XP** é progresso biológico separado de Combat XP / Level. BABY→YOUNG e YOUNG→ADULT exigem **level + maturation**. Números em `@nexora/config`. READY_TO_EVOLVE só no servidor. Evoluir não muda DNA / GeneticPower / loci / pais / geneticHash.
5. Maturation só em combate PvE do World, party ativa, com participation score, diversidade e bônus de descoberta. Uma Battle não paga duas vezes (`battleId + creatureId`). NEX/GOLD não vendem Growth XP.
6. Evolução confirmada na **Genesis Chamber** (Haven). Arte do novo stage é enfileirada depois; gameplay não espera OpenAI. Meshy 3D continua on-demand.
7. Asset único: `resolveCreatureGameAsset` — 3D animado READY → 3D READY → retrato canônico → species fallback → silhueta Genesis. Nunca quadrado colorido.
8. Mobs do World são spawn server-side (id, species, family, aggro, posição, respawn). Encounter cria Battle no servidor; Unity só faz a transição.

## Consequências

- Phaser Haven/Verdantis não é apagado.
- Criaturas já READY_TO_EVOLVE por level antigo não são resetadas.
- Sem Unity Editor neste monorepo, o cliente C# e as cenas entram como projeto; o WebGL oficial continua depois do build (bundle/FPS/RAM).
