# GENORYX Combat Genome V2

Especificação fechada para um único comando de implementação. Fonte de números: este arquivo. Código não inventa constante fora de `@nexora/config`.

Estende ADR 0035, 0036, 0037, 0038 e 0039. Não os substitui. Decisão curta: `docs/adr/0043-combat-genome-v2.md`.

## O que está errado hoje

`deriveCombatStats` calcula HP, ATK, DEF, MAG, RES, SPD e chance de CRIT. Na hora do golpe (`reduce.ts`):

- domínio é adivinhado pelo elemento (fogo/água/natureza/elétrico → MAG, senão ATK);
- mitigação é sempre `def / defenseDivisor`;
- crítico multiplica por `1.5` fixo — CDMG não existe no resolver;
- não há teste de acerto;
- SPD não ordena ação;
- STA não altera status;
- a carta selada ainda é “Causa N”.

SPD A, PREC S e MAG A são letra de ficha. O jogador não vê a criatura agir antes, acertar evasivo ou transformar carta mágica.

## O que não muda

- Servidor authoritative. Cliente não envia dano, acerto, crítico, iniciativa, gene ou recurso.
- RNG de combate só em `RandomService` semeado pelo `matchSeed`. Proibido `Math.random`.
- Energia (`energyForRound`, teto 10), mana e Reserva Arcana (ADR 0039).
- Personal Resource por criatura (ADR 0036): Calor, Faísca, Impulso, Foco etc.
- Formação FRONT / MIDDLE / BACK (ADR 0037). Não colapsar em duas faixas.
- Kits selados (`gxr-kit-v1` / `gxr-gce-v1`) **não são rerolados** (ADR 0035).
- Stack de janelas V2.3 não é removido.
- SPD **nunca** concede ação extra. Snowball de turno extra está proibido.

## Pipeline de um golpe

Ordem obrigatória. Cada passo que muda o resultado escreve linha no log, em português, com o gene que importou.

1. A carta está na timeline. Iniciativa já decidiu a ordem.
2. Janelas V2.3 do impacto (reação / counter) rodam **antes** do acerto, se houver.
3. **Acerto:** PREC do atacante contra EVA do alvo. Utilidade em aliado e efeito em si não disputam.
4. Se errou: sem dano, sem crítico, sem status ofensivo daquele golpe. Recursos de “errou” só se a carta declarar. Fim do golpe.
5. Se acertou: **dano** Físico (ATK contra DEF) ou Mágico (MAG contra RES) ou Híbrido.
6. **Crítico** só em acerto: chance = CRIT, multiplicador = CDMG.
7. **Status** do golpe: potência e duração = STA do aplicador contra RES do alvo.
8. Breakpoints que disparam neste golpe (quebra de guarda, overcharge, contra-janela) logam o rank.

## Os 11 genes

Chave armazenada de Efeitos continua `STATUS`. Na UI o rótulo é **STA / Efeitos**. Não renomear coluna.

Índice de rank: F=0, E=1, D=2, C=3, B=4, A=5, S=6, SS=7.

Multiplicador de atributo já existe (`geneRankMultiplier`). Permanece para HP/ATK/DEF/MAG/RES/SPD derivados. Combate de acerto usa **pontos de rank**, não um segundo multiplicador.

| Gene | Resolução |
| --- | --- |
| HP | Já é vida máxima. Escudo em % usa `maxHp`. Sem segundo bônus em cima — o gene já está dentro da vida. |
| ATK | Escala dano físico. ATK S quebra Guarda (breakpoint). |
| DEF | Mitiga dano físico. DEF S reduz o primeiro golpe pesado. |
| MAG | Escala dano mágico, cura, escudo mágico e overcharge elemental. |
| RES | Mitiga dano mágico e reduz potência/duração de debuff. |
| SPD | Iniciativa. Não turno extra. |
| CRIT | Chance de crítico, só depois do acerto. |
| CDMG | Multiplicador do crítico. Substitui o `1.5` fixo. |
| PREC | Pontos de precisão no teste de acerto. |
| EVA | Pontos de evasão no teste de acerto. Só ataques direcionados. |
| STA | Potência e duração de Burn, Shock, Poison, Stun, Mark e buffs aplicados por esta criatura. |

