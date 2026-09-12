using UnityEngine;

namespace Genoryx
{
    public static class CharacterPerformanceValidator
    {
        public struct Report
        {
            public int triangles;
            public int materials;
            public int renderers;
            public int bones;
            public string textures;
        }

        public static Report Measure(GameObject root)
        {
            var report = new Report();
            var meshFilters = root.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            report.renderers = meshFilters.Length + root.GetComponentsInChildren<MeshRenderer>(true).Length;
            var unique = new System.Collections.Generic.HashSet<Material>();
            foreach (var skin in meshFilters)
            {
                if (skin.sharedMesh != null)
                {
                    report.triangles += skin.sharedMesh.triangles.Length / 3;
                    report.bones += skin.bones != null ? skin.bones.Length : 0;
                }

                foreach (var mat in skin.sharedMaterials)
                {
                    if (mat != null)
                    {
                        unique.Add(mat);
                    }
                }
            }

            foreach (var mesh in root.GetComponentsInChildren<MeshFilter>(true))
            {
                if (mesh.sharedMesh != null)
                {
                    report.triangles += mesh.sharedMesh.triangles.Length / 3;
                }
            }

            report.materials = unique.Count;
            report.textures = "shared + MPB";
            Debug.Log($"[GENORYX] Character performance: tris={report.triangles} mats={report.materials} renderers={report.renderers} bones={report.bones}");
            return report;
        }
    }
}
