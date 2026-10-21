using UnityEngine;

namespace Genoryx
{
    public static class WorldSliceFactory
    {
        public static GameObject Prim(string name, PrimitiveType type, Vector3 pos, Vector3 scale, Color color, float smoothness, Quaternion rotation = default, Color? emission = null, bool ground = false, bool obstacle = false)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetPositionAndRotation(pos, rotation == default ? Quaternion.identity : rotation);
            go.transform.localScale = scale;
            SliceMaterials.Paint(go, color, smoothness, emission);
            if (ground)
            {
                MarkGround(go);
            }

            if (obstacle)
            {
                MarkObstacle(go);
            }

            return go;
        }

        public static GameObject Child(GameObject parent, string name, PrimitiveType type, Vector3 localPos, Vector3 scale, Color color, float smoothness, Quaternion localRot = default, Color? emission = null, bool obstacle = false)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetParent(parent.transform, false);
            go.transform.localPosition = localPos;
            go.transform.localRotation = localRot == default ? Quaternion.identity : localRot;
            go.transform.localScale = scale;
            SliceMaterials.Paint(go, color, smoothness, emission);
            if (obstacle)
            {
                MarkObstacle(go);
            }

            return go;
        }

        public static Light NewLight(string name, LightType type, Color color, float intensity, float range = 12f)
        {
            var go = new GameObject(name);
            var light = go.AddComponent<Light>();
            light.type = type;
            light.color = color;
            light.intensity = intensity;
            light.range = range;
            light.shadows = type == LightType.Directional ? LightShadows.Soft : LightShadows.None;
            return light;
        }

        public static void MarkGround(GameObject go)
        {
            if (go.GetComponent<WorldGround>() == null)
            {
                go.AddComponent<WorldGround>();
            }
        }

        public static void MarkObstacle(GameObject go)
        {
            if (go.GetComponent<WorldObstacle>() == null)
            {
                go.AddComponent<WorldObstacle>();
            }
        }

        public static void HitPad(GameObject parent, float radius)
        {
            var pad = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            pad.name = "HitPad";
            pad.transform.SetParent(parent.transform, false);
            pad.transform.localPosition = new Vector3(0f, 0.9f, 0f);
            pad.transform.localScale = Vector3.one * Mathf.Max(1.1f, radius * 2f);
            var render = pad.GetComponent<Renderer>();
            if (render != null)
            {
                render.enabled = false;
            }
        }

        public static WorldInteractable Interact(GameObject go, string id, string name, string prompt, WorldInteractKind kind, string body = "", string payload = "", float radius = 2.4f)
        {
            var item = go.GetComponent<WorldInteractable>() ?? go.AddComponent<WorldInteractable>();
            item.id = id;
            item.displayName = name;
            item.prompt = prompt;
            item.body = body;
            item.kind = kind;
            item.payload = payload;
            item.interactRadius = radius;
            HitPad(go, 1.1f);
            return item;
        }

        public static void Discovery(string id, string toast, Vector3 pos, float radius)
        {
            var go = new GameObject("Discovery_" + id);
            go.transform.position = pos;
            var zone = go.AddComponent<WorldDiscoveryZone>();
            zone.discoveryId = id;
            zone.toast = toast;
            zone.radius = radius;
        }

        public static GameObject Tree(Vector3 pos, float scale, Color? canopy = null)
        {
            var leaf = canopy ?? new Color(0.16f, 0.36f, 0.18f);
            Prim("TreeTrunk", PrimitiveType.Cylinder, pos + Vector3.up * (1.55f * scale), new Vector3(0.42f, 1.55f, 0.42f) * scale, new Color(0.3f, 0.2f, 0.13f), 0.12f, obstacle: true);
            Prim("TreeCanopy", PrimitiveType.Sphere, pos + Vector3.up * (4.1f * scale), Vector3.one * (3.3f * scale), leaf, 0.14f);
            Prim("TreeCanopyB", PrimitiveType.Sphere, pos + new Vector3(0.55f * scale, 3.5f * scale, -0.3f * scale), Vector3.one * (2.2f * scale), leaf * 1.15f, 0.14f);
            return null;
        }
    }
}
