# ADR 0040 — World Adventure V1 (diorama 3D + loop jogável)

- Status: aceito
- Data: 2026-09-12

## Contexto

A HavenSlice Unity (ADR 0027) era um diorama de escala: praça, Core, rua, portão, CrowdTest de 20 atores, movimento só WASD, sem tap, sem transição para Verdantis, sem encounter que voltasse ao mapa. O Alpha jogável continuava no Phaser DEV_WORLD. Não há Unity Editor neste ambiente; um WebGL Haven não entra no Alpha sem build local.

O coração do GENORYX é criatura, genética, cards e combate tático. O mundo serve isso: dioramas compactos, não MMO aberto.

## Decisão

1. **Formato oficial:** 3D stylized diorama world. Áreas pequenas (Genesis Plaza, South Gate, Green Road, Lumina Grove stub). Sem continente aberto.
2. **Unity é a fundação de cena.** `HavenSliceBuilder` v9 + `VerdantisGreenRoadBuilder` + systems (`WorldAreaManager`, câmera 3/4 sem órbita livre, tap-to-move, companion `CreatureAssembler`, wild 3D, encounter, transição com fade). CrowdTest removido. 1 companion visível.
3. **Alpha jogável do loop agora é `/game/adventure`.** Three.js + chassi Art04 (`CreatureVisualController`), tap-to-move, Haven → Verdantis, Florune no mapa, `POST /battles/wild`, retorno via `sessionStorage`. Phaser DEV_WORLD permanece; `/game` não muda de destino.
4. **Combate não entra no mapa.** Encounter abre a arena React existente. Cliente não inventa loot/XP/gold.
5. **Mobile-first.** Clique/toque no chão move. Toque em NPC/POI/criatura abre UI contextual. Sem hover, sem hotbar, sem dual-stick.

## Consequências

- WebGL Haven continua build local (Play em `HavenSlice`). O jogador no Alpha usa `/game/adventure`.
- Ashenreach / Frostveil / Abyss / dungeons completas ficam fora desta fatia.
- Nav do shell ganha **Mundo**. Arena modo Adventure aponta para o mapa.
