# Grimório — Content Pass V2

Data: 2026-09-14  
Versão: `gxr-content-v2`  
Deploy Alpha: **não** (aguardando revisão)

## Objetivo

Refinar deterministicamente efeitos das cartas seladas (G1–G10) para identidade tática, sinergia e counterplay — sem reroll de kits, IDs, linhagens ou genética. Combat Genome V2 permanece; não há segundo resolver. Card Face aprovada permanece limpa (máx. 3 batidas na face).

## Mecânica

`packages/game-engine/src/cards/content-pass.ts` via:

- `kitToDefinition` / `kitCardsToDefinitions` (genes, anatomia, quirks, verbs)
- `collectCreatureManifestations` (deck/batalha)
- `presentKitCards` (API / grimório)

Snapshot selado no locus intacto; leitura e resolução usam a ficha refinada.

Relatório machine-readable: `docs/grimoire-content-pass-report.json`  
Regenerar: `npx tsx src/cards/content-pass-audit-run.ts` em `packages/game-engine`.

## Auditoria completa

| Métrica | Valor |
| --- | ---: |
| Cartas auditadas | **1200** (120 kits × 10) |
| Alteradas | **833** |
| Mantidas | **367** |

### Problemas antes do refine (top)

1. Escudo puro sem diferenciação (120)
2. `require ≠ consume` (9)
3. Nome de descarga sem dano (8)

### Tipos de mudança (top)

anti-redundância, ciclos Burn/Shock/Poison, Retorno TRIGGER, counterplay cleanse/GUARD_BREAK, alinhamento de recurso, gene STA/PREC/SPD, anatomia só quando o **nome** conversa com o verbo.

## BEFORE → AFTER (amostra)

| Carta | Antes | Depois |
| --- | --- | --- |
| Descarga Elétrica | Energia +1 | Dano elétrico + Energia se Shocked (FAST, MAGIC) |
| Véu vs Guarda 18/19 | Escudo quase idêntico | Support FAST+cleanse vs Tank FRONT |
| Marca … | Só Burn | Marked + pressão elemental |
| Mordida … | Dano elemental | PHYSICAL + status |
| Pulso … | require 1 / consome 2 | require=consume; energia; escudo FRONT |
| Retorno … | Dano/escudo ambos condicionais | TRIGGER: Escudo; payoff se status |
| Labareda/Brasa | Só dano | Aplica Burn; +recurso se já Burning |
| Pressão genérica ×3 | Mesmo padrão | Setup / FAST condicional / HEAVY finisher |

## Showcase — Kyrum · Brynix · Doron

Kits selados por seed fixa; genes patched só para leitura Genome/content-pass (sem reroll de nomes).

| | Kyrum | Brynix | Doron |
| --- | --- | --- | --- |
| Arquétipo | Precision / Finisher | Burn / Magic Pressure | Frontline / Bruiser |
| Espécie | sparkyn | pyron | terranox |
| Genes-chave | ATK S · PREC A | ATK E · MAG A · SPD A · STA A | ATK A · DEF S · HP S · SPD D |
| Ciclo | Mark/Shock → pressão → execute | Burn/Calor → prolonga → burst | Foundation físico → Guard FRONT → reação |

### Composição trio (checklist)

Todos verdadeiros:

- frontline · setup · pressão · finisher · reação  
- combo entre aliados (Burn + Marked/Shock)  
- resposta do adversário (cleanse / GUARD_BREAK)  
- timing FAST vs HEAVY · alvo condicional · recurso  

Estados compartilhados observados: `BURN`, `SHOCK`, `MARKED`, `STUN`, `CRACKED`.

## Combos (estados, não “se Brynix”)

- Burn: aplicar → punir Burning → gastar Calor  
- Shock: aplicar → punir Shocked → recuperar Energia  
- Marked: Marca/PREC → payoff em finishers  
- Guard: escudo FRONT ↔ tag GUARD_BREAK  
- Posição FRONT / Timeline FAST–HEAVY

## Counters

- Escudo + cleanse em carta defensiva do kit com status  
- GUARD_BREAK em pressão do kit com Guard  
- Payoffs condicionais (sem hard-counter absoluto)

## Domínio / velocidade / genes

- Corporal → PHYSICAL; elemental ofensivo → MAGIC; utilitário → UTILITY  
- Reaction VERY_FAST; ritmo FAST; Prisão/Supreme HEAVY  
- Tags Genome: ATK/MAG_FOCUS, IMPETUS, MARK/HUNT, DODGE, GUARD, EXECUTE, STA_FOCUS  
- Anatomia (BREATH/FLIGHT/PULL/ROAR/GRAPPLE/CHARGE/THORNS) só com fantasia de nome alinhada

## QA

- Testes: `content-pass` (inclui auditoria 1200 + composição Kyrum/Brynix/Doron), `kit`, `deck`  
- Lint / typecheck / build web: sequenciais (sem concorrência em `.next`)  
- **Deploy Alpha: não executado**
