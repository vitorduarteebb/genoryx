# ADR 0042 — World asset-driven (arte real, runtime intacto)

- Status: aceito
- Data: 2026-09-12
- Supersede parcial: ADR 0041 §2 (kit modular **pintado em código** como arte de produção)

## Contexto

O Adventure V2 (ADR 0041) fechou o runtime isométrico: movimento, colisão, POIs, encounter, retorno de batalha, companion/wild via atlas 3D. Isso permanece.

A apresentação do **cenário** foi gerada em Canvas (`drawHouse`, `drawTree`, tiles-diamante). Isso é programmer art. Refinar primitivas não produz o mundo GENORYX. A criatura parece de outro jogo porque é o único elemento com modelo real.

## Decisão

1. **Runtime aprovado.** Não reescrever routing, movement, navigation, collision, interaction, encounters, battle, return state, world state, creature data, mobile input.
2. **O renderer não inventa arte.** Ele posiciona, ordena profundidade, anima, colide, oclui e enquadra. Sprites/plates vêm de um `WorldAssetRegistry`.
3. **Arte procedural atual = debug fallback** (`debugArt`). Nunca production art. Sem novo art pass em casas/árvores/tiles/NPCs geométricos.
4. **Ambiente:** large plates (chão/praça/estrada com sombras baked) + sprites de estrutura/décor/foreground. Grid lógico invisível. Sem quadrícula visível quando houver plate READY.
5. **Camadas:** background, base, architecture, props, actors, foreground, atmosphere.
6. **Atores:** Creature World Avatar (3D → atlas 8 dirs) permanece. Character World Avatar segue o mesmo pipeline. NPCs por archetype (GUARD, MERCHANT, RESEARCHER, BREEDER, ADVENTURER, CIVILIAN). Sem rectangle-person em produção.
7. **Assets ausentes = `NEEDS_ART`.** Não fingir que placeholder é final.
8. **Mobile:** WebP/AVIF, 1x/2x, load por área, unload da área anterior.
9. **Hitmap** (walk/collision/POI/NPC/exit) só em debug.
10. **Alpha:** não publicar outro repaint de primitivas. Publicar quando existir pelo menos uma composição artística READY da Genesis Plaza.

## Consequências

- `/game/adventure` continua a rota jogável. Sem plate READY, o mundo usa debug art e declara isso.
- Produção de arte é fora do renderer: conceito → plates/sprites → registry `READY` → encaixe.
- Unity HavenSlice não muda neste ADR; o Alpha web é o consumidor.
