# GENORYX: Genesis — Game Design Document

**Frase da marca:** Cada geração muda o mundo.

**Nome de trabalho anterior:** NEXORA. Packages internos ainda usam `@nexora/*` até refatoração controlada (ADR 0012).

Este documento é a fonte canônica de design. Leia-o antes de implementar qualquer funcionalidade. Alterações de design devem atualizar este arquivo e, se necessário, um ADR em `docs/adr/`.

---

## 1. Nome do game

**GENORYX**

Nunca **NEXYROM**, Nexyrom, NEXORA (público) ou qualquer grafia próxima. NEXORA permanece só em packages internos `@nexora/*` até o refactor (ADR 0012). Marca pública: **GENORYX**.

### Nome completo

**GENORYX: Genesis**

### Domínio

`genoryx.com.br` — Alpha: `alpha.genoryx.com.br`. Jogo público (futuro): `play.genoryx.com.br`.

### Significado

GENORYX é o nome oficial. Genesis é o capítulo / universo atual.

O nome combina com um universo onde criaturas são capturadas, reproduzidas, evoluídas geneticamente e negociadas.

---

## 2. Visão geral

GENORYX é um RPG online multiplayer jogável diretamente pelo navegador.

Propriedade transferível (NFT) é decisão de produto. **Blockchain atesta posse; o servidor decide o jogo.** Detalhe: `docs/WEB3.md` e ADR 0008. Contratos **não** entram no mundo Phaser (M2).

O jogador possui:

- personagem próprio
- criaturas
- inventário
- equipamentos
- ouro
- recursos
- profissões
- propriedades
- guildas
- ranking
- histórico
- mercado

O coração do jogo é uma combinação de:

- RPG
- coleção de criaturas
- breeding
- genética
- PvE
- PvP
- economia entre jogadores
- crafting
- exploração
- progressão
- temporadas
- eventos mundiais

Inspirado conceitualmente em jogos como Pokémon, Axie Infinity, Palworld, Ragnarok, Diablo, MMO RPGs e jogos de breeding — sem copiar personagens, artes, mapas ou propriedades intelectuais existentes.

---

## 3. Grande diferencial

O sistema principal será **genética evolutiva**. Tudo se conecta pela genética.

> No GENORYX você não coleta apenas criaturas. Você cria geneticamente builds que podem não ter existido antes.

Uma criatura **não** é “Pyron modelo 02”. É um fenótipo congelado no nascimento: Genome → Expression → Combat Identity → G1–G10 (ADR 0035). BODY muda tendência. HEAD especializa. Anatomia abre vocabulário de ações, não a mesma habilidade. Duas criaturas da mesma espécie podem ser excelentes, medianas, estranhas ou ruins — todas jogáveis, sem 15 vs 150 de dano.

Recurso pessoal (HEAT, FOCUS, RAGE…) **não** tem regra global. Nasce da Combat Identity daquela criatura: como ganha, o teto, o que destrava, o que consome e o que arrisca. Duas criaturas com Calor podem jogar de formas opostas (ADR 0036). Status (Burn, Wet) e reações (Magma, Conductive) são outra camada.

O BODY muda tendência de atributo. A HEAD especializa. EYES e HORNS refinam. Os 10 genes determinam cartas. O breeding recombina tudo. Mutações quebram padrões. A composição de três criaturas ainda pode gerar **cartas de sinergia que não existiam no catálogo individual**.

Isso é além de “Axie com breeding”. Dois monstros da mesma espécie podem ser completamente diferentes.

Exemplo de ficha (não um template visual):

### Pyron #4821

| Campo | Valor |
| --- | --- |
| Espécie | Pyron |
| Elemento | Fogo |
| DNA | ATK: S · DEF: B · HP: A · SPD: A · CRIT: C · MAG: B |
| Gene dominante | Chamas Carmesim |
| Gene recessivo | Tempestade |
| Mutação | Nenhuma |
| Pureza genética | 87% |

A ficha jogável (Alpha) é presentation-first: o modelo 3D READY ocupa o hero; o retrato 2D canônico fica nos cards. Abas: Overview, Genetics, Cards, Lineage, History, NFT. Presença sem skeleton: ADR 0017. DNA não muda na apresentação.

---

## 3.1 Mapa mestre — 7 pilares

Canônico. ADR `0014`. O Alpha Playable Loop V1 (ADR 0013) é a **fatia fina** destes pilares, não o mapa completo.

```text
GENORYX
│
├── 1 COMBATE          roster → ban → pick → formação → deck → batalha
├── 2 GENÉTICA FÍSICA  body / head / eyes / horns / membros / cauda / pattern / asas / aura
├── 3 STATUS FÍSICOS   HP ATK DEF MAG RES SPD CRIT EVA STATUS  (soma + tetos)
├── 4 GENÉTICA CARTAS  10 loci × (expresso + recessivo)
├── 5 BREEDING         núcleo: aparência ↔ cartas ↔ status ↔ mutação
├── 6 PROGRESSÃO       Combat XP/level ≠ Maturation XP (World PvE); idade ≠ carta por cópias
├── 7 METAGAME         Torre de Poder + Torre de Guilda
│
├── EXPLORAÇÃO / PVE   mapas, selvagens, captura, dungeons, bosses
├── ECONOMIA           Gold, NEX, lojas NPC, taxas
├── MARKETPLACE        criaturas, ovos, itens, histórico
├── NFT / OWNERSHIP    posse atestada; servidor decide o jogo
└── SOCIAL             guilda, amigos, ranking, torneios
```

