# Geração visual por IA — GENORYX: Genesis

A IA é o **renderizador visual do DNA**. O resultado genético existe **antes** da imagem. A imagem nunca determina BODY, HEAD, EYES, HORNS, ELEMENT, MUTATION, STATS, CARDS, RARITY, GENERATION, PARENTS, FERTILITY, TEMPERAMENT ou LIFE STAGE.

```
BREEDING ENGINE → DNA DO FILHO → VISUAL DNA → PROMPT CANÔNICO
  → GPT IMAGE → ARTE OFICIAL → STORAGE → GENESIS CERTIFICATE → NFT
```

ADR: `0015`. Art Bible: `docs/ART_BIBLE.md`. Web3: `docs/WEB3.md`.

Se a imagem adiciona um terceiro chifre, remove uma asa, troca a cauda ou a cor: **arte inválida**. Regenerar arte. **Nunca** alterar o genome para “ficar bonito”.

---

## 1. Modelo e segredo

- Alias: `gpt-image-2`
- Snapshot de produção (pin): `gpt-image-2-2026-04-21`
- Config **única**: `OPENAI_CREATURE_IMAGE_MODEL` (não espalhar model ID)
- Chave: `OPENAI_API_KEY` só no backend/worker
- Provider: `CREATURE_IMAGE_PROVIDER=mock|openai` (CI = mock)

Proibido: frontend, Phaser, bundle Next, `NEXT_PUBLIC_*`, localStorage, metadata NFT, logs de header/key.

---

## 2. Visual DNA

Objeto canônico `CreatureVisualGenome` (expresso + recessivo onde couber). O prompt recebe **somente** expressos, via `buildCreatureImagePrompt(spec)` — recessivos só em modo admin explícito.

Campos mínimos: speciesKey, bodyPlan, headType, eyeType, hornType, frontLimbs, rearLimbs, tailType, backTrait, patternType, auraType, skinType, materialType, cores hex, temperament, mutationType, mutationIntensity, sizeGene, lifeStage, visualTags[], visualSeed.

`visualSeed` é gerado uma vez (derive `creatureId + geneticHash` via hash do engine, nunca `Math.random` no client). Não altera gameplay. Distingue clones.

Cartas: `CardDefinition.visualTags[]` → spec → prompt. Sem tag = sem alteração visual.

Versões gravadas em todo asset: `artBibleVersion`, `visualGenomeVersion`, `promptVersion`, `imageModel`, `imageModelSnapshot`, `generationKey`, `generatedAt`.

---

## 3. Prompt builder

`CreaturePromptBuilder` é determinístico. Entrada: `CreatureVisualGenerationSpec`. Saída: string. Dicionários em `@nexora/config`. **Nenhum LLM escreve o prompt.**

Seções: identity → life stage → anatomy → face → appendages → surface → colors → mutation → temperament → art bible → composition → forbidden.

Pais: “Parent images are lineage references only. Do not inherit any visual trait that is not present in the provided child genome.”

Young/Adult: “this is the same individual creature at a later life stage.”

---

## 4. Jobs, idempotência, retry

Status do asset: PENDING → GENERATING → VALIDATING → READY | FAILED | FAILED_REVIEW.

`generationKey` = SHA-256(creatureId + lifeStage + geneticHash + visualSeed + visualGenomeVersion + artBibleVersion + promptVersion + provider + modelSnapshot).

MOCK e OPENAI nunca colidem. O visual canônico de produção prioriza `OPENAI + READY` sobre `MOCK + READY`. Mocks antigos ficam só como fallback temporário da coleção. Genesis Reveal, com provider `openai`, nunca mostra mock.

Mesma chave = reutilizar. Retry acidental não cria outro indivíduo.

OpenAI caiu: criatura existe, placeholder “Genesis is forming…”, retry exponencial (1m / 5m / 15m, config). Breeding **não** reverte.

Máximo 2–3 regenerações de QA. Depois FAILED_REVIEW (fila admin). Sem loop de custo.

Eventos que enfileiram: HATCH, EVOLVE_TO_YOUNG, EVOLVE_TO_ADULT, ADMIN_RETRY. Sem endpoint público de regenerate.

---

## 5. QA

Modelo multimodal confronta a imagem com o spec. Campos: bodyPlanMatch, headMatch, eyeMatch, hornMatch, limbsMatch, tailMatch, backMatch, patternMatch, colorsMatch, temperamentMatch, mutationMatch, lifeStageMatch, extraUnexpectedTraits, missingTraits, overallScore.

