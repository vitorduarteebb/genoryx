# Motor de combate competitivo — GENORYX

Marca pública: **GENORYX: Genesis**. Este arquivo é a fatia extraída da Guerra Mágica, da memória tática e do spike do turno 5 (ADR 0030). Não existe produto chamado NEXYROM (GDD §1, ADR 0012).

O fluxograma e a tabela de fusão canônicos estão em `docs/COMBAT_SYSTEM.md` (ADR 0031). Números e colapso deste arquivo são da fatia — não substituem aquele fluxograma.

O cliente manda intenção. `@nexora/game-engine` calcula. RNG só via `RandomService`. `V_gen` é habilidade única da criatura (0–100), não atributo de chain.

Módulos: `draft-weights.ts`, `magic-stack.ts`, `fusion-formula.ts`. Schema: `packages/config/schemas/card-definition.schema.json`. Ainda **não** entram no `reduceBattle` — a base lógica está testada; a ligação é a próxima fatia.

---

## Tabuleiro e alcance

| Slot | Papel |
| --- | --- |
| FRONT | Sempre exposto. Absorve SHORT. |
| MIDDLE | SHORT não alcança. MEDIUM só em round par (turno sim, turno não). |
| BACK | Imune a SHORT/MEDIUM enquanto houver aliado à frente. LONG e AOE ignoram o bloqueio. |

| Alcance | TargetRule | Alvo legal |
| --- | --- | --- |
| SHORT | `FRONT_ONLY` | Só a criatura mais à frente. |
| MEDIUM | `ANY_TARGETABLE` | FRONT; MIDDLE se a janela estiver aberta. |
| LONG | `PIERCE_FRONT` | Qualquer vivo. |
| AOE | `AOE_ALL` | Todos os vivos do lado alvo. |

Colapso: só quando FRONT cai. MIDDLE → FRONT, BACK → MIDDLE.

---

## Economia

- **Mana:** no início do turno do lado, `energy = min(10, round)`. Turno 1 = 1, turno 5 = 5. Restaura até o teto daquele turno — não acumula sobra.
- **Momentum:** pressão (Aggro/Speed). Paga **só** defesa emergencial no turno inimigo quando a mana não cobre. Nunca paga o lance de abertura.
- **Presença:** compra = criaturas vivas, teto 3. Substitui o `drawPerRound: 2` quando este módulo ligar no reduce.

---

## 1. Schema da carta

Campos canônicos em camelCase. Alias PT entre parênteses.

```json
{
  "key": "tide_lock",
  "name": "Trava da Maré",
  "type": "REACTION",
  "cost": 2,
  "rank": 4,
  "element": "WATER",
  "typology": "CONTROL",
  "range": "MEDIUM",
  "targetType": "ENEMY",
  "momentumAltCost": 2,
  "interventionTrigger": "ON_STACK",
  "draftWeightBase": 1,
  "tags": ["CONTROL"],
  "species": ["nympha"],
  "effects": [
    { "op": "DAMAGE", "value": 8 },
    { "op": "APPLY_STATUS", "status": "STUN", "duration": 1 }
  ]
}
```

| Campo | Alias PT | Papel |
| --- | --- | --- |
| `cost` | Custo_Mana | 0–12. Pago na pilha + fadiga. |
| `momentumAltCost` | Custo_Momentum_Alternativo | `null` = sem emergência. |
| `range` | Alcance | SHORT / MEDIUM / LONG / AOE. |
| `interventionTrigger` | Gatilho_Intervencao | NONE / ON_ENEMY_RESOLVE / ON_STACK. |
| `draftWeightBase` | Peso_Draft | Base 1 se o tipo ainda não pesou. |
| `effects` | Efeitos | DAMAGE, HEAL, SHIELD, APPLY_STATUS (BURN, BLEED, POISON, STUN, SHIELD), DRAW, GAIN_ENERGY, GAIN_MOMENTUM. |

