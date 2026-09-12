using UnityEngine;

namespace Genoryx
{
    public class LoadingScreen : MonoBehaviour
    {
        [Range(0f, 1f)] public float progress;

        void OnGUI()
        {
            GUI.color = new Color(0.04f, 0.06f, 0.08f);
            GUI.DrawTexture(new Rect(0, 0, Screen.width, Screen.height), Texture2D.whiteTexture);
            GUI.color = new Color(0.78f, 0.62f, 0.28f);
            GUI.Label(new Rect(40, Screen.height * 0.38f, 640, 40), "GENORYX: GENESIS");
            GUI.color = new Color(0.55f, 0.9f, 0.88f);
            GUI.Label(new Rect(40, Screen.height * 0.38f + 36, 640, 24), "Carregando world · criaturas · energia Genesis");
            GUI.color = new Color(0.2f, 0.85f, 0.8f);
            GUI.DrawTexture(new Rect(40, Screen.height * 0.38f + 70, Screen.width * 0.4f * Mathf.Clamp01(progress), 8), Texture2D.whiteTexture);
        }
    }
}