Aceite: `overallScore >= 0.90` e nenhum erro crítico (body errado, número de membros, asas a mais/menos, horn/mutation/stage errados, cores drásticas).

---

## 6. Storage e hashes

GPT Image → bytes → validação → object storage (local agora; S3/R2/MinIO depois) → URL/key + `imageHash` → banco.

Não guardar base64 no Postgres. NFT público (IPFS/Arweave) é decisão Web3 futura — não misturar com storage operacional.

- `geneticHash` = quem a criatura é. Imutável após o nascimento. Imagem não recalcula.
- `imageHash` = qual arquivo representa aquela fase.

---

## 7. Life stages e NFT

Não mintar NFT por fase. Mesmo token. Ao evoluir: atualizar lifeStage, asset e metadata (quando o contrato existir).

Creature nasce no domínio do jogo **antes** da chain. Placeholder se a IA atrasar. Gameplay não bloqueia.

Metadata pública: só genes **expressos**. Recessivos ficam server-side (futuro Genetic Scan / DNA Reveal exige ADR).

Rarity visual ≠ poder de combate.

---

## 8. Genesis Certificate

Creature ID, tokenId (quando houver), species, generation, lifeStage, birth, breeder, father, mother, body/head/eyes/horns/tail/back/pattern, mutation, temperament, geneticHash, 10 cartas expressas. Histórico de torneio depois.

---

## 9. Ordem de implementação

1. documentação  
2. tipos VisualGenome  
3. PromptBuilder  
4. abstração de provider  
5. Mock  
6. OpenAI  
7. CreatureVisualAsset  
8. fila  
9. storage  
10. baby  
11. QA  
12. Young  
13. Adult  
14. metadata NFT  

Primeira entrega: genome → baby → storage → DB → coleção. Sem mint.

## 9b. Resolve, backfill e Genesis Reveal

A coleção **não** escolhe a imagem. O backend devolve `visual: { status, lifeStage, url, imageHash }` via `resolveCreatureVisual()`:

1. `OPENAI + READY` do **lifeStage atual**
2. `MOCK + READY` temporário (coleção; nunca no Genesis Reveal)
3. último READY válido de estágio anterior, se permitido (ADULT→YOUNG→BABY)
4. compositor modular legado
5. placeholder `Genesis is forming...`

Criaturas com MOCK READY ainda precisam de OpenAI: script `generate-openai-creature-visuals` (`--proof` primeiro; batch só depois da aprovação visual). Concorrência 2.

URL canônica leva `?v={imageHash}` para não ficar presa no cache.

Criaturas antigas sem asset: script `apps/api/scripts/backfill-creature-visuals.ts`. Idempotente. Não cria Creature, não mexe em `geneticHash`/genes, não duplica `generationKey`. Concorrência: `CREATURE_VISUAL_GENERATION_CONCURRENCY` (Alpha: 2).

Storage local: `CREATURE_IMAGE_STORAGE_DIR` (default `var/creature-visuals` na raiz do monorepo). Na VPS o volume `creature_visuals:/app/var/creature-visuals` sobrevive a rebuild.

Breeding/hatch **não** espera OpenAI. O filhote nasce com `revealStatus=PENDING_VISUAL`. Quando a arte fica READY: `READY_TO_REVEAL`. O jogador assiste o Genesis Reveal e confirma: `REVEALED`. Criaturas existentes e starters: `REVEALED` / `NOT_REQUIRED` — sem animação retroativa.

`REVEALED` é estado de UX. Não é ownership. NFT futuro pode mintar após a arte canônica existir, sem exigir que o jogador tenha assistido a animação.

Enquanto `PENDING_VISUAL` ou `READY_TO_REVEAL`: sem retrato na coleção, sem market, sem novo breed, sem recessivos no payload de reveal.

Prova de conceito (antes de gerar em massa): 3 genomes (Friendly / Feral / Abyssal baby) → Young → Adult = 9 imagens com continuidade. Se não parecer o mesmo indivíduo, ajustar Art Bible/prompt — **nunca** o DNA.

---

## 10. Testes obrigatórios

Prompt idêntico para o mesmo genome; recessivos fora; stage A não sobrescreve stage B; generationKey idempotente; timeout OpenAI deixa Creature válida; retry não duplica asset; falha de imagem não rollback breeding; baby→young e young→adult = mesmo id; geneticHash estável; prompt tem todos os traits expressos e nenhum não-expresso.
