# Pipeline Meshy — personagem humanoide

Só endpoints oficiais. Cliente de criaturas (`/openapi/v1/multi-image-to-3d`) não é usado aqui.

## Chave

`MESHY_API_KEY` em environment / `.env` / `/opt/nexora/.env.production`.

Nunca: código, git, `NEXT_PUBLIC_*`, logs, chat, Unity assets.

## Endpoints

| Etapa | Método | URL |
| --- | --- | --- |
| Preview / Refine | POST/GET | `https://api.meshy.ai/openapi/v2/text-to-3d` |
| Remesh (se >300k faces) | POST/GET | `https://api.meshy.ai/openapi/v1/remesh` |
| Rig | POST/GET | `https://api.meshy.ai/openapi/v1/rigging` |
| Animação extra | POST/GET | `https://api.meshy.ai/openapi/v1/animations` |
| Catálogo `action_id` | GET | `https://api.meshy.ai/web/public/animations/resources` |

## Fluxo FASE 1

```
prompt-base + prompt do Tamer
  → preview (pose_mode: a-pose, should_remesh, target_polycount ~30000, target_formats: [glb], auto_size, origin_at: bottom)
  → refine (enable_pbr, texture_resolution: 2k, texture_prompt)
  → remesh só se faces > 300000
  → rigging (input_task_id do refine/remesh, height_meters: 1.8)
     devolve rigged_character_glb + basic_animations walk/run
  → animations action_id Idle=0 (e interact/hit/death se o catálogo tiver)
  → download GLB/FBX
  → StreamingAssets + Assets/GENORYX/Characters/Phase1
  → Unity glTFast / Humanoid
```

## Prompt-base

Não citar Albion. Albion é referência interna de UX, não de arte.

> Stylized premium 3D fantasy creature-tamer character for an isometric modern MMORPG. Clean strong silhouette, readable from elevated 3/4 camera, modern fantasy explorer clothing, subtle genetic crystal technology, detailed but optimized game-ready geometry, appealing proportions, expressive stylized face, high quality cloth/leather/metal materials, GENORYX original universe, neutral T-pose/A-pose where appropriate.

## Manifest

`apps/unity-game/Assets/GENORYX/Characters/MeshyAssetManifest.json`

Campos: `assetId`, `meshyTaskId`, `prompt`, `type`, `status`, `localPath`, `generatedAt`, `version`, `consumedCredits`.

Job `SUCCEEDED` com arquivo local válido **não** gera de novo.

## CLI

```bash
npm run character:phase1
```

Lê `MESHY_API_KEY`. Resume jobs do manifest. Não gera FASE 2.

## Editor Unity

`GENORYX > Character Asset Pipeline` dispara o CLI e reimporta.

## Custos

A API devolve `consumed_credits` por task. O pipeline soma e grava no manifest. Preview + refine + rig + idle é o orçamento da FASE 1.

## Importação Unity

1. GLB em `StreamingAssets/GENORYX/Characters/phase1/` (runtime glTFast).
2. Cópia em `Assets/GENORYX/Characters/Phase1/` (import Editor, Avatar Humanoid).
3. `applyRootMotion = false`.
4. Se o Avatar falhar: `BoneMapper`, não lógica de gameplay nos nomes Meshy.
