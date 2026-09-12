# Art Bible — GENORYX: Genesis

Versão: **2**. Qualquer mudança desta linguagem incrementa `artBibleVersion` em `@nexora/config`.

Referência canônica do **fenótipo e da arte de criatura**. Toda arte oficial (IA, compositor de fallback, cartas, market) respeita este documento.

Experiência do World (câmera, Haven, biomas, combate no chão): `docs/VISUAL_DESIGN.md` (ADR 0026). Humanos e NPCs: `docs/CHARACTER_ART.md`. Este bible manda no DNA; aqueles mandam no mundo e no tamer.

A IA **não decide genes**. Ela representa o DNA que o servidor já calculou. Se a imagem inventar um chifre, remover uma asa ou trocar a cauda, a arte é inválida — o DNA não muda.

---

## 1. Direção

GENORYX é um **fantasy creature collector original**.

- Criaturas altamente colecionáveis
- Formas estilizadas, anatomia simplificada
- Silhuetas fortes, leitura clara em miniatura
- Acabamento premium, personalidade forte
- Espectro: fofas, nobres, ferozes, estranhas, monstruosas

Não perseguir realismo. Não gerar anatomia seca ou esquelética sem gene que peça isso. Não copiar personagens, criaturas ou assets de outros jogos. A inspiração é o gênero monster collector; a identidade é própria.

---

## 2. Shape language

### Cabeça

Levemente maior que em animais realistas — principalmente em jovens. É a área de expressão, identidade e colecionabilidade.

### Corpo

Compacto e legível. Evitar torso excessivamente magro, anatomia hiper-realista, músculos pequenos e excesso de articulações.

### Membros

Formas simples mesmo em Raptor, Mantis, Heavy ou Exotic. Identificáveis numa miniatura.

### Silhueta

Reconhecível só pelo contorno: cabeça, chifres, asas, costas, cauda, body plan.

### Detalhes

Grandes e relevantes. O jogador precisa ver diferenças na coleção, nas cartas, no market e no PvP. Evitar dezenas de microdetalhes.

---

## 3. Temperamento (expressão visual)

Gene hereditário `Temperament`. Influencia expressão. **Não** define personalidade narrativa sozinho. **Não** dá bônus de stats nesta versão.

| Valor | Expressão |
| --- | --- |
| FRIENDLY | Linhas arredondadas, olhar suave, postura curiosa, boca relaxada. Ainda é criatura de batalha — não vira bebê automático. |
| NOBLE | Postura confiante, formas elegantes, simetria um pouco maior, olhar calmo, majestade. |
| WILD | Postura energética, expressão intensa, silhueta dinâmica, assimetria leve. |
| FERAL | Olhar predatório, dentes e garras mais evidentes, postura de ataque. |
| MENACING | Peso visual maior, expressão intimidante, sombras faciais fortes, estruturas agressivas. |
| ABYSSAL | Estranho de propósito: assimetria controlada, formas incomuns, alienígena. **Nunca** significa arte ruim. |

---

## 4. Life stages (mesmo indivíduo)

EGG → BABY → YOUNG → ADULT. Mesmo Creature ID, geneticHash, tokenId futuro, pais e geração. Só `lifeStage` e a arte mudam.

- **EGG** — sugere genética (cores, pattern simples, aura sutil, hint de mutação/elemento). Não mostra HEAD/EYES/HORNS completos, cartas ou stats.
- **BABY** — cabeça ~35–45% mais dominante; torso compacto; membros curtos; patas um pouco maiores; olhos expressivos. Horns/wings/tail do gene certo, menores. Mutação já existe, mais sutil.
- **YOUNG** — intermediário. Identidade imediatamente reconhecível. Traits crescendo, não redesenhados.
- **ADULT** — expressão completa do DNA. Adulto **não** significa gigante, agressivo ou musculoso. Friendly adulto continua amigável.

Continuidade: BABY primeiro; YOUNG usa BABY como referência; ADULT usa YOUNG (e opcionalmente BABY). Prompt: *this is the same individual creature at a later life stage.*

