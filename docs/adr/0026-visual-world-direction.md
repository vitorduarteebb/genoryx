# ADR 0026 — Direção visual do World (3D estilizado, mundo contínuo)

- Status: aceito
- Data: 2026-09-03

## Contexto

O Alpha em Phaser melhorou, mas ainda parece “telas + figurinhas”. O documento de design visual define GENORYX como RPG de mundo compartilhado: aventura, descoberta, conexão com criaturas. ADR 0025 já escolheu Unity como renderer oficial; faltava a **linguagem do mundo** (câmera, Haven, regiões, combate no chão, HUD).

O GDD §20 pedia mapas separados e fluxo Cidade → Mapa → Dungeon para reduzir complexidade. Isso continua válido como **estratégia de entrega**. O alvo de *sensação* é o contrário: o jogador atravessa o portão e o mundo muda.

## Decisão

1. A bíblia de experiência do World é `docs/VISUAL_DESIGN.md`. A Art Bible continua dona do fenótipo/DNA.
2. Alvo de apresentação: **3D estilizado** (fantasia + anime ocidental + RPG moderno), câmera **3/4 elevada**, criaturas mais visíveis que humanos, proporção 6–7 cabeças.
3. **Mundo contínuo** quando o renderer permitir: sair de Haven é portão → estrada → selvagem, sem tela preta. Colyseus pode continuar com salas por região por baixo; o cliente não deve *parecer* um load de lobby.
4. **Combate in-place**: o cenário é a arena. Câmera aproxima, UI de cartas, fim volta a andar. `/game/battle` e a arena React permanecem fallback (como as flags `WORLD_RENDERER` / `BATTLE_RENDERER`).
5. Formação **visual** Alpha: FRONT / BACK LEFT / BACK RIGHT. Motor competitivo V2 permanece FRONT / MIDDLE / BACK (ADR 0022). Não reescrever regras no cliente.
6. Haven-alvo tem distritos (Plaza, Lyra, Market, Forge, Arena, Guild) e **Genesis Core** como marco. Alpha pode ter só âncoras (NPCs já existentes) até a fatia de cidade.
7. Continente visual: Haven, Verdantis, Ashenreach, Frostveil, Whisper Marsh, Ironpeak, Emberlands, Abyss, Celestia, Westreach. Só Haven + Verdantis no chão até a ordem do GDD §99 pedir a próxima região.
8. Customização de avatar (corpo, pele, cabelo, olhos, roupa) é cosmética. Sem poder. Sem schema até a fatia de personagem visual.
9. Mobs no chão com comportamento (patrulha, fuga, aggro). Encounter e loot continuam authoritative.
10. Phaser Haven/Verdantis **não é apagado**. Vira **DEV_WORLD** (ADR 0027). Unity sem Editor/WebGL neste ambiente não desliga o Alpha.

## Consequências

- Próxima fatia de apresentação deve aproximar o Alpha deste doc (HUD, nomes, companion, combate no mapa) sem construir Ashenreach.
- Mudar o motor de batalha, resetar DNA ou vender poder com NEX continua proibido.
- Marketing e HUD não podem afirmar distritos/cavernas/clima que o build não tem.
