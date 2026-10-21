# ADR 0044 — Combat Genome V2.4 (grimório, sinergia, counterplay)

- Status: aceito
- Data: 2026-09-14
- Estende: ADR 0043 e `docs/COMBAT_GENOME_V2.md`
- Não substitui: resolver único, Timeline, Reaction Stack V2.3, kits selados, breeding, linhagem

## Contexto

O Genome V2 define como os 11 genes entram no golpe. Sem a camada de carta, o jogador ainda lê “Causa N” e a identidade genética mente sobre a build.

## Decisão

1. A carta é ferramenta. A criatura é o motor. A mesma carta escala com quem a usa e com quem a recebe.
2. Migração é hidratação determinística na resolução e na leitura. ID, arte, slot, linhagem e snapshot do kit não mudam. Híbrido não se inventa.
3. Sinergia nasce de estado compartilhado (Marked, Burn, Guard), não de bônus “se estiver com a criatura X”. Combo elemental não é tabela automática.
4. Anatomia e personalidade abrem vocabulário. Não somam atributo e não sobrepõem gene.
5. Identidade genética e build detectada continuam campos separados. O grimório filtra por domínio e velocidade. A timeline da batalha mostra a previsão, com fantasma “se jogar Normal”, sem revelar a mão inimiga.
6. Números só em `genomeV2` (`@nexora/config`). RNG só em `RandomService`. SPD não dá turno extra. Timeline não se funde com o stack.
7. Simulador emite relatório. Não rebalanceia sozinho.

## Fora

Regenerar kit, novo grimório de conteúdo, advisor de breeding, segundo resolver.
