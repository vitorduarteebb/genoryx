using UnityEngine;

namespace Genoryx.WorldArt
{
    public static class WorldArtVfx
    {
        public const float WorldAuraScale = 0.28f;

        public static GameObject SpawnSoftGlow(Transform parent, Color color, float radius = 0.8f)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            go.name = "WorldSoftGlow";
            go.transform.SetParent(parent, false);
            go.transform.localPosition = new Vector3(0f, 0.4f, 0f);
            go.transform.localScale = Vector3.one * radius;
            SliceMaterials.Paint(go, color, 0.1f, color * 0.35f);
            var collider = go.GetComponent<Collider>();
            if (collider != null)
            {
                Object.Destroy(collider);
            }

            return go;
        }
    }
}