Rank A e S não são “o multiplicador um pouco maior”. São breakpoints (abaixo). SS herda o breakpoint de S e usa o multiplicador SS nas fórmulas numéricas.

## Iniciativa

Não é o `stackSpeed` do V2.3. São camadas diferentes.

- **Timeline Genome V2:** ordem das jogadas confirmadas no round.
- **Stack V2.3:** quem pode responder no impacto. Reação, counter e ímpeto de janela não entram na timeline.

```
initiative = spdDerivada + cardSpeedBonus + tieBreak
```

`spdDerivada` é o SPD já calculado (base da espécie × multiplicador do rank; sem estágio de vida, como hoje).

| Velocidade | Enum | Bônus |
| --- | --- | --- |
| Muito Rápida | `VERY_FAST` | +40 |
| Rápida | `FAST` | +20 |
| Normal | `NORMAL` | 0 |
| Pesada | `HEAVY` | -25 |

`tieBreak` = hash determinístico (`matchSeed` + `instanceId`) mod 3. Nunca aleatório solto. Empate verdadeiro: lado do jogador ativo do round, depois ordem de confirmação.

Exemplo de referência (base SPD 80, nível 1, mesma espécie):

- SPD C + Rápida = 80 + 20 = 100
- SPD A + Pesada = 100 − 25 = 75

A criatura mais lenta age primeiro porque escolheu a carta. As duas em Normal: A (100) age antes de C (80). Pesada de C (55) perde para Normal de A (100).

Essa diferença (45 entre Rápida e Pesada) precisa continuar maior que um degrau típico de rank na base 80, senão a carta não vira decisão. Não “balancear” o bônus da carta para baixo sem ADR.

Velocidade da carta **não** cobra energia extra. A sobretaxa de timing V2.3 continua só para `timingClass` que já cobra. Não cobrar duas vezes.

### Como o round passa a funcionar

Hoje um lado enfileira e resolve no `END_TURN`; o outro lado vem depois. Genome V2 muda só isso:

1. Upkeep do round (energia, compra, tick de status, decay de recurso) — como hoje.
2. Planejamento simultâneo e escondido. Cada lado monta a fila até acabar a energia e confirma. Timer existente vale.
3. Os dois confirmaram (ou o timer confirmou o que estava na fila): revelar a timeline, resolver em ordem de iniciativa.
4. No impacto de cada carta, as janelas V2.3 abrem. Reação resolve no stack, não troca de lugar na timeline.

Passar = fila vazia. Cartas do mesmo bicho podem ser cortadas por carta inimiga. A ordem entre as próprias cartas, se a iniciativa empatar, é a ordem em que foram enfileiradas.

### Preview (sem revelar a mão inimiga)

Durante o planejamento, a timeline local mostra as cartas que **você** já escolheu e um fantasma por criatura inimiga: `SPD dela + Normal`, rotulado “se jogar Normal”.

Tooltip de Pesada: recua 25. Tooltip de Rápida: avança 20. O texto tem de caber numa decisão: “se eu usar este ataque pesado, criaturas com SPD maior que a minha agem antes, a menos que elas também pesem.”

Depois do lock, a timeline real (velocidade de verdade) aparece e então resolve. Consequência visível. Mão inimiga continua escondida até o lock.

## Precisão × Evasão

Pontos de precisão = `rankIndex * 10`. F=0, C=30, A=50, S=60, SS=70.

```
hit = clamp(0.90 + (precScore - evaScore) * 0.0025, 0.72, 0.99)
```

| Situação | Acerto |
| --- | --- |
| PREC igual a EVA | 90% |
| PREC S vs EVA C (d = +3 ranks, +30 pts) | 97,5% |
| PREC muito maior (d ≥ +4) | 99% (teto) |
| PREC D vs EVA S (d = −4) | 80% |
| PREC F vs EVA SS | 72,5% (piso 72%) |

