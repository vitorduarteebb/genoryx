using UnityEngine;

namespace Genoryx.WorldArt
{
    public static class WorldArtLighting
    {
        public static void ApplyHaven()
        {
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogColor = new Color(0.82f, 0.77f, 0.66f);
            RenderSettings.fogDensity = 0.012f;
            RenderSettings.ambientLight = new Color(0.62f, 0.58f, 0.5f);
            var sun = WorldSliceFactory.NewLight("HavenSun", LightType.Directional, new Color(1f, 0.94f, 0.78f), 1.28f);
            sun.transform.rotation = Quaternion.Euler(48f, -32f, 0f);
            var fill = WorldSliceFactory.NewLight("HavenFill", LightType.Directional, new Color(0.48f, 0.63f, 0.77f), 0.3f);
            fill.transform.rotation = Quaternion.Euler(18f, 138f, 0f);
            fill.shadows = LightShadows.None;
        }

        public static void ApplyVerdantis()
        {
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogColor = new Color(0.35f, 0.48f, 0.36f);
            RenderSettings.fogDensity = 0.018f;
            RenderSettings.ambientLight = new Color(0.32f, 0.42f, 0.3f);
            var sun = WorldSliceFactory.NewLight("VerdantisSun", LightType.Directional, new Color(0.91f, 0.94f, 0.78f), 0.92f);
            sun.transform.rotation = Quaternion.Euler(38f, -48f, 0f);
            var fill = WorldSliceFactory.NewLight("VerdantisFill", LightType.Directional, new Color(0.23f, 0.42f, 0.28f), 0.4f);
            fill.transform.rotation = Quaternion.Euler(12f, 150f, 0f);
            fill.shadows = LightShadows.None;
        }
    }
}