### Pilar 1 — Combate

Fluxo competitivo alvo (não o Alpha casual):

**Roster de 5 → ban de 1 → escolha de 3 → formação → deck → batalha.**

Cada criatura traz 10 cartas genéticas expressed. O jogador **não** usa todas. As três escolhidas montam o pool; o deck final é composição.

Arquétipos juntos geram cartas que **não existiam** no kit individual.

```text
BURN + TANK  →  FORNALHA VIVA (LIVING_FURNACE)
                carta exemplo: Armadura Incandescente (MOLTEN_ARMOR)
                ganha Shield; quem atacar o portador recebe Burn

FORNALHA VIVA + VIDA + RESISTÊNCIA  →  FORTALEZA VIVA
                cartas ainda mais especializadas, após rounds/condições
```

Composições descobertas pelos jogadores. SynergyDefinition data-driven. Alpha V1 prova FORNALHA VIVA; FORTALEZA VIVA e draft 5/ban/pick entram depois.

### Pilar 2 — Genética física

Identidade visual. Camadas planejadas:

| Camada | Catálogo inicial |
| --- | --- |
| BODY | 12 Body Plans (já no domínio) |
| HEAD | 4 (DRACONIC, BEAST, SERPENT, EXOTIC) |
| EYES | 5 (ainda não persistidos) |
| HORNS | 5 (ainda não persistidos) |
| FRONT / REAR | patas dianteiras / traseiras |
| TAIL | caudas |
| BACK | costas / asas |
| PATTERN | padrões |
| AURA | auras (ex. Plasma) |
| COLOR | cores da espécie + variação |

Exemplo de expressão (placeholder até os assets):

```text
BODY       Biped
HEAD       Draconic
EYES       Genesis
HORNS      Crystal
FRONT      Clawed
REAR       Raptor
TAIL       Double
BACK       Wings
PATTERN    Runes
AURA       Plasma
```

Alpha V1 persiste BODY + HEAD (expresso/recessivo). EYES, HORNS, membros e cauda entram no compositor visual (fallback) a partir dos assets atuais (espécie + seed) — ainda não persistidos como colunas próprias.

A arte oficial **não** é a colagem PNG. O servidor fecha o `CreatureVisualGenome` (incluindo Temperament e life stage) e um job de IA renderiza o retrato (ADR 0015, `docs/ART_BIBLE.md`, `docs/AI_CREATURE_GENERATION.md`). A IA nunca escolhe genes. Recessivos não vão no prompt.

### Pilar 3 — Status físicos

Genes de combate: **HP, ATK, DEF, MAG, RES, SPD, CRIT, EVA (EVASION), STATUS**. CRIT_DAMAGE e PRECISION continuam no modelo como refinamento.

Cada parte física adiciona **tendência**, não o resultado final.

**Regra:** nenhuma parte sozinha define a criatura. O fenótipo é a **soma genética com limites de balanceamento** (config). Impede aberração do tipo `Golem + Beast + Predator + Predator Horn` = +90% ATK.

### Pilar 4 — Genética das cartas

Sistema **separado** da aparência. 10 loci, cada um com expresso + recessivo. Detalhe §6 e ADR 0011.

Uma criatura pode usar `G9 Infernal Blood` e carregar `Storm Blood` escondido. No breed, o recessivo pode aparecer no filho.

### Pilar 5 — Breeding (núcleo)

```text
               APARÊNCIA
                  ↑
                  │
CARTAS ←──── BREEDING ────→ STATUS
                  │
                  ↓
               MUTAÇÃO
```

O filhote herda: body plan, head, eyes, horns, membros, cauda, pattern, aura, cores, atributos, 10 loci, recessivos, elemento, mutações, habilidade única (quando existir), genealogia.

Breeding não é atividade secundária. É o núcleo do GENORYX.

### Pilar 6 — Progressão (duas réguas)

**Não misturar.**

Idade da criatura (desbloqueia expressão de loci):

`Egg → Filhote → Jovem → Adulto`

| Estágio | Loci no combate (Alpha, `creatureLifeStageConfig`) |
| --- | --- |
| Filhote (BABY, nv. 1–9) | G1–G6 |
| Jovem (YOUNG, nv. 10–19) | G1–G8 |
| Adulto (ADULT, nv. 20+) | G1–G10 |

G9 = SIGNATURE e G10 = ULTIMATE só no adulto. `gateCardsByStage` está **desligado** no Alpha para não retirar G7–G10 das criaturas BABY atuais.

A idade é o **mesmo indivíduo** (mesmo Creature ID, geneticHash, NFT futuro). Só `lifeStage` e a arte mudam. Evoluir **não** rerolla genes.

**Combat XP / Level** e **Maturation XP** são eixos separados (ADR 0025). BABY não amadurece parado: precisa participar de PvE no World (party ativa, participation, diversidade, bônus de descoberta). READY_TO_EVOLVE exige level **e** maturation (`creatureLifeStageConfig` + `maturationConfig`). O jogador confirma na **Genesis Chamber** em Haven. NEX/GOLD não vendem Growth XP.

Apresentação oficial de WORLD e BATTLE: Unity (`docs/UNITY_GAME.md`). Phaser e a arena React ficam como fallback (`WORLD_RENDERER` / `BATTLE_RENDERER`, default `web`). Experiência do chão: `docs/VISUAL_DESIGN.md` e ADR 0026 — 3D estilizado, mundo contínuo, combate no cenário.