A maioria dos ataques acerta. PREC S contra evasivo continua ameaçador. PREC F contra EVA S erra o bastante para doer, sem virar cara-ou-coroa.

Rolagem separada da de crítico, ambas no `RandomService` da batalha. Loga a chance e os ranks, não a semente.

Regras:

- Ataque direcionado e cada alvo de área: um teste por alvo.
- `INEVITABLE`: não rola. Acerto 1. Evasão ignorada.
- `MIRA_PERFEITA` / tag `PERFECT_AIM`: +25 pontos de precisão neste golpe (o texto “+25 Precisão” é literal). Ainda prende no teto 99%, salvo Inevitável.
- `AIM`: +10 pontos.
- `PREDATOR`: se pontos de PREC do atacante > pontos de EVA do alvo, dano +20% **depois** da mitigação e **antes** do crítico. Crítico multiplica o bônus. Logar “Predador”.
- Esquiva não é crítico invertido. Não consome o roll de CRIT.

## Dano

A carta declara domínio. Fallback só para kit antigo sem campo (ver Hidratação).

| Domínio | Ofensa | Mitigação |
| --- | --- | --- |
| `PHYSICAL` | ATK | DEF × 0,25 |
| `MAGIC` | MAG | RES × 0,25 |
| `HYBRID` | arredondar(0,55×ATK + 0,55×MAG) | média(DEF, RES) × 0,25 |
| `UTILITY` | sem dano, a menos que uma cláusula de dano exista; se existir, a cláusula declara o domínio |

0,25 × defesa = o `defenseDivisor` 4 atual. Dano físico de carta legada sem escala nova fica na mesma vizinhança. Dano mágico deixa de bater em DEF. Esse é o corte de identidade: ATK E / MAG A é maga, não criatura ruim.

```
raw = flat + round(ofensa * scale)
depoisDoElemento = round(raw * elementMul)
depoisDaDefesa = max(minDamageOnHit, depoisDoElemento - mitigação)
depoisDoPredador = Predador ? round(depoisDaDefesa * 1.20) : depoisDaDefesa
final = crítico ? round(depoisDoPredador * multCDMG) : depoisDoPredador
```

`scale` é fração do atributo. “110% MAG” = `1.10`. “70% MAG” = `0.70`.

Carta legada sem `scale`: `flat = effect.value`, `scale = 0.35`. É o `floor(stat * 0.35)` de hoje, reescrito para o domínio certo. Não rebalancear carta a carta neste comando.

Cura: `flat + round(MAG * healScale)`. Sem `healScale`, usar `0.25`.

Escudo mágico (tag `MAGIC` ou domínio da carta `MAGIC`): `flat + round(MAG * shieldScale)`, default `0.25`.

Escudo em % de vida: `round(maxHp * pct)`. HP já está em `maxHp`. Não multiplicar de novo pelo rank de HP.

Elemento continua o multiplicador de tabela. Não substitui o domínio. Fogo físico existe. Mordida elétrica física existe.

Log mínimo de dano: `18 + 110% MAG → 42, RES −11 → 31`. Se crítico: `Crítico (14% · ×2,10 CDMG S) → 65`.

## Crítico

Só em acerto. Dois genes.

Chance permanece `critChanceByRank`.

Multiplicador novo, em config, substitui `critDamage: 1.5`:

| Rank | CDMG |
| --- | --- |
| F | 1,30 |
| E | 1,40 |
| D | 1,50 |
| C | 1,60 |
| B | 1,75 |
| A | 1,90 |
| S | 2,10 |
| SS | 2,35 |

C fica perto do 1,5 antigo. S é outro acontecimento. CRIT E com CDMG S é build de “acerta pouco, dói demais” — e a ficha tem de dizer isso, não “função Crítico”.

## Status

Base de tick permanece (`burnDamagePerStack`, `poisonDamagePerStack`). STA e RES modificam o que a criatura **aplica**.

```
potência = max(1, round(base * staMul / resMul))
deltaDuração = (staIndex - resIndex >= 2) ? +1 : (staIndex - resIndex <= -2) ? -1 : 0
duração = max(1, duraçãoBase + deltaDuração)
```

