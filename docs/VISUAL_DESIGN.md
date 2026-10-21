# GENORYX — Design visual do World

Canônico da **experiência do mundo**. Arte de DNA/cartas: `docs/ART_BIBLE.md`. Renderer: ADR `0025` + `0026`.

Frase:

> GENORYX é um mundo que existe para ser explorado, criaturas que existem para ser criadas e uma progressão que obriga o jogador a viver ambos.

O World alimenta o Breeding. O Breeding alimenta o World. O World alimenta o PvP. O PvP aumenta o valor das criaturas.

---

## Sensação

Três eixos: **aventura · descoberta · conexão com as criaturas**.

O jogador não entra numa tela para “fazer batalhas”. Existe um mundo vivo ao redor.

Inspiração de Tibia = **filosofia**, não pixel art:

- mundo grande, exploração livre, cidades conectadas
- cavernas profundas, hunting grounds, lugares secretos
- perigo ao se afastar das cidades
- necessidade de conhecer o mapa
- a comunidade nomeia os melhores spots de farm

Visualmente: **muito mais moderno**.

Não parece um jogo de breeding com um mapa anexado. Não parece um MMORPG genérico com criaturas coladas.

---

## Estilo

**3D estilizado de alta qualidade.**

Não fotorealista. Não infantil. Não cartoon de criança.

Faixa: **fantasia estilizada + anime ocidental + RPG moderno**.

Formas definidas, silhuetas fortes, detalhe suficiente. As **criaturas chamam mais atenção que os humanos**. Três jogadores juntos: o olho vai primeiro para as criaturas.

Proporção humana: **6–7 cabeças**. Sem chibi. Sem realismo de unsreal.

---

## Câmera

**Perspective 3/4.** Não é top-down.

| | Alvo |
| --- | --- |
| FOV | 35°–45° (slice: 36°) |
| Pitch | 45°–55° (slice: 48°) |
| Yaw | 35°–45° (slice: 40°) |
| Distância | ~16–26 m (slice: 20 m) |

Mostra frente e lateral do personagem, chão, fachadas, telhados, vegetação, criaturas, horizonte.

A tela cabe **uma praça, duas casas, uma rua** — não a cidade inteira. Haven é maior que um ecrã.

Segue o jogador com suavidade. Zoom e yaw **pequenos**. Perto o bastante para ler genética.

## Escala oficial

1 unidade Unity = 1 metro. Números em `WorldScale`.

| Elemento | Tamanho |
| --- | --- |
| Humano | 1,75–1,85 m (slice: 1,80 m) |
| Porta | ~2,2 m |
| Casa comum | 4–7 m de altura (slice: 5,6 m) |
| Árvore comum | 4–8 m (slice: ~6,2 m) |
| Rua principal | 5–8 m (slice: 6,5 m) |
| Rua secundária | 3–5 m |
| Genesis Core | 12–20+ m (slice: 16 m, landmark) |
| Baby | ~0,75–0,85 m, segue a ~1,65 m |

Casas não são muralhas. O Core **pode** ser enorme — é o norte visual de Haven.

O Phaser atual é **DEV_WORLD** (ADR 0027). Não texturizar esse tilemap. A fundação estética é a Vertical Slice Unity (`HavenSlice`).

| Momento | Câmera |
| --- | --- |
| Exploração | 3/4 elevada |
| Combate | aproxima, cenário continua atrás |
| Boss | take curto (entrada, especial, morte) sem roubar o controle por muito tempo |

---

## Personagem

Direção fechada: `docs/CHARACTER_ART.md`. Kit da slice: `CharacterKit` + `CreatureKit` (silhueta 6,5–7 cabeças, não cápsula).

O jogador **cria** o avatar. Não controla um herói pré-pronto.

Customização inicial (simples, cosmética depois):

- gênero / corpo
- pele, rosto, cabelo, cor, olhos
- detalhes faciais leves
- roupa inicial

NEX não vende poder. Cosmético não altera captura, dano, genes nem MMR.

---

## Haven

Primeira âncora visual: **segurança, civilização, começo**. Cidade de verdade — não lobby.

Fantasia + tecnologia genética: pedra clara, madeira, metal, cristais, vegetação, energia azul/verde, símbolos de DNA.

**Genesis Core** no centro: árvore/cristal/estrutura visível de vários pontos — o jogador se localiza por ela.

### Distritos

| Distrito | Função visual |
| --- | --- |
| Genesis Plaza | spawn, encontro, NPCs, eventos |
| Lyra's Sanctuary | breeding: incubadoras, ovos, cristais, plantas, DNA |
| Market District | barracas, AH, comércio |
| Forge District | crafting, materiais do World |
| Arena District | PvP, banners, estátuas, ranking |
| Guild Hall | guildas, missões, eventos de grupo |

Sair da cidade **sem tela preta** sempre que o renderer permitir:

portão → estrada → fazendas → floresta → selvagem.

Quanto mais longe, mais o bioma muda e mais perigoso fica.

Alpha atual: portal Haven ↔ Verdantis no Phaser. Alvo: travessia contínua (Unity).

---

## World

Não é terreno vazio. Camadas de interesse a cada poucos minutos: mob, recurso, ruína, passagem, NPC, caverna, estrutura, baú, evento, jogador, criatura rara.

