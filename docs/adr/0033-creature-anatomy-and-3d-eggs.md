# ADR 0033 — Anatomia expressa e ovos 3D

- Status: aceito
- Data: 2026-09-11

## Contexto

O chassi Art04 (ADR 0032) monta peças, mas as quatro cabeças e os cinco olhos do catálogo quase não mudavam a silhueta. A paleta Unity, convertida para linear e passada por ACES, saía apagada. O ovo da Lyra ainda era um placeholder 2D, embora o grau Genesis já existisse no servidor.

## Decisão

1. Cabeça e olho **expressos** deformam a malha e reposicionam chifres. Os IDs continuam os do contrato (`HEAD_01`–`04`, `EYES_01`–`05`). Sem alelo novo, sem roll no cliente.
2. A paleta do DNA é lida em sRGB, convertida para linear e depois levemente saturada (`vivify`). Não se inventa cor: só se recupera o cromado que o tone mapping come.
3. O ovo canônico é um casco 3D de 24 fragmentos. O grau público escolhe o estilo (`MOTTLED`…`CELESTIAL`). Incubação, rachadura e eclosão são fases de apresentação. **READY/hatchAt continuam do servidor.**
4. Cinco GLBs (`GXR_EGG_*`) com clipes `Egg_Incubate`, `Egg_Crack`, `Egg_Hatch` ficam em `apps/web/public/genoryx-art04/eggs`. A Lyra e o Genesis Reveal usam o mesmo controlador.

## Consequências

- Prova em `/dev/creature-visual` (seção de anatomia e ovos).
- Cliente não antecipa o filho pelo casco. Linhagem pública só gira o selo.
- ROADMAP: ovos 3D e anatomia expressa.