---

## 5. Anatomia canônica (domínio)

O prompt descreve o **BODY manifestado**. Nunca inferir pelos pais.

Body plans (enum de jogo; `GOLEM` no domínio = golem colossal no prompt):

QUADRUPED, BIPED, SERPENT_WYRM, FLOATING, HUMANOID_BEAST, AVIAN, ARACHNID, GOLEM, AMPHIBIAN, ABYSSAL, CENTAUROID, INSECTOID_BIPED.

Heads (enum → linguagem da bible): DRACONIC; BEAST → beast predator; SERPENT → serpent aerodynamic; EXOTIC → exotic abyssal.

Eyes: PREDATOR, ARCANE, VOID, CRYSTAL, GENESIS.

Horns: DRACONIC, PREDATOR, CURVED_RAM, CROWN, CRYSTAL_GENESIS, NONE.

Front limbs: CLAWED, HEAVY_GUARDIAN, RAPTOR_AGILE, MANTIS_BLADE.

Rear limbs: BALANCED, RAPTOR_SPRINTER, HEAVY_COLOSSAL, LEAPER_EXOTIC.

Tail: PREDATOR, HEAVY_CLUB, BLADE, SERPENT_TENTACLE, GENESIS_SPLIT, NONE.

Back: DORSAL_SPINES, DRACONIC_WINGS, FEATHERED_WINGS, SHELL_CARAPACE, NONE.

Pattern: STRIPES, SPOTS, RUNES, CRACKS, ENERGY_VEINS, GENESIS, NONE.

Aura: EMBER_FIRE, ELECTRIC_PLASMA, VOID_ARCANE, GENESIS, NONE.

Material (separado da anatomia): SOFT_SKIN, FUR, SCALES, CHITIN, STONE, CRYSTAL, PLANT, ETHEREAL.

Cores hex obrigatórias: `primaryColor`, `secondaryColor`, `accentColor`, `eyeColor`. Variação de luz ok; identidade cromática não.

---

## 6. Mutação visual

Gene separado: NONE, PLASMA, MAGMA, VOID, ANCIENT. Intensidade: LOW, MEDIUM, HIGH (quanto a mutação **aparece**, não força).

- **PLASMA** — linhas de energia, detalhes elétricos, olhos mais intensos. Não pintar o bicho de azul inteiro.
- **MAGMA** — fissuras, placas, brilho interno localizado.
- **VOID** — formas um pouco incomuns, áreas escuras, olhos estranhos, assimetria controlada.
- **ANCIENT** — estruturas majestosas, padrões ancestrais, placas/chifres elaborados.

Calculado **antes** da geração. A imagem só manifesta o que o Visual DNA já fechou.

---

## 7. Recessivos e cartas

A imagem mostra só o **expresso**. Recessivos ficam no breeding engine.

As 10 cartas **não** mudam arte por padrão. Só entram `visualTags` declarados em `CardDefinition`. A IA nunca interpreta o nome da carta.

---

## 8. Composição oficial

Retrato de coleção: criatura inteira, vista 3/4, fundo neutro, sem texto, UI, logo, armas ou roupa humana (salvo gene explícito). Uma criatura coerente, não peças coladas.

Pais e Art Bible master são **referência de linhagem**. Genes do filho sempre vencem: *Do not inherit any visual trait that is not present in the provided child genome.*

Irmãos nunca compartilham a mesma imagem. Gêmeos genéticos ainda têm Creature IDs e `visualSeed` distintos.

---

## 9. Referências mestres

`assets/art-bible/references/` — Pyron, Nympha, Florune em BABY / YOUNG / ADULT e exemplos FRIENDLY / WILD / MENACING / ABYSSAL. Mantêm shape language, luz, material e proporção.

O compositor PNG do Alpha é fallback de gameplay, não a arte canônica.

---

## 10. Battle vs coleção

