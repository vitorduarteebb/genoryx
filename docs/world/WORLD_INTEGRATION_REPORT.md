# WORLD INTEGRATION REPORT — 2026-09-12

**Atualização ADR 0042:** o kit Canvas deixou de ser arte de produção. Runtime permanece. Pipeline: `docs/world/WORLD_ASSET_PIPELINE.md`. Este relatório descreve o merge V2 anterior (TEMP/programmer art).


Agente: Integration + Visual QA. Sem novo renderer. Sem deploy até QA local.

## A. Merge

**World Engineer:** canvas iso em `apps/web/src/lib/iso/*`, `/game/adventure`, tap-to-move, Haven → Green Road → `POST /battles/wild` → return `sessionStorage`, party companion, Florune wild.

**Art Agent:** `packages/config/src/world-art.ts`, `apps/web/src/lib/world-art/*`, Unity `Scripts/WorldArt/*`, docs em `docs/world/`.

**Integrado:**
- `buildIsoKit()` agora entrega Art Kit V2 (`iso/kit.ts` reexporta `buildWorldArtKit`).
- Baker único: `iso/avatar.ts` → `world-art/creature-world-avatar`.
- Tamer V2 + NPCs V2 via `iso/tamer.ts`.
- Minimap V2 `paintWorldMinimap`.
- Densidade visual append (POI IDs intactos). House C reposicionada para não colidir com House A.
- HUD skin + `WorldCompactHeader` + minimap collapsed no portrait.
- Paletas de céu/fog do config.
- Quality presets no FPS de animação.
- Companion offset lateral-atrás.
- Marker de chão no selecionado (sem neon).
- Fade simples se árvore cobrir o player.
- Motes leves Haven/Verdantis.

## B. Conflitos

| Duplicata | Escolha | Por quê |
|---|---|---|
| `iso/kit.ts` vs `world-art/iso-kit.ts` | Art V2 oficial; iso reexporta | Kit Engineer era primitive; mesmas chaves de prop |
| `iso/avatar.ts` vs `creature-world-avatar.ts` | Art baker | LOD, âncora, shadow, RUN, `WORLD_AVATAR_PENDING` |
| `iso/tamer.ts` vs `world-art/tamer.ts` | Art V2 | 96×148, sombra, leitura mobile |
| minimap local vs `paintWorldMinimap` | Art V2 | paths + landmarks |
| House C em (5.1, 4.2) | movida para (5.7, −2.2) | Evitar overlap com House A; block novo só visual/colisão |

Não há dois renderers. Production route = canvas iso.

## C. World Avatar

Oficial: `bakeCreatureWorldAvatar` (3D `CreatureVisualController` → atlas 8 dirs). Cache em memória por `visualIdentity` + LOD. Fallback elegante + `console.warn`. Disco = NEEDS_ART V2.1.

Companion = lead da party (`/party` then `/creatures`). Wild = chassis Florune real, não sprite genérico.

## D. Genesis Plaza

Antes: primitivas, praça vazia, Core cilindro.  
Depois (production-intent): Core V2, House A/B/C, market, Lyra violeta, arena approach, South Gate, vegetação, NPCs, paths, motes. TEMP, não sculpt final.

## E. Green Road

Paleta/fog/vegetação próprias, waystone, hollow, water tile, wild Florune. IDs de POI/wild inalterados.

## F. Mobile

Zoom portrait ~1.44 (não 1.12 no Core). Dock flutuante. Minimap collapsed + tap. Safe-area no header/dock. Landscape: dock já ia à direita no CSS Engineer; preservado.

FPS: medido no HUD do canvas (não assumir 72 fps de relatório anterior). Bake 3D continua one-shot; pode custar o primeiro frame no telefone.

## G. Assets

Ver `WORLD_ASSET_MANIFEST_V2.md`. Kit integrado = **TEMP**. READY só paletas e quality config. NEEDS_ART: wall modules, parallax, atlas disco, tamer pintado oficial.

## H. Functional QA (local)

- Typecheck web: ok
- Testes web (iso maps, return, projection, visuais criatura): ok
- Testes `@nexora/game-engine` vitest: ok (combat não tocado nesta fatia)
- Loop batalha autenticado: só no Alpha pós-deploy (precisa sessão)

## I. Performance

Quality LOW/MED/HIGH altera particles e FPS de animação, não esconde POI/wild/path. Occlusion fade é alpha, não cull de informação.

Captura Edge headless: `docs/world/shots/world-art-board.png` (Alpha live). Framing alinhado ao renderer: player no terço inferior, Core/portão/casas no FOV, zoom ~1.44–1.48, mapa `havenMap()` real.

Kit continua **TEMP**, não sculpt final:
- Copas irregulares (Haven nuvem / Verdantis mais alta); ainda pintadas, não atlas
- Casas com beiral, viga e degrau; silhueta ainda iso-box
- Grade de grama visível; praça menos contrastada
- Tamer placeholder

NEEDS_ART: wall modules, parallax, atlas em disco, tamer pintado oficial.

Loop autenticado Haven → Florune → batalha → return: ainda só no celular logado. HTTP 200 da rota não substitui isso.

## J. Deploy

Republicado no Alpha (working tree). Conflito Docker `*_nexora-alpha-api` limpo em `vps-up-api-web.sh`. Build Next OK.

- `GET https://alpha.genoryx.com.br/` → 200
- `GET https://alpha.genoryx.com.br/game/adventure` → 200
- `GET https://alpha.genoryx.com.br/dev/world-art` → 200
- API health → `ok` (`postgres: up`, `redis: up`)

Loop autenticado Haven → Florune → batalha → return: validar no celular logado. HTTP 200 da rota não substitui isso.
