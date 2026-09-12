# Roadmap — GENORYX: Genesis

Este arquivo é o registro vivo de milestones. TODO crítico sem linha aqui não existe.

Ordem absoluta: `docs/GAME_DESIGN.md` seção 99.

## Estado atual

| Milestone | Nome | Status |
| --- | --- | --- |
| M0 | Infraestrutura | **concluída** (oficial) |
| M1 | Conta, login, personagem | **concluída** (oficial) |
| M2 | Mundo Phaser | **concluída** (oficial) |
| Alpha Loop V1 | Starter → combate → captura → breed → market → PvP | **live** em https://alpha.genoryx.com.br (fina, ADR 0013) |
| Unity Game V1 | World + Battle renderer + Maturation PvE | **em curso** (ADR 0025); flag `web` |
| Visual World | Bíblia 3D + DEV_WORLD vs slice | **em curso** (ADR 0026 + 0027); Phaser = DEV_WORLD; fundação = HavenSlice Unity |
| Criatura 3D | Chassi montado do DNA como visual canônico | **live** no Alpha (ADR 0032); pacote Art04; OpenAI em `mock` |
| Character 3D | Avatar modular + Meshy FASE 1 | **em curso** (ADR 0028); um Tamer real antes do catálogo |
| M3–M6+ | Profundidade de cada sistema | fatias finas no loop; não “completas” |

M0–M2 permanecem a base. A direção uniu M3–mercado–PvP num **Alpha Playable Loop V1** (ADR 0013): cada sistema funciona ponta a ponta, sem profundidade final.

Mapa canônico do jogo: **7 pilares** em `docs/GAME_DESIGN.md` §3.1 e ADR 0014. Genética conecta combate, aparência, status, cartas, breeding e metagame.

Gameplay de criaturas, combate, captura e breed **não** entra no mundo Haven.

---

## Milestone 0 — Infraestrutura

**Objetivo:** monorepo ligável, banco modelado, Redis no ar, apps sobem, regras Cursor e ADRs existem.

**Arquivos:** `apps/*`, `packages/*`, `docker-compose.yml`, `docs/*`, `.cursor/rules/*`, `.github/workflows/ci.yml`.

**Banco:** schema Prisma completo o suficiente para identidade, personagem, criaturas, breeding, economia e auditoria. Sem dados de jogadores.

**APIs:** `GET /health` (info de postgres + redis). Auth JWT configurada, sem cadastro/login públicos ainda.

**Riscos:** misturar o legado AURORA com o jogo; números hardcoded; começar Phaser cedo demais.

**Critério de pronto:**

- [x] Documentos da seção 100 do GDD existem
- [x] `docker compose up -d` sobe Postgres e Redis
- [x] Prisma schema + migration inicial
- [x] `npm run typecheck`, `test`, `lint` e `build` passam
- [x] Landing em `apps/web` e placeholder do Control Center
- [x] Código AURORA isolado em `legacy/aurora`
- [x] Colyseus nas salas — adiado para M2 de propósito (ADR 0004; Express `/health` na M0)

---

## Milestone 1 — Conta e personagem

**Objetivo:** register, login, refresh, logout, criação de um personagem principal.

**Arquivos:** `apps/api/src/modules/auth`, `apps/api/src/modules/characters`, páginas em `apps/web`.

**Banco:** uso de `User`, `Profile`, `Session`, `RefreshToken`, `Character`. Criar `Wallet` GOLD=0 e NEX=0 no registro.

