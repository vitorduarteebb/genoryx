using UnityEngine;

namespace Genoryx
{
    public static class CreatureKit
    {
        public static GameObject PyronBaby(string name, Vector3 pos)
        {
            var root = new GameObject(name);
            root.transform.position = pos;
            var body = Part(root, "Body", PrimitiveType.Sphere, new Vector3(0f, 0.34f, 0.02f), new Vector3(0.52f, 0.46f, 0.5f), new Color(0.92f, 0.36f, 0.14f), 0.35f);
            Part(root, "Belly", PrimitiveType.Sphere, new Vector3(0f, 0.26f, 0.16f), new Vector3(0.34f, 0.28f, 0.26f), new Color(0.96f, 0.7f, 0.3f), 0.4f);
            Part(root, "Head", PrimitiveType.Sphere, new Vector3(0f, 0.52f, 0.16f), new Vector3(0.36f, 0.32f, 0.34f), new Color(0.94f, 0.4f, 0.16f), 0.34f);
            Part(root, "Snout", PrimitiveType.Sphere, new Vector3(0f, 0.46f, 0.32f), new Vector3(0.2f, 0.14f, 0.18f), new Color(0.95f, 0.55f, 0.22f), 0.38f);
            Part(root, "EarL", PrimitiveType.Sphere, new Vector3(-0.16f, 0.68f, 0.08f), new Vector3(0.12f, 0.26f, 0.1f), new Color(0.82f, 0.26f, 0.1f), 0.28f);
            Part(root, "EarR", PrimitiveType.Sphere, new Vector3(0.16f, 0.68f, 0.08f), new Vector3(0.12f, 0.26f, 0.1f), new Color(0.82f, 0.26f, 0.1f), 0.28f);
            Part(root, "Flame", PrimitiveType.Sphere, new Vector3(0f, 0.74f, 0.02f), new Vector3(0.16f, 0.28f, 0.16f), new Color(1f, 0.72f, 0.16f), 0.5f, new Color(2f, 0.85f, 0.12f));
            Part(root, "EyeL", PrimitiveType.Sphere, new Vector3(-0.08f, 0.54f, 0.3f), Vector3.one * 0.07f, new Color(0.08f, 0.05f, 0.04f), 0.05f);
            Part(root, "EyeR", PrimitiveType.Sphere, new Vector3(0.08f, 0.54f, 0.3f), Vector3.one * 0.07f, new Color(0.08f, 0.05f, 0.04f), 0.05f);
            Part(root, "LegFL", PrimitiveType.Capsule, new Vector3(-0.12f, 0.16f, 0.12f), new Vector3(0.08f, 0.1f, 0.08f), new Color(0.78f, 0.28f, 0.1f), 0.25f);
            Part(root, "LegFR", PrimitiveType.Capsule, new Vector3(0.12f, 0.16f, 0.12f), new Vector3(0.08f, 0.1f, 0.08f), new Color(0.78f, 0.28f, 0.1f), 0.25f);
            Part(root, "LegBL", PrimitiveType.Capsule, new Vector3(-0.12f, 0.16f, -0.1f), new Vector3(0.08f, 0.1f, 0.08f), new Color(0.78f, 0.28f, 0.1f), 0.25f);
            Part(root, "LegBR", PrimitiveType.Capsule, new Vector3(0.12f, 0.16f, -0.1f), new Vector3(0.08f, 0.1f, 0.08f), new Color(0.78f, 0.28f, 0.1f), 0.25f);
            Part(root, "Tail", PrimitiveType.Sphere, new Vector3(0f, 0.3f, -0.26f), new Vector3(0.16f, 0.14f, 0.28f), new Color(0.88f, 0.32f, 0.12f), 0.3f);
            root.AddComponent<BabyMotion>().body = body.transform;
            return root;
        }

        static GameObject Part(GameObject parent, string name, PrimitiveType type, Vector3 localPos, Vector3 scale, Color color, float smoothness, Color? emission = null)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetParent(parent.transform, false);
            go.transform.localPosition = localPos;
            go.transform.localScale = scale;
            SliceMaterials.Paint(go, color, smoothness, emission);
            var col = go.GetComponent<Collider>();
            if (col != null)
            {
                Object.DestroyImmediate(col);
            }

            return go;
        }
    }

    public class BabyMotion : MonoBehaviour
    {
        public Transform body;
        Vector3 last;

        void Start()
        {
            last = transform.position;
        }

        void LateUpdate()
        {
            var speed = (transform.position - last).magnitude / Mathf.Max(Time.deltaTime, 0.0001f);
            last = transform.position;
            var bounce = Mathf.Abs(Mathf.Sin(Time.time * (speed > 0.4f ? 10f : 3.2f))) * (speed > 0.4f ? 0.05f : 0.018f);
            if (body != null)
            {
                var p = body.localPosition;
                body.localPosition = new Vector3(p.x, 0.34f + bounce, p.z);
            }
        }
    }
}