Fortalecimento por cópias **não** é `10 cópias = +30% dano` (pay-to-win). Evolução muda **mecânica** (branch):

`Flame Fang I` → escolher **Predatory Fang** / **Infernal Fang** / **Plasma Fang**.

### Pilar 7 — Metagame / mundo

O World é o lugar onde a genética ganha valor. Visual: `docs/VISUAL_DESIGN.md`.

**Torre de Poder** — PvE competitivo. Quem derrota o guardião do andar assume **Lord of Floor N**. Outro jogador pode desafiar. Disputa contínua.

**Torre de Guilda** — genética especial, breeding, buffs, laboratório, território, bônus de guilda.

Ambas ficam **depois** do loop Alpha. Não implementar agora.

---

## 4. Sistema de espécies

No lançamento inicial teremos aproximadamente **12 espécies**.

| Elemento | Espécies |
| --- | --- |
| Fogo | Pyron, Drakor |
| Água | Nympha, Aqualis |
| Natureza | Florune, Terranox |
| Elétrico | Voltaris, Sparkyn |
| Terra | Grumak |
| Gelo | Cryon |
| Sombrio | Noctyr |
| Luz | Lumera |

Cada espécie terá:

- design próprio
- atributos base
- habilidades
- possíveis mutações
- afinidades
- elementos
- genes disponíveis

---

## 5. Sistema elemental

Elementos iniciais:

- Fogo
- Água
- Natureza
- Terra
- Elétrico
- Gelo
- Luz
- Sombrio
- Arcano

### Vantagem elemental (v1)

O objetivo é evitar um círculo extremamente simples.

- Água > Fogo
- Fogo > Natureza
- Natureza > Terra
- Terra > Elétrico
- Elétrico > Água
- Luz > Sombrio
- Sombrio > Arcano
- Arcano > Luz

**Pendente de balanceamento:** Gelo ainda não possui vantagem explícita neste documento. Não inventar vantagem no código sem registrar a decisão em `docs/COMBAT.md` e neste GDD.

Algumas criaturas poderão possuir **elemento primário** e **elemento secundário**.

Exemplo: Pyron Tempestade — Fogo / Elétrico.

---

## 6. DNA das criaturas

Cada criatura possui genes.

### Genes principais

- HP
- ATK
- DEF
- MAG
- RES
- SPD
- CRIT
- EVA (EVASION)
- STATUS
- CRIT DAMAGE (refinamento)
- PRECISION (refinamento)

### Qualidade genética

Cada atributo possui classificação: F, E, D, C, B, A, S, SS.

Exemplo: ATK — S · HP — A · DEF — B · SPD — SS.

### Loci de cartas genéticas (10)

**Toda Creature nasce com exatamente 10 Genetic Card loci.** Decisão: ADR `0011`. Números: `@nexora/config` (`geneticCardConfig`).

Não são 10 NFTs. São DNA da criatura. Cada locus tem alelo **expressed** (carta manifesta) e **recessive** (carregado).

| Locus | Papel (pool da espécie, não carta única) |
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

Família de exemplo: `FLAME_FANG` → variantes `PREDATORY_FLAME_FANG`, `PLASMA_FANG`. Mesma família, expressões diferentes (custo, speed, elemento, status). Sem fórmula nesta milestone.

A ilustração da carta (`CardArtAsset`, ADR 0018) pertence à **definição + variant**, não à Creature. A IA desenha só o efeito; o frontend renderiza moldura, custo, G# e texto. Recessivo oculto não mostra arte. Balancear dano não regenera imagem.

Party 3 criaturas → **30 genetic cards** no deck da batalha (10+10+10). A mão continua limitada (5). Sem recortar para 16 nem preencher com cartas genéricas (ADR 0037). Formação: FRONT protege MID e BACKLINE; bypass só por tag genética (Assassin, Pierce, AoE).

---

## 7. Genes dominantes e recessivos

Cada criatura terá genes visíveis e escondidos (stats **e** cada locus de carta).

Exemplo:

- Pyron
- Gene ativo: Fogo Carmesim
- Gene recessivo: Tempestade

Ao reproduzir esse Pyron, existe chance do gene Tempestade aparecer no filhote. Isso permite criação de linhagens.

Nos loci de carta o mesmo vale. Exemplo G9: expressed `INFERNAL_BLOOD`, recessive `STORM_BLOOD`. No breed, ambos podem ser herdados.

---

## 8. Sistema de breeding

Para reproduzir, o jogador seleciona **Criatura A** e **Criatura B**.

O sistema calcula:

- compatibilidade
- genética
- elementos
- ancestralidade
- mutações
- fertilidade
- chance de característica rara

Detalhamento operacional: `docs/BREEDING.md`.

---

## 9. Fertilidade

Cada criatura terá fertilidade **5/5**.

Depois de cada breeding: 5/5 → 4/5 → 3/5 → 2/5 → 1/5 → 0/5.

Criaturas sem fertilidade não podem mais reproduzir. Isso impede inflação infinita.

---

## 10. Custo de breeding

Breeding exige GOLD + 1 Genome Catalyst + 1 fertility de cada pai. O custo sobe com o uso:

```
cost = 250 * (1 + 0.40 * parentA.breedsUsed + 0.40 * parentB.breedsUsed)
```

Números em `packages/config/src/economy.ts` (profiles `alpha` / `production`). O cliente não envia o valor. Evolução de estágio (BABY → YOUNG → ADULT) não cobra Gold.

