# ADR 0028 — Sistema de personagem modular 3D

- Status: aceito (FASE 1)
- Data: 2026-09-03

## Contexto

A slice Haven usa `CharacterKit` (primitivas). Isso prova escala e silhueta, mas não é o avatar jogável. O jogador precisa criar um Tamer 3D estilizado, persistir IDs de aparência e ver o mesmo corpo em Haven, com Idle/Walk/Run. A Meshy já está integrada para criaturas (ADR 0016, só Multi-Image-to-3D, sem auto-rig de quadrúpede). Para humanoide, a Meshy oferece Text-to-3D, Rigging e Animation — endpoints oficiais distintos.

## Decisão

1. Arquitetura definitiva: `CharacterAppearance` (IDs) + `CharacterAssembler` + skeleton canônico Humanoid. Gameplay/network não dependem de nomes de bone da Meshy.
2. FASE 1 gera **um** personagem completo (corpo+roupa+cabelo+rig+Idle/Walk/Run) e para para validação visual. FASE 2 (catálogo modular) só depois da aprovação.
3. Endpoints Meshy usados, sem inventar:
   - `POST/GET https://api.meshy.ai/openapi/v2/text-to-3d` (`preview` → `refine`)
   - `POST/GET https://api.meshy.ai/openapi/v1/remesh` só se faces > 300k
   - `POST/GET https://api.meshy.ai/openapi/v1/rigging` (`height_meters: 1.8`)
   - `POST/GET https://api.meshy.ai/openapi/v1/animations` (`rig_task_id` + `action_id`)
4. `MESHY_API_KEY` só em environment / `.env` / VPS. Nunca código, git, frontend, logs.
5. Persistência: `Character.appearanceJson` + `appearanceConfirmed`. Cosmético não altera Gold, NEX, dano, genes, captura nem MMR.
6. Movimento continua no `PlayerMotor` / servidor. `applyRootMotion = false`. Velocidade dirige a animação.
7. Cliente de criaturas (`multi-image-to-3d`) não muda. Personagem usa cliente humanoide separado.
8. Unity carrega o GLB FASE 1 via glTFast em runtime. Sem cápsula/cubo no lugar do Tamer se o asset falhar — a integração é corrigida.

## Consequências

- Placeholder de primitivas some no **player** da HavenSlice.
- NPCs podem continuar no kit até a FASE 2.
- Unity no Alpha (`WORLD_RENDERER=unity`) continua bloqueado até a slice/personagem serem aprovados (ADR 0027).
- Jobs Meshy ficam em `MeshyAssetManifest.json` para não gastar crédito de novo.
