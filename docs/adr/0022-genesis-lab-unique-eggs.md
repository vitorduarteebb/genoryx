# ADR 0022 — Genesis Lab, ovos únicos e incubação por complexidade

- Status: aceito
- Data: 2026-09-02

## Contexto

A Lyra já cruza no servidor, mas a UI parecia um formulário administrativo e o ovo era um cartão genérico com raridade/tempo. O jogador precisa sentir um laboratório genético e ver um ovo que nasceu daquele cruzamento — sem a OpenAI decidir genes.

## Decisão

1. A tela da Lyra passa a ser o **Genesis Lab**. O servidor continua authoritative: pais, ChildGenome, 10 loci, mutação, fertility, `geneticHash` e hatchAt não vêm do cliente.
2. **CrossPotential** é previsão só dos pais. **GenesisGrade** é o resultado real da recombinação. Um score alto não promete filho raro.
3. GenesisGrade (COMMON / REFINED / RARE / EXCEPTIONAL / GENESIS) mede complexidade genética (novidade, mutação, linhagem, morfologia, tipologia, elemento, origem de poder). **Não** usa ATK/HP/stats de combate.
4. Incubação é config-driven (`incubationConfig.alpha` e `.production`). Alpha: 2 / 5 / 10 / 20 / 30 min. O browser só exibe `hatchAt`.
5. Cada ovo tem `EggVisualGenome` (pistas, sem recessivos, sem G1–G10, sem poder exato). A OpenAI gera **uma** arte 2D assíncrona (`EggVisualAsset`). Falha de arte não desfaz o breed. `EGG_AI_ART` liga mock/OpenAI.
6. Pais não ficam locked durante a incubação. Fertility cai no commit do ovo.
7. Ovos Alpha existentes com tempo absurdo são **normalizados** na migration (clamp do `hatchesAt`). Nenhum ovo é apagado.
8. Breeding continua React/Web. Sem Unity e sem Meshy de ovo.

## Consequências

- `calculateBreeding()` ganha grade/score/hatch; `blueprintFromParents()` não muda.
- Preview deixa de chamar breeding com seed fixo só para custo.
- Genesis Report no reveal pode citar grade e origem do poder depois do hatch.