Ver `docs/ECONOMY.md` e ADR 0024.

---

## 11. Incubação

Depois do breeding surge um **ovo único**. O tempo vem do **GenesisGrade** (complexidade da recombinação: novidade, mutação, linhagem, morfologia, tipologia, elemento, origem de poder). Grade **não** é força de combate.

Alpha usa minutos curtos para testar o loop. Produção usa `incubationConfig.production`. Fonte canônica: `packages/config`. Cliente só exibe `hatchAt`.

Não transformar o sistema em pay-to-win. Itens podem eventualmente melhorar incubação, porém dentro de limites. NEX não zera incubação.

---

## 12. Sistema de mutação

Existe pequena chance de mutação.

Exemplo: Pyron (Fogo) pode gerar Pyron Infernal, Pyron Magma, Pyron Solar, Pyron Tempestade, Pyron Sombrio.

Algumas mutações dependem de condições.

---

## 13. Condições especiais de breeding

Algumas mutações exigem horário, evento, item, região, clima, artefato, nível, geração ou composição genética.

Exemplo: durante Eclipse, Noctyr possui +10% chance de mutação Lunar.

---

## 14. Linhagens

Toda criatura possui `father_id`, `mother_id`, `breeder_id`, `generation`, `birth_date`.

Isso cria uma genealogia. O jogador poderá abrir a **Árvore Genealógica**: pais, avós, bisavós e criador original.

---

## 15. Pureza genética

Criaturas terão percentual de pureza (exemplo: 92%).

Isso representa quanto os genes correspondem à linhagem principal da espécie.

Pureza **não** significa automaticamente ser mais forte. Mestiços podem produzir builds extremamente poderosas.

---

## 16. Personagem do jogador

Cada conta possui um personagem principal. O avatar **representa o jogador** — não um herói pré-pronto.

Campos: nome, avatar, nível, XP, classe, profissão, título, guilda, ouro, cristais, energia.

Customização visual (alvo, ADR 0026): gênero/corpo, pele, rosto, cabelo, cor, olhos, detalhes leves, roupa inicial. Cosméticos depois. **Não** altera dano, captura, genes nem MMR.

Proporção no World: 6–7 cabeças. Sem chibi. Sem fotorealismo.

Ouro e cristais são saldos de carteira auditável (`wallets` + `currency_transactions`), não campos soltos no personagem. Ver `docs/ECONOMY.md`. GOLD não é token. Personagem poderá ter representação ERC-721 na milestone Web3; o `User` interno continua sendo a conta. Ver `docs/WEB3.md`.

---

## 17. Classes

Inicialmente:

| Classe | Foco |
| --- | --- |
| Guardião | defesa e suporte |
| Arcanista | magia e buffs |
| Caçador | captura e exploração |
| Domador | fortalece criaturas |
| Alquimista | consumíveis e efeitos |

A classe não deverá impedir o jogador de usar criaturas diferentes.

No combate tático (ADR 0009), cada classe (e, se couber, a profissão Geneticista) fornece um **card pool**. Cartas não são um TCG separado. Ver `docs/COMBAT.md`. Classes novas **não** entram na M2.

---

## 18. Profissões

Sistema separado da classe.

Profissões: Geneticista, Ferreiro, Alquimista, Cozinheiro, Encantador, Minerador, Explorador, Criador.

Cada profissão possui nível, XP, receitas e especializações.

---

## 19. Mundo

O continente inicial será **AETHERA**.

Visual e sensação: `docs/VISUAL_DESIGN.md`. Haven é cidade (distritos + Genesis Core), não lobby. Cada região deve ser reconhecível numa screenshot. Verticalidade, cavernas em andares, hunting grounds sem placa de nível.

| Região | Descrição | No chão |
| --- | --- | --- |
| Haven | cidade inicial, Genesis Core | Alpha |
| Verdantis | floresta, ruínas, primeira aventura | Alpha |
| Ashenreach | fogo, lava, cinza (ex-Emberfall) | alvo |
| Frostveil | gelo, isolamento | alvo |
| Whisper Marsh | pântano, veneno, névoa | alvo |
| Ironpeak | montanha, minério | alvo |
| Emberlands | terra queimada | alvo |
| Abyss | void subterrâneo (ex-Umbral em parte) | alvo |
| Celestia | endgame, ilhas | alvo |
| Westreach | fronteira oeste | alvo |
| Azuria | aquática | alvo, quando a fatia pedir |
| Stormreach | elétrica | alvo, quando a fatia pedir |

---

## 20. Estrutura do mapa

**Entrega:** não construir o continente inteiro de uma vez. Haven + uma região selvagem por fatia. Colyseus pode usar uma sala por região.

**Sensação (ADR 0026):** o jogador atravessa o portão e o mundo muda — portão → estrada → fazendas → floresta → selvagem. Sem tela preta quando o renderer permitir. Cavernas são andares, não uma sala com mobs.

Alpha: portal Haven ↔ Verdantis. Alvo Unity: travessia contínua.

---

## 21. Exploração

O jogador anda pelo mapa. A cada poucos minutos deve achar algo: mob, recurso, ruína, passagem, NPC, caverna, estrutura, baú, evento, outro jogador, criatura rara.

Pode evitar, puxar ou enfrentar. Segredos existem fora da quest. Mini-mapa revela o continente; não marca tudo.

---

## 22. Sistema de encontro

