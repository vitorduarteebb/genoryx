using System.Collections.Generic;
using UnityEngine;

namespace Genoryx
{
    public static class SliceMaterials
    {
        static readonly Dictionary<int, Material> Cache = new();

        public static Shader LitShader()
        {
            return Shader.Find("Universal Render Pipeline/Lit")
                ?? Shader.Find("Universal Render Pipeline/Simple Lit")
                ?? Shader.Find("Standard")
                ?? Shader.Find("Unlit/Color")
                ?? Shader.Find("Sprites/Default");
        }

        public static Material Color(Color color, float smoothness = 0.28f, Color? emission = null)
        {
            var key = color.GetHashCode() ^ smoothness.GetHashCode() ^ (emission?.GetHashCode() ?? 0);
            if (Cache.TryGetValue(key, out var existing) && existing != null)
            {
                return existing;
            }

            var shader = LitShader();
            var mat = shader != null ? new Material(shader) : new Material(Shader.Find("Hidden/InternalErrorShader"));
            mat.name = "GX_" + ColorUtility.ToHtmlStringRGB(color);
            mat.SetColor("_BaseColor", color);
            mat.SetColor("_Color", color);
            if (mat.HasProperty("_Smoothness"))
            {
                mat.SetFloat("_Smoothness", smoothness);
            }

            if (emission.HasValue)
            {
                var glow = emission.Value;
                mat.EnableKeyword("_EMISSION");
                mat.SetColor("_EmissionColor", glow);
                mat.globalIlluminationFlags = MaterialGlobalIlluminationFlags.RealtimeEmissive;
            }

            Cache[key] = mat;
            return mat;
        }

        public static void Paint(GameObject go, Color color, float smoothness = 0.28f, Color? emission = null)
        {
            var renderer = go.GetComponent<Renderer>();
            if (renderer == null)
            {
                return;
            }

            renderer.sharedMaterial = Color(color, smoothness, emission);
        }

        public static void ApplySky()
        {
            var sky = Shader.Find("Skybox/Procedural");
            if (sky != null)
            {
                var mat = new Material(sky);
                if (mat.HasProperty("_SkyTint"))
                {
                    mat.SetColor("_SkyTint", new Color(0.38f, 0.52f, 0.72f));
                }

                if (mat.HasProperty("_GroundColor"))
                {
                    mat.SetColor("_GroundColor", new Color(0.28f, 0.32f, 0.22f));
                }

                if (mat.HasProperty("_AtmosphereThickness"))
                {
                    mat.SetFloat("_AtmosphereThickness", 1.05f);
                }

                RenderSettings.skybox = mat;
                DynamicGI.UpdateEnvironment();
            }
        }
    }
}