Cada região deve ser reconhecível numa screenshot. No Alpha web (ADR 0042) isso vem de **plates pintados**, não de tiles gerados em código.


O mapa **não é plano**: montanhas, pontes, penhascos, cavernas, túneis, templos, torres, minas. O jogador vê lugares que ainda não sabe acessar.

Hunting grounds **sem placa de nível**. A comunidade nomeia (“Venom Cave”). Segredos não vão todos para o mini-mapa.

### Continente (alvo visual)

| Região | Identidade | Paleta / atmosfera |
| --- | --- | --- |
| Haven | civilização | pedra, cristal, ouro suave |
| Verdantis | natureza, ruínas, primeira aventura | verdes, azuis, terra, luz nas folhas |
| Ashenreach | fogo, destruição | lava, cinza, cristal vermelho |
| Frostveil | frio, isolamento | neve, aurora, vento |
| Whisper Marsh | veneno, natureza corrompida | pântano, névoa, bioluminescência |
| Ironpeak | montanha, minério | pedra, metal, altura |
| Emberlands | terra queimada | brasa, ruína |
| Abyss | void, subterrâneo extremo | cristal violeta, escuridão, civilização perdida |
| Celestia | endgame | ilhas, templos, queda no vazio |
| Westreach | fronteira oeste | a definir na fatia da região |

Nomes antigos do GDD (§19) que mapeiam: Emberfall → Ashenreach; Umbral → Abyss / Whisper Marsh conforme a fatia; Azuria e Stormreach entram quando a região for construída, não apagam o continente.

Alpha jogável: **Haven + Verdantis**.

### Cavernas

Sensação: “até onde isso vai?” Vários andares, ponte, mining, templo, mini-boss, passagem secreta, boss. Algumas ligam regiões.

### Mobs

Existem no chão. Andam, dormem, patrulham, perseguem, fogem, defendem território, às vezes atacam outros mobs.

Não abrir outra dimensão só porque o jogador viu um bicho.

| Família | Leitura |
| --- | --- |
| Common | tamanho normal |
| Elite | maior, aura leve |
| Alpha | muito maior, mutação visível |
| Rare | partes genéticas incomuns |
| World Boss | muda a área: céu, música, rugido, mensagem regional |

Aggro e loot continuam no servidor.

---

## Criaturas no World

Dois indivíduos da mesma espécie **não precisam parecer iguais**. Body, Head, Eyes, Horns, pernas, Tail, Wings, Pattern, Aura, cor, mutação.

Um companion ativo segue o jogador. O resto da party entra no combate. O jogador escolhe quem anda com ele.

### Estágios no chão

| Stage | Leitura |
| --- | --- |
| BABY | menor, cabeça um pouco maior, olhos evidentes, passo desajeitado, curiosidade |
| YOUNG (Juvenile) | partes crescendo (chifre, asa, cauda, músculo) — não é Baby escalado |
| ADULT | DNA completo, postura confiante |

Art Bible (`docs/ART_BIBLE.md`) manda no fenótipo. Este doc manda no **como o mundo mostra**.

---

## Combate no World

O jogador **avisa, evita, puxa um, enfrenta vários**. O cenário **é** a arena.

Transição:

1. câmera aproxima
2. criaturas assumem FRONT / BACK LEFT / BACK RIGHT (apresentação Alpha; competitivo V2 continua FRONT / MIDDLE / BACK no motor)
3. UI de cartas aparece
4. fim: UI some, câmera volta, o jogador continua andando

Sem teleporte para um void. `/game/battle` no Alpha web é fallback até o renderer in-place existir.

---

## HUD

Parece jogo, não painel SaaS.

| Zona | Conteúdo |
| --- | --- |
| Superior esquerdo | avatar, level, HP do personagem |
| Abaixo | criatura ativa: HP, level, Baby / Juvenile / Adult |
| Superior direito | mini-mapa, região, coords opcionais |
| Inferior | hotbar, itens rápidos, interações |

Mini-mapa: fog of war. Ícones: cidade, portal, dungeon, waypoint, boss, evento, party. **Não** marcar todo segredo.

Mapa-múndi: pergaminho de fantasia. Segredos só depois de descobertos.

---

## Tempo, clima, som, eventos

Dia/noite e clima por região (chuva, cinza, nevasca, névoa, tempestade mágica). Alguns spawns só de noite / só na tempestade.

Fora de combate: pássaros, vento, água, criaturas distantes. Caverna: música baixa, passo ecoa, som desconhecido.

World event no mesmo mapa: mensagem regional, céu muda, boss aparece, quem está perto participa.

---

## Experiência que define o jogo

Sair de Haven com um Pyron Baby. Portão. Verdantis. Música muda. Mosslings no rio. Combate no chão. Evolução 78% → 86%. Caverna escondida. Elite. Material raro. Outro jogador com uma criatura diferente. Volta. Lyra. Planeja o próximo breed.

---

## O que o Alpha *não* finge

- Phaser 2D em `/game` é **fallback** até Unity WebGL estável.
- Haven ainda não tem os seis distritos construídos.
- Sair da cidade ainda usa portal/sala.
- Combate ainda pode abrir `/game/battle`.
- Customização corporal ainda não existe (só nome de personagem).
- Ashenreach+ não estão no chão.

Mentir qualquer um desses no HUD ou no marketing é bug de design.