**APIs previstas:**

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /characters`
- `GET /characters/me`

**Riscos:** senha fraca, refresh sem rotação, Gold escrito no character.

**Ainda não:** starter creature (M3), mundo Phaser (M2).

**Critério de pronto:**

- [x] Register, login, refresh com rotação, logout, `/auth/me`
- [x] Um personagem por conta (API + `Character.userId` unique)
- [x] Nome único normalizado (`name_normalized`)
- [x] Wallets GOLD e NEX em 0 no registro, sem crédito fantasma
- [x] Testes e2e com Postgres/Redis
- [x] Páginas `/register`, `/login`, `/create-character`, `/game`

---

## Milestone 2 — Mundo Phaser

**Status:** concluída (oficial).

**Objetivo:** primeiro mundo jogável — Haven. Phaser no web, personagem autenticado no mapa, movimento, colisão, câmera, interação básica com NPCs placeholder, entrada/transição de mapa, contrato web ↔ API ↔ game-server, Colyseus no npm (ADR 0004 + ADR 0010).

**Arquivos previstos:** `apps/web/src/game/**`, `apps/game-server` (Colyseus + sala `haven`), contratos em `@nexora/types`, números em `@nexora/config` (`world`). Sem Phaser na API.

**Banco:** leitura de `GameMap` e `Npc` (seed M0). Persistir `Character.mapKey`, `posX`, `posY` a partir do **game-server**, nunca de um body `x/y` do cliente. Sem migration de economia. Collision/map JSON como asset, não como schema solto no app.

**APIs / sockets previstos:**

- HTTP existente: `GET /auth/me`, `GET /characters/me` (bootstrap).
- Opcional: `GET /world/maps/:key` só como catálogo (NPCs/dimensões) — sem aceitar posição.
- Colyseus: sala `haven` (e portal para sala/mapa `verdantis` **sem** encontros). Auth = access JWT da M1.

**Fora da M2:** combate, criaturas selvagens, captura, breeding, inventário completo, marketplace, PvP, quests, guildas, starter creature, **smart contracts / NFT**.

**Riscos:** cliente como fonte da posição; Colyseus/`workspace:` no npm; Phaser + Next SSR; JWT de 15m derrubar a sala; puxar Verdantis com spawn (isso é M5).

**Critério de pronto (quando implementada):**

- [x] Phaser monta em `/game` (1280×720, placeholders)
- [x] Join Colyseus com JWT; sem token / sem personagem = recusa
- [x] Movimento por intenção; servidor clampa colisão e bounds
- [x] Câmera segue o player; NPCs do seed interagem (diálogo stub)
- [x] Entrada em Haven + portal de transição sem combate
- [x] Posição persistida no leave/throttle via Prisma
- [x] ADR da instalação Colyseus no npm workspaces (**0010**)
- [x] `npm run test`, `lint`, `typecheck`, `build`

Web3 (ADR 0008) é documentação apenas. **Zero contratos na M2.**

## Dívida técnica (não corrigir de forma oportunista)

Registrada na aprovação da M1. Sem refatoração até a direção pedir.

- [ ] Access JWT sem denylist — token segue válido até o TTL (~15m) após logout. Mitigação futura: denylist curta no Redis ou `jti` ligado à Session.
- [ ] Redirect de logout em `/game` — race entre `clearSession` e o `useEffect` manda para `/login` em vez da landing.
- [ ] `UsersModule` residual da M0 (`findById` / `findByEmail`) — não é contrato público; não apagar/reorganizar agora.

---

## Milestone 3 — Criaturas

**Objetivo:** instanciar espécies, genes, nível/XP, visualizar coleção. Toda Creature nasce com **10 Genetic Card loci** (ADR 0011) × 2 alelos. Kit **não** é “4 skills fixas”.

**Fatia Alpha:** starter + coleção + 10 loci persistidos. Arte oficial: Visual DNA → prompt → job (mock/OpenAI) → `CreatureVisualAsset` (ADR 0015). Coleção resolve via `resolveCreatureVisual()`. Hatch de breeding entra em Genesis Reveal (`PENDING_VISUAL` → `READY_TO_REVEAL` → `REVEALED`). Compositor PNG = fallback. Young/Adult/NFT depois.

**APIs:** listar criaturas do personagem. Starter (Pyron / Nympha / Florune) no fim do tutorial.

**Riscos:** gerar genes no frontend; gravar `CreatureSkill` rígido; omitir recessivos.

### Creature System V1 — corpo 3D modular (ADR 0029)

**Status:** implementado em `apps/unity-game/Assets/GENORYX/Scripts/Creature`. Chassi único
`GENORYX_CORE_CHASSIS_V1` + rig único `GENORYX_CORE_RIG` (21 bones). DNA → IDs →
`CreatureAssembler` monta na hora; nenhuma chamada Meshy em runtime.

- [x] Chassi, rig, sockets de contrato e gizmos de zona
- [x] 4 heads, 5 eyes, 5 horns, 5 limbs, 5 tails, 6 backs (com NONE), 5 cores
- [x] Shader `GENORYX/Creature` + 6 patterns por `MaterialPropertyBlock`
- [x] 13 clipes procedurais e um único Animator com blend tree de locomoção
- [x] Growth Baby/Juvenile/Adult sobre o mesmo rig
- [x] Presets Ember/Frost/Nature/Void, auras e random generator
- [x] Motor, companion follow, wild mode, colisor simples, LOD 0/1/2
- [x] Testes: orientação de malha, frescor dos assets baked, 10/100 criaturas, 1000 swaps, deformação de 13 clipes
- [x] 27 capturas + `creature_animation_test.mp4` (160 frames, 20 fps)
- [x] **Live no Alpha**: bundle WebGL (~23 MB, gzip com fallback) em `/unity-game`, servido
      pela imagem `web`. Validado por Chromium headless contra a URL pública, não só por
      captura de editor — foi o browser que expôs a aura virando quadrado branco no player.
- [ ] Substituir peças procedurais por assets Meshy+Blender via `tools/creature_pipeline` (peça a peça, sem migração de dados)
- [x] Ligar o chassi ao backend: `visualGenomeJson.chassis` + `chassisSignature` unique.
      Plantel legado (sem assinatura) é apagado e cada jogador recebe 5 criaturas aleatórias,
      todas com fenótipo distinto. A coleção pinta o chassi; a arte 2D antiga não cobre mais.
- [ ] Rebuild do bundle é manual: sem Editor no CI, mudança na cena só chega ao Alpha por
      `GENORYX/Build/WebGL` + `vps-pack.ps1`. Enquanto for manual, o bundle publicado pode
      divergir do código do repo sem ninguém perceber.
- [ ] `/game-unity` carrega o bundle mas o cliente ainda não fala com o backend: as bridges
      `genoryxWorldIntent`/`genoryxBattleIntent` existem sem ligação com Colyseus. Hoje a rota
      é vitrine do chassi, não jogo conectado.

### Balanceamento de combate — abertura sem jogada legal

- [x] Kit G1–G10 (`gxr-kit-v1`, ADR 0034) desacopla custo de rank: energia 1–4,
      G1/G2/G5 no andar de 1. Combate usa a ficha `resolved`, não o catálogo fino.
      Plantel legado sela na primeira leitura; versão nova não reescreve kit v1.

## Alpha VPS (ops, não milestone de gameplay)

**Status:** live em https://alpha.genoryx.com.br (VPS `85.31.60.84`, SNI 443). Legado `:8443` ainda no ar. Ver `docs/DEPLOYMENT.md`.

- [x] Compose de produção + Dockerfiles multi-stage
- [x] Nginx HTTPS / WSS
- [x] `.env.example` / `.env.production.example`
- [x] migrate explícito; seed só sob profile
- [x] Deploy na VPS + 2 clients externos (login, Haven, visão mútua, move, NPC, portal, persistência)
- [x] Marca pública GENORYX — ADR 0012. Packages `@nexora/*` intactos.
- [x] DNS A `genoryx.com.br` / `www` / `alpha` / `play` → `85.31.60.84` + HTTPS 443 (SNI, Let's Encrypt)

---

## Milestone 4 — Combate PvE (cartas)

**Objetivo:** battle engine puro (cartas), party 1+3 em formação, energy/momentum, PvE selvagem/trainer. Spec de visão: `docs/COMBAT.md`, ADR 0009. Fluxograma de batalha: `docs/COMBAT_SYSTEM.md`, ADR 0031.

**Arquivos:** `packages/game-engine` (reduce + EffectResolver), dados `CardDefinition`, sala Colyseus `battle-pve`, Phaser só anima.

**Banco:** `Battle` + `BattleLog` (seed + actions). Catálogo de cartas/synergy — ver DATABASE §15. Sem NFT de carta.

**Fora:** Draft/PvP ranked, ban/pick, todos os arquétipos, árvore completa de upgrades.

**Riscos:** dano/draw no Phaser; classe TS por carta; TCG desligado da build.

**Critério (quando for a vez):** testes do engine sem I/O; cliente só manda `PLAY_CARD`.

### Guerra Mágica + memória tática (ADR 0030)

- [x] Schema da carta (`cost`, `range`, `momentumAltCost`, `interventionTrigger`, `draftWeightBase`, `effects`)
- [x] Módulos puros: pesos T/+3 e T-1/+1, pilha LIFO com fadiga 0/+1/+2, fórmulas \(P_F\) / \(C_F\)
- [x] Spec + log do turno 5 em `docs/COMBAT_ENGINE.md`
- [ ] Ligar presença, compra ponderada e pilha no `reduceBattle` atrás de flag (não quebra V1 casual)

### Fluxograma canônico (ADR 0031)

- [x] Spec organizada em `docs/COMBAT_SYSTEM.md` (formação, alvos, 15 tipos, Mana 1–10, fusão no 5, 105/455, Embate, exemplo `P_F=126`)
- [ ] Reconciliar fatia ADR 0030 / Matrix V2 com o fluxograma (tabela `M_R`/`F_M`/`T_R`, morte da Frente, sobretaxa sem redesenhar)
- [ ] Não preencher células **[A DEFINIR]** sem decisão de design registrada

---

## Milestone 5 — Encontros e captura

**Objetivo:** spawn table, enfraquecer, NexOrb, persistir criatura capturada.

**Riscos:** chance de captura no cliente.

---

## Milestone 6 — Breeding (coração do jogo)

**Objetivo:** dois pais → sessão → ovo → incubação → filhote com DNA, linhagem, fertilidade e **modificadores de card pool** (quando o combate M4 existir).

Detalhe: `docs/BREEDING.md`.

**Riscos:** fertilidade infinita, custo só no cliente, mutação sem seed.

---

## Depois do vertical slice

| # | Item | Milestone ampla |
| --- | --- | --- |
| 11–12 | inventário e itens | Fase 6 |
| 13–15 | breeding, ovos, genealogia | Fase 7 |
| 16–17 | economia e shops | Fase 8 |
| 18 | marketplace | Fase 9 |
| 19–20 | PvP e rankings | Fase 10 |
| 21–22 | quests e dungeon Genesis Ruins | Fase 11 |
| 23–24 | crafting e profissões | Fase 11 |
| 25–26 | social e guildas | Fase 12 |
| 27–28 | world events e seasons | Fase 13 |
| 29 | NEXORA Control Center real | Fase 13 / admin |

## Objetivos de produto (não pular)

1. Vertical slice de captura (GDD §95)
2. Breeding funcional (GDD §96)
3. PvP com MMR (GDD §97)
4. Marketplace atômico (GDD §98)

## TODOs críticos abertos

- [ ] Definir vantagens elementais do **Gelo** (GDD §5). Bloqueia balanceamento de Cryon.
- [ ] Multiplicadores numéricos de `GeneRank` são placeholders em `packages/config` e precisam de pass de balance.
- [x] Auth completa (register/login/refresh) — M1.
- [x] Phaser Haven — M2.
- [x] 10 Genetic Card loci documentados — ADR 0011. Sem schema.
- [x] Kit G1–G10 derivado do DNA (ADR 0034). Persistido em `expressedJson`. Sem arte nova.
- [x] Arena widescreen V1: campo horizontal (inimigo esquerda / jogador direita), modos Ranked / Casual / Adventure, cenário fantasy. Sem mudar engine.
- [x] Combate/captura Alpha: NexOrb+, energia por turno 1–10, rank de carta 1–10, KO retira cartas, formação F/M/B, tela final, Lab só com criaturas próprias, retorno ao mapa da luta.
- [ ] Web3 / NFT ownership — milestone própria (ADR 0008, `docs/WEB3.md`). Sem contratos na M2.
- [x] Compositor visual ancora HEAD/TAIL nos soquetes do BODY e tampa canos ocos. Pares EYES/HORNS/LIMBS não entram até existirem peças L/R isoladas.
- [x] Renomear criatura — `PATCH /creatures/:id`, só o dono, servidor valida o nome.
- [x] ADR 0015 + Art Bible + Visual DNA + PromptBuilder + provider (mock/OpenAI) + `CreatureVisualAsset` + job baby. IA não escolhe genes.
- [x] Backfill idempotente de visuais + volume persistente `var/creature-visuals` + payload `visual` canônico.
- [x] Genesis Reveal V1 (hatch não mostra o filhote seco; reveal não altera DNA).
- [x] Alpha: arte canônica OpenAI (`OPENAI READY` > mock) + prova Pyron/Nympha/Florune BABY antes do backfill.
- [x] POC Meshy 3D: Florune FERAL → turnaround GPT → GLB → viewer na ficha (ADR 0016). Sem batch, sem auto-rig.
- [x] Ficha V2 + PresenceController no GLB atual (ADR 0017). Sem novo Meshy, sem alterar DNA/retrato.
- [x] Card Art V1: `CardArtAsset` por definição+variant, PromptBuilder, provider mock/OpenAI, `GeneticCard`, prova Florune G1–G10 (ADR 0018). Sem arte por Creature. Sem Pyron/Nympha até aprovação.
- [x] Card Art V2 creature-specific: `CardArtScope` SHARED|CREATURE, `resolveElementPresentation`, fonte única GeneticPower→manifestação→EffectDefinition, política `GENETIC_CARD_ART_POLICY`, prova Terranox G1–G10 (ADR 0023).
- [x] Card Art automático: retrato READY enfileira G1–G10; worker processa CREATURE; GPT gera para toda criatura (allowlist vazia). Sem alterar DNA.
- [x] Battle Presentation V2: `resolveCanonicalCardArt` na mão, arena FRONT/BACK_LEFT/BACK_RIGHT, tokens de criatura, eventos visuais. Sem reescrever o Battle Engine (ADR 0019).
- [x] Evolução Alpha: XP PvE → level → `READY_TO_EVOLVE` → jogador confirma. Mesmo indivíduo. `gateCardsByStage` desligado.
- [x] Maturation XP V1: eixo separado do Combat XP; grant PvE com participation/diversidade/descoberta; Genesis Chamber; READY só com level+maturation (ADR 0025). Sem vender Growth. Sem reset de DNA.
- [x] Unity Game Client V1 (estrutura): World+Battle C#, flags `WORLD_RENDERER`/`BATTLE_RENDERER`, `/game-unity`. Phaser e arena React permanecem fallback. Primeiro WebGL publicado é o da cena de criaturas (ADR 0029); World/Battle seguem sem bundle.
- [x] Direção visual do World: `docs/VISUAL_DESIGN.md` + ADR 0026 (3D estilizado, Haven distritos, combate no cenário, continente). Sem construir Ashenreach. Sem apagar Phaser.
- [x] ADR 0027: Phaser = DEV_WORLD. Fundação estética = Vertical Slice Unity (HavenSliceBuilder). Sem art pass no tilemap.
- [x] Criatura 3D montada do DNA (ADR 0032): pacote Art04 (42 peças + `motions.glb` 120 KB), `serverGeneMapping`, contexto WebGL único, idade em escala, animação por evento do servidor. Prova em `/dev/creature-visual`. Cliente não gera fenótipo.
- [x] Anatomia expressa + ovos 3D (ADR 0033): 4 cabeças e 5 tamanhos de olho deformam a malha; paleta avivada sem inventar cor; cinco cascos com incubar/rachar/eclodir na Lyra e no Genesis Reveal. HatchAt continua do servidor.
- [x] Lab competitivo: chassi 3D no draft/catálogo; formação da IA sem slot repetido (Ready não trava ao banir CONTROL). Campo da arena com pit e faixas em português.
- [ ] Clipes reais de morte, defesa e vitória (hoje procedurais e declarados como tal). Sem chamar de oficial antes de existir no pacote.
- [ ] Reativar retrato OpenAI como camada opcional sobre o chassi — decisão de produto, depende de crédito.
- [ ] Abrir Unity 6, `GENORYX / Rebuild Visual Slice`, screenshot de referência (praça + Core + rua + portão + Tamer + Baby). Sem WebGL até essa cena estar aprovada.
- [x] Direção de arte dos personagens: `docs/CHARACTER_ART.md` + kit silhueta Unity (tamer / 5 NPCs / Pyron Baby). Sem modelo final / Mixamo. Sem art pass de Haven.
- [ ] Personagem 3D FASE 1 (ADR 0028): Creator Unity 3D + assembler real + 8 peças GLB Meshy. Web `/game/appearance` não finge 3D. Validar Game View (cabelo/peito/pele). Sem catálogo extra.
- [x] HUD de jogo no DEV_WORLD (avatar, mini-mapa, hotbar, menu). Sem fingir 3D no Phaser.
- [x] Unity Battle Renderer POC: contrato + `/dev/unity-battle`. Sem build WebGL oficial. Não substitui `/game`.
- [x] Battle Experience V3: `resolveBattleCreatureVisual`, species master para wild, silhueta (nunca quadrado), formação 3×3, HUD, `GET /battle-visuals/report` (ADR 0020). Engine intacto.
- [ ] Unity WebGL oficial da arena Verdantis — só após bundle/FPS/RAM. Flag `BATTLE_RENDERER` continua `web` até aprovação.
- [ ] Persistir EYES/HORNS/front/rear/tail/pattern/back/wings/aura como colunas próprias (GDD §3.1). Hoje o Visual DNA deriva no servidor (espécie + seed + body/head).
- [ ] Aprovar prova Florune G1–G10 em `/dev/card-art-proof` (Alpha: 10 artes OPENAI READY). Sem Pyron/Nympha até aprovação.
- [ ] QA multimodal + Young/Adult com referência da fase anterior (continuidade visual).
- [ ] Prova de 3 criaturas × 3 estágios aprovada antes de gerar em massa.
- [ ] Admin Control Center: retry / compare / approve / reject / mark canonical (sem editar DNA).
- [ ] Genesis Certificate na UI + metadata NFT (expressos só).
- [ ] Caps de contribuição por parte física — nenhuma parte define a criatura sozinha.
- [x] Kit G1–G10 derivado do DNA (ADR 0034).
- [x] Genetic Combat Engine V1: gramática de combate, expression, birthSeed, identidade, recurso pessoal, G1–G10, budget, reações, novelty, snapshot congelado (ADR 0035).
- [x] Personal Resource por criatura: regras/thresholds/decay data-driven, tooltip gerado das regras (não glossário HEAT), HUD + chips + recusa authoritative (ADR 0036).
- [x] Deck de batalha = manifestações G1–G10 das criaturas da formação (3×10=30) + targeting FRONT→MID→BACKLINE com exceções genéticas (ADR 0037).
- [x] Combat V1.5: mesmo engine Casual/Ranked via MatchRules; Action Queue; Genetic Chain + Team Resonance; Reaction Slot; Status/Resolve/Pressure; draft Ranked 5/ban/pick 3; timer/replay foundation (ADR 0038). Casual Lab preparado e desligado.
- [ ] Sinergia evolutiva FORNALHA VIVA → FORTALEZA VIVA (após rounds/condições). Catálogo 105/455 ainda não.
- [x] Genetic Power V1 (framework): 1 poder + 10 manifestações, herança 1/3, 5 typologies, 5 doubles + PHOENIX_CYCLE, resonance, budget, flag `GENETIC_POWER_V1` (ADR 0021). Sem deploy. Sem 105+455 manuais.
- [x] Genesis Lab V2: UI laboratório, CrossPotential ≠ GenesisGrade, ovo único (EggVisualAsset), incubação Alpha por complexidade, ovos existentes normalizados (ADR 0022). Regras genéticas intactas.
- [x] Economy Foundation V2: GOLD ledger + budget 800 + Catalyst + market sink + tutorial 300. NEX inativo. Sem ERC-20 (ADR 0024). Prova e2e; parar aqui.
- [x] Idade BABY/YOUNG/ADULT com XP e evolve confirmado. Gate G1–G6 / G1–G8 / G1–G10 em `creatureLifeStageConfig.gateCardsByStage` (off no Alpha).
- [ ] Evolução de carta por cópias = branch mecânico (Predatory / Infernal / Plasma), nunca +% dano.
- [ ] Torre de Poder (Lord of Floor) e Torre de Guilda.
- [ ] Painel de balanceamento sem deploy — só após M29 ter auditoria.
- [ ] Anti-bot (fingerprint, captcha, monitoring) — depois do marketplace.
- [ ] Mobile como experiência primária — fora do MVP.

## Como avançar uma milestone

Antes de codar: escrever no chat objetivo, arquivos, banco, APIs e riscos.

Depois de codar: test + lint + typecheck + build, atualizar esta tabela, abrir ADR se a arquitetura mudou.

## Milestone Web3 — propriedade digital

**Status:** documentada, **não iniciada**. Não bloqueia M2–M6.

**Objetivo:** mint/transfer assíncrono, UserWallet, AssetOwnership, Reconciliation, contratos ERC-721/1155. Gameplay já existe no Postgres.

**Ainda não:** ERC-20 NEX; tokenizar GOLD; MetaMask obrigatório.

Detalhe: `docs/WEB3.md`.
