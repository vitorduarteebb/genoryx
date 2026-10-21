# ADR 0041 — World Visual Reboot / Isometric 2.5D V2

- Status: aceito
- Data: 2026-09-12

## Contexto

O Adventure V1 (ADR 0040) fechou o loop Haven → Green Road → batalha → retorno, mas a apresentação era um diorama Three.js de primitivas. Refinar aqueles blocos não viraria um world premium. Mobile não deve carregar vários skinned meshes no mapa.

## Decisão

1. **Camada de apresentação oficial:** isometric/ortográfico 2.5D em canvas 2D. Câmera perto, player no terço central inferior, sem órbita.
2. **Ambiente:** kit modular pintado (tiles + props) com paleta GENORYX. Mapas densos e pequenos. Troca de arte sem refazer lógica (ids de tile/prop).
3. **World Avatar:** o chassi 3D continua source-of-truth. Offscreen, gera atlas HD 8 direções × IDLE/WALK. Battle, ficha, breed, hatch e market continuam full 3D.
4. **Loop e backend intactos:** `/game/adventure`, `POST /battles/wild`, `sessionStorage` de retorno, party e Codex.
5. O diorama Three.js de primitivas deixa de ser a direção visual. Unity HavenSlice permanece fundação de cena no Editor.

## Consequências

- Mobile desenha sprites (batch 2D), não criaturas skinned no world.
- Se o bake 3D falhar, o world usa fallback pintado e declara `metrics.avatar = fallback`.
- Haven/Verdantis V2 cabem num ecrã de telefone sem praça vazia.
