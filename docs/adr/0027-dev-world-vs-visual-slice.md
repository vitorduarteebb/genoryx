# ADR 0027 — DEV_WORLD (Phaser) vs Vertical Slice visual (Unity)

- Status: aceito
- Data: 2026-09-03

## Contexto

O mapa Phaser em `/game` prova movimento, colisão, multiplayer e encounter. Visualmente é câmera de cima, tiles visíveis, casas-retângulo, escala quebrada, NPCs clones, HUD de site. Continuar texturizando esse mapa gastaria tempo salvando uma direção que a bíblia (`docs/VISUAL_DESIGN.md`) rejeita.

## Decisão

1. O World Phaser (Haven + Verdantis atuais) chama-se **DEV_WORLD**. É protótipo técnico. Não é a fundação estética. Não receber art pass de “salvar o tilemap”.
2. A fundação visual começa numa **Vertical Slice Unity 3D**:
   - Genesis Plaza (praça + Genesis Core)
   - uma rua orgânica
   - portão sul
   - borda de Verdantis visível além do portão
   - câmera **45°–55°** pitch, yaw **35°–45°**, FOV **35°–45°**, distância ~20 m (a tela mostra uma praça, não a cidade inteira)
   - escala oficial: humano 1,8 m; porta 2,2 m; casa 4–7 m; rua 5–8 m; Genesis Core 12–20 m; cidade maior que um ecrã
   - companion no chão (segue, para, cheira, alcança)
   - NPCs com papéis distintos (não seis clones)
   - HUD de jogo (avatar, HP, criatura ativa, mini-mapa, hotbar). Menus web atrás de ícones.
3. Chunks / additive scenes por baixo; para o jogador o mundo é contínuo (Haven → South Gate → Forest Edge → …).
4. `/game` continua o Alpha jogável (servidor, loop). Mostra selo **DEV_WORLD**. `/game-unity` hospeda a slice quando houver WebGL.
5. Sem Unity Editor neste ambiente: a slice entra como **builder de cena** (`HavenSliceBuilder`) + scripts. WebGL oficial depois do build local.
6. Phaser não é apagado. Regras, ledger e Colyseus não mudam.

## Consequências

- Proibido: outro passe de árvores-círculo / casas-retângulo no Phaser como se fosse o jogo.
- Permitido no DEV_WORLD: HUD de jogo, selo de debug, companion/nomes — sem fingir 3D.
- Próximo critério visual: screenshot da slice (praça + Core + rua + portão + criatura) com câmera 3/4. Não screenshot do tilemap.