Portrait de coleção ≠ sprite de combate. A primeira versão pode usar o retrato como token. Animação/VFX não bloqueiam genética nem NFT.

---

## 11. CARD ART

Versão da linguagem de carta: `cardArtVersion` em `@nexora/config` (`cardArtGenerationConfig`). **Não** incrementa `visualGenerationConfig.artBibleVersion` — senão todas as criaturas regenerariam arte.

A IA gera **somente a ilustração**. Moldura, nome, custo, G1–G10, tipo, elemento, descrição, ícones, raridade e hover são do frontend GENORYX.

Todas as ilustrações de carta pertencem ao mesmo universo visual das Creatures.

Características:

- fantasy
- colecionável
- colorido
- premium
- ação clara
- composição forte
- formas grandes
- leitura fácil em carta pequena
- efeitos mágicos expressivos
- sem cenário excessivamente detalhado
- sem interface
- sem moldura
- sem texto

As cartas devem parecer parte do GENORYX. Não copiar cartas nem composição visual de jogos existentes.

### Proporção

Preferir composição central em **1024 × 1024**. O frontend corta/adapta para a janela da carta. Personagem/efeito principal no centro, margem segura, nada essencial nas extremidades.

### Proibido na imagem

NO TEXT. NO LETTERS. NO NUMBERS. NO CARD FRAME. NO UI. NO LOGO. NO WATERMARK.

O nome e a descrição ficam fora da imagem. Números de balanceamento **não** entram no prompt nem na `generationKey`. Mudar 12 → 14 de dano **não** regenera arte.

### Tipos de ilustração

| Tipo | Linguagem |
| --- | --- |
| ATTACK | Composição dinâmica: impacto, golpe, projétil, mordida, elemento. |
| SKILL | Mais mágica/técnica: buff, heal, shield, control, utility. |
| REACTION | Ação instantânea: bloqueio, contra-ataque, barreira surgindo, esquiva. |
| ULTIMATE | Mais grandiosa: energia, escala, luz dramática — ainda legível em thumbnail. |
| TACTIC | Plano/campo, sem virar minimapa ou UI. |
| GENETIC | Identidade do gene, não ficha de laboratório. |
| EQUIPMENT | Relíquia/arma natural, sem inventário. |
| CHARACTER | Personagem/assinatura, sem retrato de jogador. |

SIGNATURE (G9) usa identidade da espécie com mais força. ULTIMATE (G10) é o maior impacto do kit.

### Elementos

Cada elemento tem identidade visual. **Não** pintar a carta inteira de uma cor.

| Elemento | Vocabulário |
| --- | --- |
| NATURE | Folhas, raízes, trepadeiras, pólen, flores, crescimento orgânico, energia verde/dourada |
| FIRE | Chamas, brasas, calor, cinzas, formas explosivas |
| WATER | Fluxos, ondas, gotas, espirais, reflexos |
| ELECTRIC | Arcos, plasma, linhas rápidas, energia concentrada |
| VOID | Escuridão, fragmentos, energia incomum, distorção controlada |
| ARCANE | Formas mágicas, energia limpa, símbolos abstratos **originais** |

### Criatura na carta

Algumas cartas mostram uma ação da Species (referência canônica ou Creature aprovada). Ex.: Chicote de Trepadeira pode mostrar uma Florune comandando a trepadeira. **Nunca** a Creature NFT específica do jogador.

Cartas genéricas podem ilustrar só o efeito, a planta, a energia ou a arma natural.

Recessivo **não** gera arte própria só por ser recessivo. Mesma família expressa = mesma arte. Recessivo oculto **não** aparece na carta de batalha.

Variante mecânica (`cardDefinition + variant`) pode ter arte própria (ex. `FLAME_FANG` vs `PLASMA_FANG`). Mutação que cria variante **não** altera a arte da carta-base. SynergyDefinition tem arte própria, não por Creature.

A arte pertence à definição/variant. 10.000 criaturas com `FLAME_FANG` reutilizam **uma** arte.
