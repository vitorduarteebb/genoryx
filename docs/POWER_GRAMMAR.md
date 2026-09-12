# Power Grammar

Um `GeneticPowerGenome` tem:

- powerTheme
- primaryMechanic / secondaryMechanic
- resourceInteraction
- targetPattern
- scalingPattern
- triggerPattern
- riskPattern
- signatureModifier

Exemplo UNSTABLE_FURNACE / Coração Incandescente:

```
FIRE + BURN
primary APPLY_BURN
secondary AMPLIFY_BURN
trigger ON_BURN_TICK
resource HEAT
risk SELF_DAMAGE_OPTIONAL
signature BURN_EXPLOSION
```

G1–G10 são papéis do mesmo poder (CORE_ATTACK … ULTIMATE), não 10 poderes soltos.

Nomes vêm de léxico controlado. Efeitos são structs; `presentEffects()` gera o texto.
