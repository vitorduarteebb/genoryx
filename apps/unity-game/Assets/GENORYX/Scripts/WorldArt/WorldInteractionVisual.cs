using UnityEngine;

namespace Genoryx.WorldArt
{
    public static class WorldInteractionVisual
    {
        public static GameObject SpawnGroundMarker(Transform parent)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            go.name = "WorldInteractionMarker";
            go.transform.SetParent(parent, false);
            go.transform.localPosition = new Vector3(0f, 0.03f, 0f);
            go.transform.localScale = new Vector3(1.15f, 0.02f, 1.15f);
            SliceMaterials.Paint(go, WorldArtPalettes.GenesisCyan, 0.2f, WorldArtPalettes.GenesisCyan * 0.25f);
            var collider = go.GetComponent<Collider>();
            if (collider != null)
            {
                Object.Destroy(collider);
            }

            return go;
        }
    }

    public static class CreatureWorldAvatarRenderer
    {
        public const float BabyScale = 0.78f;
        public const float YoungScale = 0.92f;
        public const float AdultScale = 1.08f;
        public static readonly Vector3 CompanionOffset = new(-0.82f, 0f, 0.62f);

        public static float ScaleForStage(string lifeStage)
        {
            return lifeStage switch
            {
                "BABY" => BabyScale,
                "YOUNG" or "JUVENILE" => YoungScale,
                _ => AdultScale,
            };
        }

        public static void ApplyGroundAnchor(Transform actor, float footY = 0f)
        {
            var pos = actor.position;
            actor.position = new Vector3(pos.x, footY, pos.z);
        }

        public static GameObject SpawnBlobShadow(Transform actor)
        {
            var shadow = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            shadow.name = "WorldBlobShadow";
            shadow.transform.SetParent(actor, false);
            shadow.transform.localPosition = new Vector3(0f, 0.02f, 0f);
            shadow.transform.localScale = new Vector3(0.9f, 0.015f, 0.55f);
            SliceMaterials.Paint(shadow, new Color(0.08f, 0.06f, 0.05f, 0.45f), 0.05f);
            var collider = shadow.GetComponent<Collider>();
            if (collider != null)
            {
                Object.Destroy(collider);
            }

            return shadow;
        }
    }
}
