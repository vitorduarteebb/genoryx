using UnityEngine;

namespace Genoryx
{
    public class AmbientController : MonoBehaviour
    {
        public string profile = "haven";

        public void Apply(string next)
        {
            profile = next;
            if (next == "verdantis")
            {
                RenderSettings.fogColor = new Color(0.42f, 0.56f, 0.48f);
                RenderSettings.fogDensity = 0.016f;
                RenderSettings.ambientSkyColor = new Color(0.42f, 0.54f, 0.46f);
                RenderSettings.ambientEquatorColor = new Color(0.28f, 0.32f, 0.22f);
                RenderSettings.ambientGroundColor = new Color(0.12f, 0.16f, 0.1f);
            }
            else
            {
                RenderSettings.fogColor = new Color(0.62f, 0.72f, 0.78f);
                RenderSettings.fogDensity = 0.01f;
                RenderSettings.ambientSkyColor = new Color(0.55f, 0.62f, 0.7f);
                RenderSettings.ambientEquatorColor = new Color(0.42f, 0.4f, 0.36f);
                RenderSettings.ambientGroundColor = new Color(0.18f, 0.2f, 0.16f);
            }

            AudioHooks.Play(AudioHooks.WorldAmbient);
        }
    }
}