`staMul` / `resMul` = `geneRankMultiplier`. STA S (1,45) contra RES C (1,0) aumenta a potência e, com folga de 2 ranks ou mais, a duração. Log: `Queimadura 2 por 3 (STA S contra RES C)`.

Buff aplicado por aliado usa o STA de quem aplicou e não é reduzido pelo RES do aliado.

## Breakpoints

Disparam no resolver. Não reescrevem o texto armazenado do kit. SS herda S. Cada um loga uma linha curta.

| Rank | Efeito |
| --- | --- |
| SPD A | Carta com tag `QUICK` que seria Normal vira Rápida (+20). Não transforma o baralho inteiro. |
| SPD S | A primeira carta que esta criatura confirma na batalha ganha +15 de iniciativa. Uma vez. Flag na unidade. |
| PREC A | Cartas com tag `AIM` ganham +10 precisão neste golpe. |
| PREC S | Cartas com tag `PERFECT_AIM` (ou `AIM` hidratada porque o atacante tem PREC ≥ S **e** a carta já era de caça) floorem o acerto em 97%, ainda abaixo de Inevitável. |
| ATK S | Golpe físico contra alvo com Guarda remove uma Guarda e ignora 25% do escudo **neste golpe**. |
| MAG S | Carta mágica/elemental do golpe recebe Overcharge: escala × 1,15. Logar “Overcharge”. Não stackar duas vezes. |
| DEF S | O primeiro golpe da batalha que causaria ≥ 25% da vida máxima é reduzido em 35%. Uma vez. Flag `heavyGuardUsed`. |
| EVA S | Esquiva de ataque direcionado arma `counterReady`. A próxima carta desta criatura no round ganha +15 de iniciativa. Se não houver carta, o bônus espera a primeira carta do round seguinte e então se consome. Não dá carta grátis. |
| STA S | Status aplicado usa a tabela evoluída (config, não texto de carta). |

Tabela evoluída (STA ≥ S), uma linha por status, em config:

- Burn: o tick também danifica escudo em 50% do dano do tick.
- Poison: +1 de pilha na aplicação (teto existente de status).
- Shock: se o alvo for agir neste round depois deste status, a ação dele perde 10 de iniciativa. Não salta o turno.
- Stun: duração não passa do que a fórmula já deu; não ganha turno extra de stun.
- Mark: o próximo dano que o alvo sofrer é +10%. Consome a marca.
- Buffs (WARD, escudo nomeado): duração +0 além da fórmula; potência do escudo mágico +10%.

Não inferir `QUICK` / `AIM` em toda carta. Hidratação de tag de breakpoint só nos casos da seção Hidratação.

## Identidade ≠ build

Dois campos, os dois visíveis.

**Identidade genética** — o que a criatura nasceu para ser. Tipologia do Genetic Power, núcleo, verbos do kit (ADR 0035). Não se recalcula quando o gene mente.

**Arquétipo detectado** — função pura dos 11 ranks. Sem RNG. Exportada pelo game-engine para ficha, batalha e, depois, conselho de cruzamento. Este comando não muda o advisor de breeding; só deixa a função importável.

Pontuação (índice 0–7):

| Arquétipo | Conta |
| --- | --- |
| Bruiser | ATK×1,4 + HP×0,8 + STA×0,6 |
| Mago | MAG×1,5 + STA×0,7 + RES×0,3 |
| Caçador | PREC×1,2 + SPD×1,0 + ATK×0,5 |
| Tanque | HP×1,2 + DEF×1,0 + RES×0,8 |
| Crítico | CRIT×1,3 + CDMG×1,2 + PREC×0,4 |
| Evasivo | EVA×1,3 + SPD×0,8 |
| Controlador | STA×1,2 + MAG×0,5 + SPD×0,3 |

Maior pontuação = arquétipo atual. Segundo = potencial secundário. Empate: preferir o que casa com a tipologia genética.

Adjetivo de elemento da espécie (Elétrico, Ígneo, …) cola no nome: “Bruiser Elétrico”.

Fraqueza: se a tipologia pede um gene e esse gene está em D ou pior, mostrar a linha. Mapa mínimo:

| Tipologia | Gene esperado |
| --- | --- |
| CRITICAL | CRIT |
| SPEED | SPD |
| TANK | DEF (se DEF ≥ HP) senão HP |
| BURN, POISON, BLEED, CONTROL | STA |
| SHIELD | DEF |
| HEAL, SUSTAIN | MAG |

Texto de ficha, exemplo fechado:

> Identidade genética: Núcleo de Precisão (função Crítico).
> Arquétipo atual: Bruiser Elétrico.
> ATK S · HP A · STA S
> Potencial secundário: Caçador.
> Fraqueza genética para Crítico: CRIT E.

Proibido apresentar “Função: Crítico / estilo precisão letal” como se fosse a build quando o gene desmente. A função pode continuar, rotulada como identidade, com a fraqueza ao lado.

Os três genes do topo do arquétipo entram na linha (não só o nome).

## Gramática da carta

Toda carta nova, e todo overlay de leitura, tem:

domínio + custo de energia + velocidade + escala (ou “sem dano”) + efeito principal + interação genética ou de recurso.

Regra de texto:

- Comum (G1–G5): 1 efeito principal + 1 interação.
- Forte (G6–G8): 2 interações.
- G9 Assinatura e G10 Suprema: podem quebrar uma regra (terceira interação, ou ignorar custo/velocidade/alvo uma vez). Não as duas.

Profundidade é interação, não parágrafo. Overlay de leitura cabe em quatro linhas.

Campos:

```ts
type CardSpeed = "VERY_FAST" | "FAST" | "NORMAL" | "HEAVY";
type CardDomain = "PHYSICAL" | "MAGIC" | "HYBRID" | "UTILITY";

type GenomeCardProfile = {
  domain: CardDomain;
  speed: CardSpeed;
  flat?: number;
  scale?: number;
  healScale?: number;
  shieldScale?: number;
  shieldPctOfHp?: number;
  tags?: Array<
    "INEVITABLE" | "AIM" | "PERFECT_AIM" | "PREDATOR" | "QUICK" | "OVERCHARGE" | "GUARD_BREAK"
  >;
};
```

### Modelos (não são cartas a gerar neste comando)

**Brasa Ardente** — Mágico · 1 Energia · Rápida. `8 + 70% MAG`. Aplica 2 Queimadura por 2. Interação: se o alvo já queima, +1 Calor. STA escala a Queimadura.

**Caçada Voltaica** — Físico · 2 Energia · Rápida. `14 + 100% ATK`. Interação 1: se PREC > EVA, aplica Marcado. Interação 2 (assinatura, pode quebrar a regra): com 2+ Faíscas, consome 2 e golpeia de novo a 50%. Crítico: +1 Faísca. ATK S nesta carta assusta. ATK C na mesma carta não.

**Cinzas Vivas** — Mágico · 2 Energia · Normal. Dano de MAG em todos os inimigos. Cada alvo queimando dá escudo baseado em MAG. Se estiver em FRONT, escudo +30%. Calor 3: consome o Calor e prolonga Queimadura em +1. Isto é carta forte/assinatura (mais de duas interações) — só cabe em G9/G10.

**Passo Incandescente** — Utilidade · 1 Energia · Muito Rápida. Ganha iniciativa (esta carta é Muito Rápida; não é turno extra). Próximo ataque +20 pontos de precisão. Se agir antes do alvo, aplica 1 Queimadura. Interação de breakpoint: se SPD ≥ A, compra 1 e descarta 1.

Esses quatro textos são a régua. Carta que só diz “Causa 10 de dano” não entra no grimório novo.

## G1–G10

Chaves e papéis de ADR 0021 / 0035 permanecem. Não migrar locus. Camada de função Genome V2, para kit **novo** e para o overlay:

