# ADR 0043 — Combat Genome V2 (genética vira gameplay)

- Status: aceito
- Data: 2026-09-14
- Estende: ADR 0009, ADR 0035, ADR 0036, ADR 0037, ADR 0038, ADR 0039
- Não substitui: Timing Engine V2.3, kits selados, Personal Resource, formação FRONT/MIDDLE/BACK
- Especificação fechada: `docs/COMBAT_GENOME_V2.md`

## Contexto

Os 11 genes já existem e parte deles vira número em `deriveCombatStats`. Na resolução isso quase não se sente.

Hoje o dano usa o elemento da carta para escolher ATK ou MAG, mitiga sempre com DEF, crítico é chance do gene CRIT vezes um multiplicador chato `1.5`, e SPD/PREC/EVA/CDMG/STA não decidem a luta. A carta típica ainda lê “Causa N de dano”. Identidade genética (ex.: função Crítico) é apresentada como se fosse a build, mesmo com CRIT E.

Isso não é falta de cartas. É o núcleo. Reescrever o grimório antes de fechar as fórmulas só multiplica cartas pobres.

## Decisão

1. **Os 11 genes entram na resolução**, na ordem: iniciativa → acerto → dano → crítico → status. Números em `@nexora/config` (`genomeV2`). RNG só via `RandomService`.
2. **SPD não dá turno extra.** Dá iniciativa na timeline: `SPD derivada + velocidade da carta`. Velocidades: Muito Rápida / Rápida / Normal / Pesada.
3. **A timeline não substitui o stack V2.3.** Ela ordena as jogadas confirmadas do round. Janelas DECLARE / PRE_IMPACT / POST_IMPACT / STATUS / LETHAL / FUSION continuam na hora do impacto. Reação não entra na timeline.
4. **Carta declara domínio:** Físico (ATK/DEF), Mágico (MAG/RES), Híbrido, ou Utilidade. Kit selado não é reescrito; o resolver hidrata domínio e velocidade. Inferência é fallback, não a gramática nova.
5. **PREC disputa EVA** numa faixa estreita (teto 99%, piso 72%, empate 90%). Não é loteria. Inevitável ignora evasão.
6. **Rank A e S são breakpoints**, não só multiplicador maior. SS herda o breakpoint S.
7. **Identidade genética ≠ arquétipo detectado.** A tipologia de nascimento permanece. A leitura de combate sai dos genes reais. Contradição (função Crítico com CRIT E) é fraqueza explícita, não cosmético.
8. **G1–G10 não mudam de chave.** Papel de apresentação Genome V2 entra por cima. Anatomia visual só gera carta em kit **novo**. Snapshot selado não é rerolado.
9. **Grimório não entra neste comando.** A gramática da carta (tipo + custo + velocidade + escala + 1 interação; forte = 2; Signature/Supreme pode quebrar uma regra) é o contrato das cartas futuras.

## Consequências

- Dano de cartas elementais seladas passa a mitigar com RES, não com DEF. Testes que cravam número absoluto de dano precisam ser atualizados. Texto armazenado do kit não muda.
- O round deixa de resolver um lado e depois o outro. Os dois confirmam; uma timeline única resolve. Energia, mana e Reserva Arcana permanecem.
- Preview da timeline não revela a mão inimiga. Mostra fantasmas em “carta Normal”.
- Implementação única, fases internas 1–3 em `docs/COMBAT_GENOME_V2.md`. Fase 4 (grimório) fica fora.

## Fora de escopo

Regenerar cartas, novas artes, breeding advisor, mudança de roll genético, segundo recurso de energia, turno extra por SPD.
