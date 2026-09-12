using UnityEngine;

namespace Genoryx
{
    public class WorldHud : MonoBehaviour
    {
        public string characterName = "Tamer";
        public int level = 1;
        public float hp01 = 0.86f;
        public string companionName = "Pyron";
        public string companionStage = "Baby";
        public int companionLevel = 7;
        public float growth01 = 0.61f;
        public string region = "Genesis Plaza";

        GUIStyle title;
        GUIStyle tiny;
        Texture2D pixel;

        void Ensure()
        {
            if (pixel != null)
            {
                return;
            }

            pixel = Texture2D.whiteTexture;
            title = new GUIStyle(GUI.skin.label) { fontSize = 12, fontStyle = FontStyle.Bold };
            tiny = new GUIStyle(GUI.skin.label) { fontSize = 10 };
        }

        void OnGUI()
        {
            Ensure();
            const float x = 14;
            const float y = 14;
            const float w = 214;
            Panel(x, y, w, 86, new Color(0.05f, 0.06f, 0.07f, 0.8f));
            Line(x, y, w, 2, new Color(0.9f, 0.74f, 0.28f, 0.95f));
            Label(x + 10, y + 6, 140, 16, characterName, title, new Color(0.94f, 0.82f, 0.42f));
            Label(x + w - 46, y + 6, 40, 16, "Lv " + level, title, new Color(0.9f, 0.86f, 0.72f));
            Bar(x + 10, y + 26, w - 20, 8, hp01, new Color(0.72f, 0.18f, 0.18f));
            Panel(x + 10, y + 40, 12, 12, new Color(0.92f, 0.38f, 0.14f, 1f));
            Label(x + 26, y + 38, 130, 16, $"{companionName} {companionStage}", tiny, new Color(0.7f, 0.92f, 0.86f));
            Label(x + w - 46, y + 38, 40, 16, "Lv " + companionLevel, tiny, new Color(0.82f, 0.84f, 0.8f));
            Bar(x + 10, y + 58, w - 20, 7, growth01, new Color(0.82f, 0.62f, 0.18f));
            Label(x + 10, y + 68, 80, 14, $"{Mathf.RoundToInt(growth01 * 100f)}%", tiny, new Color(0.72f, 0.74f, 0.7f));

            var mx = Screen.width - 132;
            Panel(mx, 14, 118, 118, new Color(0.05f, 0.06f, 0.07f, 0.78f));
            Line(mx, 14, 118, 2, new Color(0.9f, 0.74f, 0.28f, 0.95f));
            Label(mx + 10, 20, 100, 14, "MAP", title, new Color(0.94f, 0.82f, 0.42f));
            Panel(mx + 14, 40, 90, 64, new Color(0.16f, 0.22f, 0.18f, 0.95f));
            Panel(mx + 40, 58, 28, 22, new Color(0.48f, 0.46f, 0.4f, 1f));
            Panel(mx + 50, 64, 7, 7, new Color(0.35f, 0.9f, 0.82f, 1f));
            Label(mx + 10, 108, 100, 16, region, tiny, new Color(0.8f, 0.82f, 0.78f));

            var hx = Screen.width * 0.5f - 128;
            var hy = Screen.height - 48;
            Panel(hx, hy, 256, 36, new Color(0.05f, 0.06f, 0.07f, 0.76f));
            for (var i = 0; i < 5; i++)
            {
                Panel(hx + 8 + i * 50, hy + 5, 42, 26, new Color(0.12f, 0.12f, 0.12f, 0.95f));
                Label(hx + 22 + i * 50, hy + 8, 20, 20, (i + 1).ToString(), title, new Color(0.9f, 0.86f, 0.72f));
            }
        }

        void Panel(float x, float y, float w, float h, Color color)
        {
            GUI.color = color;
            GUI.DrawTexture(new Rect(x, y, w, h), pixel);
        }

        void Line(float x, float y, float w, float h, Color color)
        {
            Panel(x, y, w, h, color);
        }

        void Bar(float x, float y, float w, float h, float t, Color fill)
        {
            Panel(x, y, w, h, new Color(0.1f, 0.08f, 0.08f, 0.95f));
            Panel(x, y, w * Mathf.Clamp01(t), h, fill);
        }

        void Label(float x, float y, float w, float h, string text, GUIStyle style, Color color)
        {
            GUI.color = color;
            GUI.Label(new Rect(x, y, w, h), text, style);
        }
    }
}
