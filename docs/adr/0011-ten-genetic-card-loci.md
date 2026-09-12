# ADR 0011 — Dez Genetic Card Loci por Creature

- Status: aceito (**persistido no Alpha Loop V1**; profundidade ainda fina)
- Data: 2026-09-01

## Contexto

ADR 0009 definiu combate tático em cartas. ADR 0008 definiu NFT = posse da criatura, não da carta. Sem um modelo fixo de DNA de cartas, a M3 arriscaria gravar “4 skills” e impedir breeding (M6) e o deck (M4).

## Decisão

1. **Toda Creature nasce com exatamente 10 Genetic Card loci** (`G1`–`G10`). Número em `@nexora/config` (`geneticCardConfig.lociPerCreature`).
2. Os 10 loci **não** são 10 NFTs. São propriedades genéticas da Creature (futuro Creature NFT + Genesis Certificate).
3. Cada locus tem **dois alelos**: `expressed` (fenótipo / carta manifesta) e `recessive` (carregado, não ativo).
4. Papéis iniciais dos loci (pools por espécie, não carta única obrigatória):

   | Locus | Papel |
   | --- | --- |
   | G1 | BASIC_ATTACK |
   | G2 | SECONDARY_ATTACK |
   | G3 | ELEMENTAL |
   | G4 | DEFENSE |
   | G5 | UTILITY |
   | G6 | CONTROL |
   | G7 | REACTION |
   | G8 | SYNERGY |
   | G9 | SIGNATURE |
   | G10 | ULTIMATE |

5. Uma Genetic Card é uma **expressão** (`GeneticCardExpression` em `@nexora/types`: `cardFamily`, `variant`, `element`, expressões de power/energy/speed/status/target, `modifierGenes`, `mutationState`). Não é só um `cardId`.
6. **Breeding (M6)** recombina os 10 loci: alelo A + alelo B + dominância + recessivo + recombinação + mutação. Mesmo seed + mesmo estado = mesmo filho. Só `RandomService`.
7. Mutações podem alterar um ou vários loci, variante, elemento, família ou modifiers. Raras podem tocar G9/G10. Sem hardcode no engine.
8. Party 3 criaturas → 30 genetic cards no pool, mais cartas de Character / equipment / relic. Deck competitivo alvo **16**, configurável.
9. Raridade **não** implica mais dano. Trade-offs, sidegrades, especialização.
10. Schema Alpha: `creature_loci` (10 × 2 alelos). Camadas físicas além de BODY/HEAD e idade que trava G9/G10 ficam para depois (ADR 0014).

## Consequências

- M3 deve persistir 10 loci × 2 alelos, não um kit rígido de `CreatureSkill`.
- M4 lê os loci **expressed** para montar o pool.
- M6 testa recombinação locus a locus.
- Metadata NFT futura lista as 10 expressed; recessivos podem ter política de visibilidade própria.
- Spec: `docs/GAME_DESIGN.md`, `docs/COMBAT.md`, `docs/BREEDING.md`, `docs/WEB3.md`, `docs/DATABASE.md`.