Mobs **existem no chão** (andam, patrulham, fogem, aggram). Encounter e loot no servidor. O combate alvo acontece **no cenário** (câmera + UI); `/game/battle` é fallback web.

Criaturas aparecem em zonas. Cada região possui spawn table.

Exemplo Verdantis:

- Florune — 35%
- Terranox — 25%
- Nympha — 15%
- Criatura incomum — 8%
- Criatura rara — 2%
- Mutação selvagem — 0,1%

---

## 23. Sistema de captura

O jogador precisa enfraquecer a criatura. Depois utiliza **NexOrb**.

Tipos: NexOrb, NexOrb+, NexOrb Ultra, NexOrb Ancient.

Chance depende de HP do inimigo, status, raridade, nível, orb e habilidades do jogador.

---

## 24. Combate

**Card-based tactical RPG** (não TCG).

Alvo competitivo: roster de **5** criaturas → **ban 1** → **escolhe 3** → formação → deck → batalha. Alpha V1: 1–3 criaturas, sem ban/pick.

Party em campo: 1 personagem + 3 criaturas. Combate competitivo V2: formação FRONT / MIDDLE / BACK (ADR 0022). Alpha casual V1 ainda pode usar FRONT / BACK_LEFT / BACK_RIGHT.

Skills da spec antiga (4 + passive + ultimate) viram **cartas derivadas** da build. Sinergia de arquétipos pode **criar** cartas novas (GDD §3.1). Ver §27 e `docs/COMBAT.md`.

---

## 25. Tipos de carta

ATTACK, SKILL, REACTION, ULTIMATE, TACTIC, GENETIC, EQUIPMENT, CHARACTER.

Effects data-driven (DAMAGE, HEAL, SHIELD, status, DRAW, MOVE, …). Não uma classe TypeScript por carta.

---

## 26. Status

Burn, Poison, Freeze, Shock, Sleep, Bleed, Silence, Blind, Stun, Fear.

---

## 27. Combate tático (cartas)

GENORYX **não** é um TCG. Cartas são a UI das habilidades da build.

Party: 1 personagem + 3 criaturas em formação FRONT / MIDDLE / BACKLINE. Deck = 10 manifestações por criatura (3×10=30). Combat V1.5 (ADR 0038) + Timing Engine V2.3 (ADR 0039): Casual e Ranked usam o **mesmo** Battle Engine. Energy paga o Planning; Mana do time paga o Embate. Toda carta tem `timingClass` (Ação, Ímpeto, Reação, Contra, Preparação, Canalização, Ritual, Passiva). Janela só abre se houver resposta válida. Fusion V2 (105 receitas) e Genetic Power entram no mesmo resolver. Genetic Chain / Team Resonance / recurso pessoal continuam camadas distintas. Ranked: squad 5 → ban simultâneo → pick 3 → formação.

Números em config. Cliente não decide draw, dano ou vitória. Spec de visão: `docs/COMBAT.md`, ADR 0009. Fluxograma de batalha: `docs/COMBAT_SYSTEM.md`, ADR 0031.

A spec antiga “3 criaturas / 1 ativa / 4 skills” está **substituída**. Implementação na M4, não na M2.

---

## 28. Equipamentos do personagem

Slots: Weapon, Helmet, Armor, Gloves, Boots, Ring, Amulet, Relic.

Relic é **build-defining** (quantidade limitada). Equipment e relics podem conceder ou modificar cartas, não só stats. `docs/COMBAT.md`.

---

## 29. Equipamentos das criaturas

Slots: Rune, Artifact, Charm.

---

## 30. Raridade de equipamentos

Common, Uncommon, Rare, Epic, Legendary, Ancient, Mythic.

---

## 31. Affixes

Itens podem possuir atributos randômicos.

Exemplo: Dragon Fang — +10 ATK, +8% CRIT, +5% Fire Damage. Efeito: Burn causa +20% dano.

---

## 32. Crafting

Receitas utilizarão recursos do mundo.

Exemplo: Flame Sword — 10 Iron, 4 Ember Crystal, 2 Pyron Scale, 500 Gold.

---

## 33. Inventário

Categorias: Equipment, Materials, Consumables, Quest, Breeding, Eggs, Cosmetics.

---

## 34. Mercado

Nome: **Nexus Market**.

Jogadores podem vender criaturas, ovos, armas, armaduras, materiais, consumíveis, DNA, artefatos e cosméticos negociáveis.

