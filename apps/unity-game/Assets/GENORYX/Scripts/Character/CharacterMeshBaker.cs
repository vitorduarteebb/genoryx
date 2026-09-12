using System.Collections.Generic;
using UnityEngine;

namespace Genoryx
{
    public static class CharacterMeshBaker
    {
        public static void BakeFar(CharacterAssembler assembler)
        {
            if (assembler == null || assembler.visualRoot == null || assembler.quality != CharacterQualityMode.NPC_FAR)
            {
                return;
            }

            if (assembler.visualRoot.Find("NPC_FAR_Combined") != null)
            {
                return;
            }

            var skins = assembler.visualRoot.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            var combine = new List<CombineInstance>();
            Material mat = null;
            foreach (var skin in skins)
            {
                if (!skin.gameObject.activeInHierarchy || skin.sharedMesh == null)
                {
                    continue;
                }

                var baked = new Mesh { name = skin.name + "_baked" };
                skin.BakeMesh(baked, true);
                combine.Add(new CombineInstance
                {
                    mesh = baked,
                    transform = assembler.visualRoot.worldToLocalMatrix * skin.transform.localToWorldMatrix
                });
                mat ??= skin.sharedMaterial;
                skin.enabled = false;
            }

            if (combine.Count == 0)
            {
                return;
            }

            var go = new GameObject("NPC_FAR_Combined");
            go.transform.SetParent(assembler.visualRoot, false);
            var filter = go.AddComponent<MeshFilter>();
            var mesh = new Mesh { name = "NPC_FAR_Combined" };
            mesh.CombineMeshes(combine.ToArray(), true, true);
            filter.sharedMesh = mesh;
            var renderer = go.AddComponent<MeshRenderer>();
            renderer.sharedMaterial = mat;
            renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        }
    }
}
