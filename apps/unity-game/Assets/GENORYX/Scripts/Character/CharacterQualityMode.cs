using UnityEngine;

namespace Genoryx
{
    public enum CharacterQualityMode
    {
        PLAYER_LOCAL,
        PLAYER_REMOTE,
        NPC_NEAR,
        NPC_FAR
    }

    public static class CharacterQuality
    {
        public static void Apply(CharacterAssembler assembler)
        {
            if (assembler == null || assembler.visualRoot == null)
            {
                return;
            }

            var mode = assembler.quality;
            var local = mode == CharacterQualityMode.PLAYER_LOCAL;
            var far = mode == CharacterQualityMode.NPC_FAR;
            var skins = assembler.visualRoot.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            for (var i = 0; i < skins.Length; i++)
            {
                var skin = skins[i];
                skin.updateWhenOffscreen = local;
                skin.skinnedMotionVectors = local;
                skin.quality = far ? SkinQuality.Bone2 : SkinQuality.Auto;
                skin.shadowCastingMode = far
                    ? UnityEngine.Rendering.ShadowCastingMode.Off
                    : UnityEngine.Rendering.ShadowCastingMode.On;
                skin.receiveShadows = !far;
            }

            var meshes = assembler.visualRoot.GetComponentsInChildren<MeshRenderer>(true);
            for (var i = 0; i < meshes.Length; i++)
            {
                meshes[i].shadowCastingMode = far
                    ? UnityEngine.Rendering.ShadowCastingMode.Off
                    : UnityEngine.Rendering.ShadowCastingMode.On;
            }

            if (assembler.animator != null)
            {
                assembler.animator.cullingMode = far
                    ? AnimatorCullingMode.CullCompletely
                    : local
                        ? AnimatorCullingMode.AlwaysAnimate
                        : AnimatorCullingMode.CullUpdateTransforms;
                assembler.animator.applyRootMotion = false;
            }

            EnsureLod(assembler.visualRoot.gameObject, mode);
            if (far)
            {
                CharacterMeshBaker.BakeFar(assembler);
            }
        }

        static void EnsureLod(GameObject visual, CharacterQualityMode mode)
        {
            var renderers = visual.GetComponentsInChildren<Renderer>(true);
            if (renderers.Length == 0)
            {
                return;
            }

            var lod = visual.GetComponent<LODGroup>();
            if (lod == null)
            {
                lod = visual.AddComponent<LODGroup>();
            }

            var culled = mode == CharacterQualityMode.NPC_FAR ? 0.08f : 0.04f;
            lod.SetLODs(new[]
            {
                new LOD(0.55f, renderers),
                new LOD(0.18f, renderers),
                new LOD(culled, renderers)
            });
            lod.RecalculateBounds();
        }
    }
}