Ficha de Creature no market (alvo, não agora): espécie + id (ex. PYRON #12882), G1–G10 expressed, traits, mutação, pais, geração. As 10 cartas **não** são listings separados.

---

## 35. Taxa do mercado

Exemplo: 5%.

Venda de 100.000 Gold: jogador recebe 95.000; sistema remove 5.000. Isso funciona como Gold Sink.

---

## 36. Histórico econômico

Mostrar: últimas vendas, preço médio, menor preço, maior preço, volume 24h, volume 7d.

---

## 37. Moedas

### GOLD

Principal moeda de gameplay. **Moeda interna, só servidor.** Não tokenizar. Faucets, sinks e budget: `docs/ECONOMY.md`.

### NEX

Moeda premium futura. Wallet existe no Alpha com saldo 0: sem faucet, sem sink obrigatório, **sem ERC-20**. Não vende poder.

Evitar vender gene, reroll, mutação garantida ou DNA perfeito por GOLD/NEX.

---

## 38. PvP

Modos: Casual, Ranked, Tournament, Guild War, Friendly Duel.

---

## 39. Ranked

Ranks: Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster, Legend.

---

## 40. Temporadas

Cada temporada: aproximadamente 60 dias.

Recompensas: skins, títulos, efeitos, montarias, cosméticos, Gold, itens especiais.

---

## 41. Matchmaking

Sistema baseado em MMR, rank, nível aproximado e power score. Não usar somente nível.

---

## 42. PvE

Conteúdo: Story, Quests, Dungeons, Elite Monsters, World Bosses, Raids, Tower, Challenges.

---

## 43. Torres

Duas torres distintas (GDD §3.1 pilar 7). Nenhuma entra no Alpha Loop V1.

### Torre de Poder

PvE competitivo contínuo. Cada andar tem guardião. Quem derrota o dono assume **Lord of Floor N**. Outro jogador (ou guilda, se a regra permitir) pode desafiar. Ranking: andar, tempo, menor nível.

### Torre de Guilda

Espaço da guilda: genética especial, breeding, buffs, laboratório, controle territorial, bônus de guilda. Relaciona-se ao Guild Hall (§46), sem substituí-lo.

---

## 44. Boss mundial

Exemplo: **IGNIVAR**. Possível aparecer sábado. Servidor inteiro luta contra ele. Recompensas calculadas por contribuição.

---

## 45. Guildas

Guilda possui: nome, tag, nível, XP, membros, ranking, banco, pesquisa, território.

---

## 46. Guild Hall

Guildas eventualmente podem construir: Forge, Breeding Lab, Alchemy Lab, Training Grounds, Market, Vault.

---

## 47. Guild Wars

Guild vs Guild. Formato inicial: 5v5. Posteriormente: 10v10 e 20v20.

---

## 48. Quests

Tipos: Main Quest, Side Quest, Daily, Weekly, Guild Quest, Event Quest, Breeding Quest, Exploration Quest.

---

## 49. Conquistas

Exemplos: First Blood, Geneticist, Master Breeder, Dragon Hunter, Millionaire, Arena Champion, Explorer.

---

## 50. Títulos

Títulos ficam visíveis. Exemplos: Dragon Slayer, Master Geneticist, Founder, Season I Champion.

---

## 51. Sistema de energia

Evitar energia limitando o jogador excessivamente.

Energia poderá existir somente para atividades específicas (por exemplo, dungeons especiais). Nunca impedir exploração básica.

---

## 52. Eventos dinâmicos

Criar o **WORLD DIRECTOR**, sistema responsável por gerar eventos.

Exemplos: Eclipse, Meteor Shower, Dragon Invasion, Genetic Surge, Ancient Portal, Storm.

---

## 53. Genetic Surge

Durante evento: +5% mutação. Ou genes elétricos possuem maior probabilidade. Isso influencia economia e breeding.

---

## 54. Stack técnico

Monorepo com Turborepo.

```text
apps/
  web
  game-server
  api
  admin
packages/
  database
  game-engine
  types
  config
  ui
```

---

## 55. Frontend

Next.js, React, TypeScript, TailwindCSS, Zustand, TanStack Query.

---

## 56. Engine visual

Para a primeira versão: **Phaser 3**.

Responsável por mapa, personagem, movimento, sprites, efeitos e combate visual.

---

## 57. Backend

**NestJS** + TypeScript.

Responsável por auth, users, characters, creatures, inventory, breeding, market, economy, guilds, quests e PvP.

---

## 58. Banco

**PostgreSQL**. ORM: **Prisma**.

---

## 59. Redis

Usar Redis para cache, sessions, matchmaking, leaderboards, cooldowns, eventos e filas.

---

## 60. Multiplayer

WebSocket via **Colyseus** para salas multiplayer.

---

## 61. Autenticação

JWT com access token, refresh token, sessions e revogação.

---

## 62. Segurança econômica

**Regra absoluta:** o cliente nunca decide Gold, XP, drop, damage, loot, breeding, captura ou resultado PvP.

Tudo precisa ser **server authoritative**.

Possuir NFT **não** autoriza o cliente a enviar level, XP, DNA, fertility, dano, raridade ou mutação. Blockchain = ownership; game-server = regras. Ver `docs/WEB3.md`.

---

## 63. Banco principal

Principais tabelas: ver `docs/DATABASE.md`.

users, profiles, characters, creature_species, creatures, creature_genes, creature_skills, creature_ancestry, eggs, breeding_sessions, items, item_templates, inventory, equipment, quests, quest_progress, maps, map_spawns, guilds, guild_members, market_listings, market_transactions, wallets, currency_transactions, battles, battle_logs, pvp_matches, rankings, achievements, events, world_events, professions, craft_recipes.

---

## 64. Creature

Estrutura conceitual:

- id, ownerId, speciesId, name, level, xp, gender
- generation, fatherId, motherId, breederId
- fertility
- elementPrimary, elementSecondary
- hpGene, attackGene, defenseGene, magicGene, resistanceGene, speedGene, critGene, statusGene
- body / head (expresso + recessivo); futuras camadas: eyes, horns, front, rear, tail, back, pattern, aura
- 10 loci de carta × 2 alelos
- idade (Egg → Filhote → Jovem → Adulto) — desbloqueia loci no combate
- mutationId, geneticPurity, birthDate
- (Web3, opcional) tokenId, chainId, contractAddress, mintStatus, geneticHash — UUID interno permanece a PK. `docs/WEB3.md`

---

## 65. Ledger financeiro

Nunca simplesmente atualizar `gold = gold + 1000`.

Criar tabela `currency_transactions` com: id, userId, currency, amount, type, source, referenceId, balanceBefore, balanceAfter, createdAt.

Isso permite auditoria.

---

## 66. Mercado seguro

Ao anunciar item: item fica bloqueado.

Quando vendido: transaction inicia → Gold é retirado → taxa calculada → item muda de dono → Gold enviado → commit.

Se erro: rollback.

Alvo futuro: mercado **interno** (GOLD) e mercado **on-chain**. Os dois não podem divergir de posse (serviço de reconciliação). Nenhum dos dois na M2. GOLD continua off-chain.

---

## 67. Admin

Painel: **GENORYX Control Center**.

Admin poderá ver jogadores, banir, desbanir, silenciar, teleportar, dar itens, remover itens, ver economia, mercado, logs, batalhas, criaturas, criar eventos e announcements, controlar world boss, editar drops e spawn.

---

## 68. Auditoria administrativa

Toda ação administrativa precisa gerar `admin_action_logs`.

Exemplo: Admin X deu 10.000 Gold para Player Y. Motivo: compensação.

---

## 69. Design

Estilo: fantasia futurista. Mistura natureza, tecnologia ancestral, cristais, magia, ruínas e genética.

---

## 70. Interface

A UI precisa parecer GAME, não SaaS.

Menus: Character, Creatures, Inventory, Map, Quests, Breeding, Market, Guild, Arena, Rankings.

---

## 71. Home dentro do jogo

HUD: Avatar, Level, HP, Gold, NEX, Quest atual, Minimapa, Chat, Party, Menu.

---

## 72. Cadastro

Fluxo: Landing Page → Create Account → Create Character → Tutorial → Receive Starter Creature → First Capture → Town.

---

## 73. Starter creatures

Escolha entre três:

| Espécie | Elemento | Perfil |
| --- | --- | --- |
| Pyron | Fogo | Ofensivo |
| Nympha | Água | Balanceado |
| Florune | Natureza | Suporte |

---

## 74. Tutorial

Tutorial deve ensinar: andar, interagir, combater, capturar, equipar, usar inventário.

---

## 75. Breeding tutorial

Liberado aproximadamente no nível 10. Jogador recebe a quest **The Genesis Code**.

---

## 76. Marketplace

Liberado aproximadamente no nível 8. Evita contas bots criadas somente para mercado.

---

## 77. Anti-bot

Adicionar futuramente: rate limiting, device fingerprint, behavior analysis, captcha em comportamentos suspeitos, transaction monitoring.

---

## 78. Fases de desenvolvimento

| Fase | Foco |
| --- | --- |
| 0 | Fundação: monorepo, Docker, database, Redis, API, frontend, game server, auth, CI |
| 1 | Conta: login, cadastro, personagem, profile, character creation |
| 2 | Mundo: Phaser, Town, movement, NPC, map transitions, interaction |
| 3 | Criaturas: species, instances, stats, level, XP, genes |
| 4 | Combate tático em cartas: engine, energy, formação, status, elementos, AI |
| 5 | Captura: wild encounters, NexOrbs, storage |
| 6 | Inventário: items, equipment, consumables, drops, loot |
| 7 | Breeding: parents, compatibility, genes, egg, incubation, mutation, genealogy |
| 8 | Economia: Gold, ledger, NPC shops, rewards |
| 9 | Market: listing, buying, selling, history, taxes |
| 10 | PvP: queue, matchmaking, rooms, ranking, MMR |
| 11 | RPG: quests, story, dungeons, boss, professions, crafting |
| 12 | Social: friends, chat, guilds, party |
| 13 | Endgame: world boss, tower, guild wars, seasons, events |

---

## 79. MVP real

Não desenvolver tudo inicialmente.

Primeira versão jogável precisa conter: login, create character, 1 cidade, 2 mapas, 6 criaturas, movimento, NPC, combate, captura, inventário, equipamento, breeding, genes, ovos, market, PvP, ranking.

Essa versão já permite testar a principal hipótese do jogo.

---

## 80. Estrutura visual inicial

### Mapa 1 — Haven

NPCs: Professor Kael, Breeder Lyra, Blacksmith Orin, Merchant Theo, Arena Master.

### Mapa 2 — Verdantis

Criaturas: Florune, Terranox, Nympha.

### Mapa 3 — Emberfall

Criaturas: Pyron, Drakor, Voltaris.

---

## 81. Primeira dungeon

**Genesis Ruins**. Boss: Ancient Terranox.

---

## 82. História inicial

Séculos atrás uma civilização chamada **THE ARCHITECTS** descobriu que toda criatura de Aethera possuía um código energético. Chamaram esse código de **GENESIS CODE**.

Tentando manipular o código, abriram fendas dimensionais. As criaturas começaram a sofrer mutações. A civilização desapareceu.

O jogador começa milhares de anos depois. Recentemente as fendas começaram a surgir novamente.

---

## 83. Mistério principal

- Por que as criaturas estão evoluindo?
- Quem criou o Genesis Code?
- O que aconteceu com os Architects?
- Quem está reabrindo os portais?

---

## 84. Antagonista

Organização: **THE ASCENDANCY**.

Eles acreditam que evolução não deve depender da natureza. Querem criar a criatura perfeita artificialmente.

---

## 85. Logo conceitual

GENORYX. Símbolo: um DNA formando X ou portal. Embaixo: GENESIS.

---

## 86. Direção artística

Não começar fazendo dezenas de assets. Primeiro utilizar placeholders (círculos coloridos, sprites simples, tiles básicos). Depois substituir gradualmente.

Gameplay primeiro. Arte depois.

---

## 87. Resolução

Game canvas: **1280×720**. Responsivo. Desktop prioritário. Posteriormente adaptar experiência mobile.

---

## 88. Regras de desenvolvimento

1. Nunca implementar sistema gigante de uma vez.
2. Criar módulos pequenos.
3. Cada sistema deve possuir testes.
4. Banco através de migrations.
5. Nenhuma regra econômica deve ficar somente no frontend.
6. Nada importante deve confiar no cliente.
7. Toda transação monetária precisa possuir log.
8. Toda ação administrativa precisa possuir auditoria.
9. Evitar arquivos com milhares de linhas.
10. Separar domínio de infraestrutura.

---

## 89. Estrutura recomendada do backend

`modules/`: auth, users, characters, creatures, breeding, battle, inventory, items, market, economy, quests, guilds, world, admin.

---

## 90. Game engine separado

`packages/game-engine` deverá conter regras puras: `calculateDamage()` / battle reduce, `calculateCaptureChance()`, `calculateBreeding()`, `generateCreatureGenes()`, `calculateXP()`, `calculateLevel()`, `calculateElementMultiplier()`, e o **battle engine de cartas** (`BattleState + Action + Seed`).

Isso permitirá testar o jogo sem depender do servidor.

---

## 91. RNG

Não utilizar `Math.random` diretamente nas regras importantes.

Criar `RandomService`. Isso possibilita testes, seed, replay e auditoria.

---

## 92. Battle replay

Cada combate deve gerar battle log. Assim futuramente poderemos reproduzir partidas.

Salvar: turn, action, actor, target, damage, status, rng seed.

---

## 93. Balanceamento

Todos os valores devem vir de configs. Não espalhar números pelo código.

Configs: `combat.config`, `breeding.config`, `economy.config`, `capture.config`, `xp.config`.

---

## 94. Painel de balanceamento

Posteriormente o admin poderá alterar drop rates, spawn rates, XP, Gold, breeding cost, capture e event multipliers sem modificar código.

---

## 95. Primeiro objetivo técnico (vertical slice)

Antes de criar marketplace ou guilda, precisamos conseguir:

1. criar conta
2. criar personagem
3. entrar em Haven
4. andar
5. sair da cidade
6. encontrar criatura
7. combater
8. capturar
9. voltar para cidade
10. visualizar criatura

---

## 96. Segundo objetivo

Selecionar duas criaturas → breed → gerar ovo → esperar incubação → ovo chocar → gerar criatura geneticamente baseada nos pais.

Quando isso funcionar corretamente, teremos o coração de GENORYX.

---

## 97. Terceiro objetivo

Dois jogadores selecionam time → entram em queue → servidor encontra partida → batalha acontece → vencedor recebe MMR → ranking atualiza.

---

## 98. Quarto objetivo

Marketplace. Jogador A anuncia Pyron. Jogador B compra. Sistema transfere Gold, creature ownership, fee e transaction history.

---

A direção do Alpha (2026-09-02, ADR 0013) entregou uma **fatia fina** de 07–20 numa só volta jogável. A ordem absoluta continua valendo para profundidade; não autoriza atalho de autoridade, ledger ou RNG.

## 99. Ordem absoluta para implementação

01 infrastructure  
02 database  
03 authentication  
04 character  
05 Phaser world  
06 player movement  
07 creatures  
08 battle engine  
09 wild encounters  
10 capture  
11 inventory  
12 items  
13 breeding engine  
14 eggs  
15 genealogy  
16 economy  
17 shops  
18 marketplace  
19 PvP  
20 rankings  
21 quests  
22 dungeon  
23 crafting  
24 professions  
25 social  
26 guilds  
27 world events  
28 seasons  
29 admin  
30 web3 / NFT ownership (não bloqueia 05 Phaser; ver `docs/WEB3.md`)

---

## 100. Primeira tarefa concluída neste repositório

Este arquivo existe em `docs/GAME_DESIGN.md`. Snapshot jogável do Alpha (o que está no ar, não a visão): `docs/ESTADO_ATUAL.md`.

Documentos complementares:

- `docs/ESTADO_ATUAL.md`
- `docs/SISTEMAS_BATALHA.md`
- `docs/SISTEMAS_BREEDING.md`
- `docs/SISTEMAS_PROGRESSAO.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE.md`
- `docs/ROADMAP.md`
- `docs/BREEDING.md`
- `docs/COMBAT.md`
- `docs/COMBAT_SYSTEM.md`
- `docs/ECONOMY.md`
- `docs/SECURITY.md`
- `docs/WEB3.md`
- `docs/CREATURE_EVOLUTION.md`
- `docs/UNITY_BATTLE_POC.md`
- `docs/UNITY_GAME.md`
- `docs/VISUAL_DESIGN.md`

## 101. Propriedade digital

Personagens, criaturas, ovos, equipamentos únicos e itens negociáveis terão representação tokenizável (ERC-721 / ERC-1155) numa **milestone Web3 própria**.

Até lá o jogo usa só Postgres. Mint é assíncrono: movimento, combate, XP e UI **não esperam** bloco.

Carteira padrão planejada: embedded/smart wallet na conta. MetaMask não é obrigatório.