| Slot | Função Genome V2 | Texto | Velocidade típica |
| --- | --- | --- | --- |
| G1–G3 | Motor | 1 + 1 | Normal; G2 de mobilidade pode ser Rápida |
| G4–G5 | Anatomia, se houver parte visual; senão defesa/utilidade como hoje | 1 + 1 | Normal |
| G6–G7 | Elemento e estilo | 2 interações | Normal ou Pesada no elemento; Rápida no estilo |
| G8 | Defesa ou reação | 2 interações | Muito Rápida se for reação |
| G9 | Assinatura | pode quebrar uma regra | Rápida |
| G10 | Suprema | pode quebrar uma regra, uma vez por batalha | Normal ou Pesada |

Anatomia vira carta só em kit não selado:

| Parte | Pode gerar |
| --- | --- |
| Crystal Spines / espinhos | escudo, espinhos, reflect, crystal armor |
| Cauda curva | sweep, trip, pull |
| Asas | flight, evade, dive |
| Cabeça predadora | execute, hunt, bite |

Kit selado: a parte continua visual. Não gerar G4 novo por cima do snapshot.

## Hidratação (kit selado)

O resolver anexa perfil na hora de jogar. `playableWithTiming` hoje devolve a carta igual — este comando faz ele anexar domínio, velocidade e escala fallback. Snapshot no banco não muda. Hash do kit não muda.

Domínio, se o perfil não veio na carta:

1. Tag explícita `PHYSICAL` / `MAGIC` / `HYBRID` / `UTILITY` ganha.
2. Senão, o infere atual: elemento fogo/água/natureza/elétrico → `MAGIC`; outro dano → `PHYSICAL`; sem dano → `UTILITY`.
3. Híbrido não se infere. Só se a carta declarar.

Velocidade, se não veio na carta:

| Condição | Velocidade |
| --- | --- |
| tipo REACTION, locus G7, tag COUNTER | Muito Rápida |
| tag IMPETUS, MOBILITY, DODGE, INTERCEPT | Rápida |
| locus G10 ou tipo ULTIMATE | Pesada |
| resto | Normal |

Tags de breakpoint em kit selado, só isto:

- G2 com verbo de identidade DODGE / FLIGHT / LEAP → `QUICK` (SPD A passa a valer nesta carta).
- G1 de identidade predador → `AIM`.
- `PERFECT_AIM` não se carimba em toda carta. Só se a carta já tem `AIM` e o atacante tem PREC ≥ S.
- Overcharge de MAG S aplica em domínio `MAGIC` sem tag extra, limitado a ×1,15, uma vez por golpe.

Texto de UI pode mostrar a leitura computada (“Mágico · 1 Energia · Normal — 10 + 35% MAG”) ao lado do texto legado. Não gravar essa leitura no snapshot.

## Economia, posição, recurso, reação

Energia paga a carta, como hoje. Timeline não custa energia.

FRONT / MIDDLE / BACK permanecem. Condição “se estiver em FRONT” lê o slot. MIDDLE não conta como FRONT nem como BACK.

Recurso pessoal não muda de regra. Cartas novas podem ler e consumir. Signature/Supreme continuam os sumidouros (ADR 0036).

Reação permanece no slot e nas janelas V2.3. EVA S não cria um segundo slot; só antecipa a próxima carta própria.

## Logs que o jogador precisa ler

Uma linha cada. Sem parágrafo.

- `Kyrun (SPD C) · Caçada Voltaica (Rápida) age antes de Brynix (SPD A) · Labareda (Pesada).`
- `Errou. Precisão D contra Evasão S (80%).`
- `Acertou. Precisão S contra Evasão C (97%).`
- `18 + 110% MAG → 42, RES −11 → 31.`
- `Crítico (14% · ×2,10 CDMG S) → 65.`
- `Queimadura 2 por 3 (STA S contra RES C).`
- `SPD S: +15 de iniciativa na primeira carta.`
- `Overcharge (MAG S).`
- `Guarda quebrada (ATK S).`
- `Esquivou. Janela de contra aberta (EVA S).`

`damageBreakdown` ganha `domain`, `hitChance`, `missed`, `scale`, `critMultiplier`, `statusPotency`. Cliente não recalcula.

## Fases do comando (um PR, nesta ordem)

Não fazer a fase 4.

