using UnityEngine;

namespace Genoryx
{
    public static class ModularRendererValidator
    {
        public static string Validate(Renderer renderer, Transform root, string label)
        {
            if (renderer == null)
            {
                return "FAIL " + label + " renderer null";
            }

            if (!renderer.gameObject.activeInHierarchy)
            {
                return "FAIL " + label + " inactive";
            }

            if (!renderer.enabled)
            {
                return "FAIL " + label + " disabled";
            }

            Mesh mesh = null;
            var skin = renderer as SkinnedMeshRenderer;
            if (skin != null)
            {
                mesh = skin.sharedMesh;
                if (skin.bones == null || skin.bones.Length == 0)
                {
                    return "FAIL " + label + " bones empty";
                }

                if (skin.rootBone == null)
                {
                    return "FAIL " + label + " rootBone null";
                }
            }
            else if (renderer.TryGetComponent<MeshFilter>(out var filter))
            {
                mesh = filter.sharedMesh;
            }

            if (mesh == null || mesh.vertexCount <= 0)
            {
                return "FAIL " + label + " mesh empty";
            }

            if (renderer.sharedMaterial == null)
            {
                return "FAIL " + label + " material null";
            }

            var bounds = renderer.bounds;
            if (bounds.size.sqrMagnitude < 0.0001f)
            {
                return "FAIL " + label + " bounds zero";
            }

            if (root != null && Vector3.Distance(bounds.center, root.position + Vector3.up) > 8f)
            {
                return "FAIL " + label + " bounds far from CharacterRoot";
            }

            return "OK " + label + " verts=" + mesh.vertexCount + " visible=" + renderer.isVisible;
        }
    }
}
