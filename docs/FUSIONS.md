# Fusions e Convergência — GENORYX

Typology pairs são identidade ordenada: `BURN+TANK` = `TANK+BURN`. `BURN+BURN` não é double.

V1 implementa 5 doubles e 1 convergência. Não escreve 105 nem 455 classes.

| Família | Typologies | PT | Tipo |
| --- | --- | --- | --- |
| LIVING_FURNACE | BURN + TANK | Fornalha Viva | Fusion |
| VITAL_ASHES | BURN + HEAL | Cinzas Vitais | Fusion |
| INCANDESCENT_MARK | BURN + CONTROL | Marca Incandescente | Fusion |
| LIVING_BASTION | TANK + HEAL | Bastião Vivo | Fusion |
| CONTROLLED_REGENERATION | HEAL + CONTROL | Regeneração Controlada | Fusion |
| PHOENIX_CYCLE | BURN + HEAL + CONTROL | Ciclo da Fênix | Convergence |

Código interno pode usar `TRIPLE_FUSION`. UI: **CONVERGENCE**.

## Elegibilidade

Não basta ter as typologies na party.

1. Round ≥ 5 (fusion) ou ≥ 7 (convergence)
2. Typologies **vivas**
3. Usage history das typologies (cartas realmente jogadas)
4. Resonance / momentum
5. Condição da família

Round 5 só destrava avaliação. Sem usage, a família existe no cálculo mas `ready = false` (`reason: usage`).

Recycle do deck **não** apaga o histórico.

Criatura KO: some das **novas** oportunidades. Carta já despertada permanece.

Anti-loop: `maxTriggerDepth`, `oncePerRound`, cap de resonance por typology/round.

Discovery futura: SynergyCodex por conta, não por criatura.
