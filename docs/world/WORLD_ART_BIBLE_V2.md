# GENORYX — WORLD ART BIBLE V2

Estilo oficial: **Premium Stylized Fantasy Isometric**.  
Marca: GENORYX: Genesis. Não é Habbo, Tibia, Pokémon, Albion.

## Princípio

Composição intencional, não mapa vazio.

Cada enquadramento normal:

1. 1 landmark primário
2. 1–2 âncoras secundárias
3. caminho legível
4. arquitetura/vegetação emoldurando
5. player + companion
6. vida ambiente
7. profundidade foreground / background

Referência de densidade: **30–40% navegável**, **60–70% composição**. Não lotar o walkable.

## Paletas (única fonte)

Código: `packages/config/src/world-art.ts`

### Haven

Ivory stone, warm stone, dark warm wood, terracotta, muted gold, deep green, Genesis cyan, amber windows. Sem cinza chapado.

Sentimento: segurança, civilização, magia/tecnologia Genesis, prosperidade inicial.

Luz: sol quente + fill frio. Sombras suaves e frias. Core ciano. Janelas âmbar.

### Verdantis

Deep green, forest green, moss, earth, ancient stone, water, magic cyan pontual, flower accent, fog.

Sentimento: saí da cidade. Luz filtrada, bounce verde fake, fog leve.

## Landmarks

### Genesis Core

Plataforma circular 2–3 níveis → pedestal próprio (não cilindro puro) → cristal irregular facetado → 3–6 shards → anel de energia lento → glow de chão mínimo.

Altura alvo ~4,2 m. É landmark, não obstáculo de câmera.

Mobile: emissive + baked glow. Sem refraction, sem dezenas de particles, sem vários point lights.

### South Gate

Pilares, arco, símbolo Genesis, guard posts, banners, vista de floresta atrás.

### Lyra Shrine

Base de pedra, cristal violeta (contrasta com cyan), fragmentos, pedestal de pesquisa, plantas.

### Arena approach

Só a entrada: path, 2 pilares, arco, crest, banners. Não construir a arena.

### Ancient Genesis Waystone (Green Road)

Pedra gasta, raízes, runas quase apagadas, cyan sutil, musgo.

### Crystal Hollow

Boca escura, raiz, cristais, convite de entrar. Sem dungeon nesta fatia.

## Arquitetura Haven

Um kit, três silhuetas:

- House A compacta
- House B alta
- House C larga/comercial

Toda casa: base de pedra, madeira, roof trim, janela âmbar, porta, chaminé, beiral, sombra, props próximos.

Telhado: espessura + trim + cumeeira. Nunca triângulo vermelho chapado.

Mercado: stall, canopy, counter, boxes, sacks, basket, lantern, banner.

## Vegetação

Haven: 3 árvores. Verdantis: 4 árvores. Silhuetas diferentes.

Biblioteca: bushes, grass, flowers, mushrooms, roots, rocks, logs, vines. Materiais compartilhados.

## Camadas

Foreground (folhas de borda) → Gameplay → Midground → Background → Atmosphere.  
Parallax de foreground quase imperceptível.

## Criaturas

O modelo 3D (`CreatureAssembler` / `CreatureVisualController`) é source-of-truth.  
World não redesenha DNA. Bake direcional 8 vias, IDLE/WALK/RUN, atlas + manifest, LOD near/medium/far.  
Fallback 3D/sprite marcado `WORLD_AVATAR_PENDING`.  
Âncora nos pés. Blob shadow. Escala de mundo, não de batalha. Companion lateral-atrás, não colado.

VFX de mundo = `WorldVfxProfile` (aura ~28% da batalha).

## UI

O mundo ocupa o viewport. Header compacto. Dock flutuante. Safe area.  
Tipografia: REGION pequeno / LOCATION maior.  
Nameplates só próximos/selecionados/importantes.  
Minimap lê caminhos, Core, buildings, gate, player, POIs. Mobile começa collapsed.

## Quality presets

`WORLD_MOBILE_LOW` / `WORLD_MOBILE_MEDIUM` / `WORLD_HIGH`  
Só visual. Nunca esconder informação de gameplay.

## Ordem de qualidade

1. Haven — Genesis Plaza  
2. South Gate  
3. Verdantis — Green Road  

Ashenreach / Frostveil / Abyss fora desta fatia.

## Unity + Web

Uma direção. Web prova o Alpha. Prefabs C# em `Scripts/WorldArt/` espelham o kit iso. Sem segundo estilo.