**Fase 1 — fórmulas no golpe.** Config `genomeV2`. Ranks na unidade. Acerto, domínio, CDMG, STA/RES, breakpoints numéricos, logs. Timeline ainda pode ser a fila atual, mas cada carta já carrega velocidade e a linha de iniciativa aparece mesmo que o round ainda seja alternado. Testes de número de dano que quebrarem são corrigidos para a fórmula nova, não para o número antigo.

**Fase 2 — round simultâneo.** Dois confirmam, uma timeline, preview com fantasma Normal, lock e revelação, depois resolve. Janelas V2.3 no impacto. SPD não cria segunda ação (teste explícito).

**Fase 3 — leitura.** `detectCombatArchetype`. Ficha e HUD de batalha separam identidade e arquétipo. Overlay de carta (domínio, velocidade, escala) sem gravar no kit. Timeline visível.

**Fora — fase 4.** Reescrever grimório, gerar Brasa Ardente de verdade, anatomia em kit novo, conselho de breeding. Outro comando, outro ADR se a gramática mudar.

## Arquivos

Config e tipos:

- `packages/config/src/combat.ts` — bloco `genomeV2` (bônus de velocidade, acerto, CDMG, mitigação 0,25, escalas default, breakpoints, status evoluído).
- Tipo `GenomeCardProfile` ao lado do perfil de resolução, não um segundo sistema paralelo.

Engine:

- `packages/game-engine/src/stats/derive.ts` — expor ranks (PREC, EVA, CDMG, STA, e os outros) junto dos números já derivados. Não inventar segundo HP.
- `packages/game-engine/src/battle/create.ts` e `types.ts` — copiar ranks e flags (`heavyGuardUsed`, `spdOpeningUsed`, `counterReady`).
- `packages/game-engine/src/battle/v23/timing.ts` — `playableWithTiming` anexa domínio, velocidade e escala fallback.
- Novos, pequenos, sem arquivo de mil linhas: `battle/genome/initiative.ts`, `hit.ts`, `damage.ts`, `status.ts`, `breakpoints.ts`, `archetype.ts`.
- `reduce.ts` — o golpe chama esses módulos na ordem do pipeline. Não duplicar a fórmula no reduce.
- `v23/resolve.ts` — fase 2 ordena as jogadas confirmadas pela iniciativa.

Apresentação:

- Payload de batalha inclui timeline e o breakdown estendido.
- Ficha da criatura usa `detectCombatArchetype`. Web não recalcula por conta própria se o servidor já mandou; a função compartilhada existe para preview local e teste.

Testes obrigatórios:

1. SPD C + Rápida age antes de SPD A + Pesada (mesma base 80).
2. As duas em Normal: maior SPD age primeiro.
3. SPD não adiciona segunda ação no round.
4. PREC = EVA → 0,90. PREC S vs EVA C → ≥ 0,97. PREC D vs EVA S → 0,80. Inevitável não rola.
5. Dano mágico usa RES, não DEF. Dano físico usa DEF, não RES. Híbrido usa os dois.
6. CDMG S multiplica mais que CDMG C. Chance continua a do CRIT.
7. STA S aumenta potência de Burn contra RES C e soma duração se a folga de ranks ≥ 2.
8. DEF S reduz o primeiro golpe pesado uma vez só.
9. Arquétipo Bruiser com ATK S, HP A, STA S, mesmo se a tipologia for CRITICAL; fraqueza cita CRIT E.
10. Snapshot de kit selado idêntico antes e depois. Resolver mesmo assim aplica domínio.
11. Mesma seed, mesmo log.

## Critério de pronto

Um jogador, sem abrir ficha de gene, distingue na luta: quem age antes, quem erra o evasivo, quem machuca com golpe físico, quem machuca com magia, e por que o crítico de uma criatura assusta e o de outra não. A Kyrum com ATK S numa carta física assusta. A mesma carta num Sparkyn de ATK C não. A Brynix ATK E / MAG A é maga. A ficha não chama de crítico quem tem CRIT E sem dizer que isso é fraqueza.

O grimório continua o antigo, com leitura nova por cima. Cartas novas só depois deste critério.