JSON Schema completo: `packages/config/schemas/card-definition.schema.json`.

---

## 2. Loop — dois sistemas críticos

### 2.1 Pesos de draft no fim do turno

```
peso(tipo, lado, turno T):
  base ← 1
  base ← base + 3 × jogadas(tipo, T)
  base ← base + 1 × jogadas(tipo, T-1)
  devolver base          # acúmulo: duas BURN em T = 7

fimDoTurno(lado):
  vivos ← criaturas com HP > 0
  n ← min(3, |vivos|)
  pesos ← { tipo → peso(tipo, lado, T) para cada tipo do deck }
  mão ← mão + compraPonderada(deck, n, pesos, RandomService)
  mana ← min(10, T)
  # BattleUsageHistory NÃO some no recycle
```

### 2.2 Pilha de Embate (Guerra Mágica)

```
abrirLance(atacante, carta, alvo):
  pagar mana = custo            # sem fadiga; momentum proibido
  pilha.push(carta)
  abrir janela de Intervenção no defensor

intervir(lado, carta, profundidade):
  fadiga ← [0, 1, 2][min(profundidade, 3) - 1]   # 1ª=0, 2ª=+1, 3ª=+2
  custo ← carta.custo + fadiga
  se mana ≥ custo: pagar mana
  senão se profundidade ≥ 1 e momentum ≥ carta.momentumAlt: pagar momentum
  senão: recusar
  pilha.push(carta)
  janela passa para o oponente

resolverPilha():
  enquanto pilha não vazia:          # LIFO
    carta ← pilha.pop()
    alvos ← validTargets(carta.range, formação, round)
    aplicar efeitos só nos alvos legais
```

Blefe: guardar mana no próprio turno é o que paga a 1ª intervenção no turno inimigo.

---

## 3. Spike do turno 5 — log

Registro de A nos turnos 1–4: BURN, TANK, BURN, TANK. Combinação válida **BURN + TANK → FORNALHA VIVA**. Sem RNG.

```
T5 · Mana de A e B restaurada até 5.
Presença: 3 cartas (três criaturas vivas). Slot tático extra: FORNALHA VIVA.
P_F = floor((36 × 1.7) + (92 × 0.15) + 4) = 78
C_F = max(1, ceil((1+1)/2) + 2) = 3

A ativa FORNALHA VIVA (LONG) em Nympha · paga 3 mana · sobra 2.
  Janela de Intervenção → B.

B responde TRAVA DA MARÉ (CONTROL, MEDIUM) em Pyron (FRONT).
  1ª intervenção: custo normal 2. Sem fadiga. B mana 3.

A rebate ÍMPETO ELÉTRICO (SPEED, SHORT) em Nympha (FRONT).
  2ª intervenção: custo 1 + fadiga +1 = 2 mana. A mana 0.

Resolução LIFO
  [1] ÍMPETO ELÉTRICO · SHORT → só FRONT legal → Nympha (vanguarda) toma o golpe.
  [2] TRAVA DA MARÉ · MEDIUM → Pyron é FRONT, sempre exposto → atordoa.
  [3] FORNALHA VIVA · LONG → ignora o meio/retaguarda → Nympha recebe P_F=78.
```

O meio de B neste turno 5 (ímpar) está **fechado**. MEDIUM não o alcançaria; por isso a Trava aponta a vanguarda. LONG da fusão não precisa dessa janela.

---

## Fórmulas

$$P_F = \lfloor (P_{Base} \times M_R) + (V_{Gen} \times F_M) + B_{Campo} \rfloor$$

$$C_F = \max \left( 1, \lceil \frac{C_A + C_B + C_C}{2} \rceil + T_R \right)$$

`M_R` e `T_R` vêm do `GenesisGrade` em `@nexora/config` (`combatEngineConfig`). Party define o que *pode* existir; o histórico 1–4 define o que *desperta*.
