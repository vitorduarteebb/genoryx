using UnityEngine;

namespace Genoryx
{
    public class WorldUIController : MonoBehaviour
    {
        public static WorldUIController Instance { get; private set; }
        public static bool PointerBlocked { get; private set; }
        public static bool ModalOpen { get; private set; }

        string region = "Haven · Genesis Plaza";
        string toast;
        float toastUntil;
        string promptTitle;
        string promptBody;
        string dialogueTitle;
        string dialogueBody;
        string encounterName;
        string encounterBody;
        string encounterSpecies;
        float fade;
        float fadeTarget;
        float fadeSpeed = 2f;

        GUIStyle title;
        GUIStyle tiny;
        GUIStyle body;
        Texture2D pixel;

        void Awake()
        {
            Instance = this;
        }

        void Update()
        {
            fade = Mathf.MoveTowards(fade, fadeTarget, Time.deltaTime * fadeSpeed);
            if (WorldAreaManager.Instance != null)
            {
                region = WorldAreaManager.Instance.displayName;
            }
        }

        public static void Toast(string text)
        {
            if (Instance == null || string.IsNullOrEmpty(text))
            {
                return;
            }

            Instance.toast = text;
            Instance.toastUntil = Time.time + 2.8f;
            WorldSession.LastToast = text;
        }

        public static void Prompt(string heading, string text)
        {
            if (Instance == null)
            {
                return;
            }

            Instance.promptTitle = heading;
            Instance.promptBody = text;
        }

        public static void ClearPrompt()
        {
            if (Instance == null)
            {
                return;
            }

            Instance.promptTitle = null;
            Instance.promptBody = null;
        }

        public static void Dialogue(string heading, string text)
        {
            if (Instance == null)
            {
                return;
            }

            ModalOpen = true;
            Instance.dialogueTitle = heading;
            Instance.dialogueBody = text;
            Instance.encounterName = null;
        }

        public static void Encounter(string name, string body, string species)
        {
            if (Instance == null)
            {
                return;
            }

            ModalOpen = true;
            Instance.encounterName = name;
            Instance.encounterBody = body;
            Instance.encounterSpecies = species;
            Instance.dialogueTitle = null;
        }

        public static void CloseModals()
        {
            ModalOpen = false;
            if (Instance == null)
            {
                return;
            }

            Instance.dialogueTitle = null;
            Instance.encounterName = null;
        }

        public static void Fade(float target, float seconds)
        {
            if (Instance == null)
            {
                return;
            }

            Instance.fadeTarget = target;
            Instance.fadeSpeed = seconds <= 0.01f ? 8f : 1f / seconds;
        }

        void Ensure()
        {
            if (pixel != null)
            {
                return;
            }

            pixel = Texture2D.whiteTexture;
            title = new GUIStyle(GUI.skin.label) { fontSize = 16, fontStyle = FontStyle.Bold, wordWrap = true };
            tiny = new GUIStyle(GUI.skin.label) { fontSize = 13, wordWrap = true };
            body = new GUIStyle(GUI.skin.label) { fontSize = 14, wordWrap = true };
        }

        void OnGUI()
        {
            Ensure();
            var scale = Mathf.Clamp(Screen.height / 720f, 0.85f, 1.6f);
            title.fontSize = Mathf.RoundToInt(16 * scale);
            tiny.fontSize = Mathf.RoundToInt(13 * scale);
            body.fontSize = Mathf.RoundToInt(14 * scale);

            DrawRegion(scale);
            DrawMinimap(scale);
            DrawDock(scale);
            DrawPrompt(scale);
            DrawToast(scale);
            DrawDialogue(scale);
            DrawEncounter(scale);
            if (fade > 0.01f)
            {
                Panel(0, 0, Screen.width, Screen.height, new Color(0.02f, 0.03f, 0.04f, fade));
            }

            var pointer = Event.current.mousePosition;
            PointerBlocked = ModalOpen ||
                new Rect(14, 14, 280 * scale, 46 * scale).Contains(pointer) ||
                new Rect(Screen.width - 118 * scale - 14, 14, 118 * scale, 118 * scale).Contains(pointer) ||
                new Rect((Screen.width - 340 * scale) * 0.5f, Screen.height - 72 * scale, 340 * scale, 60 * scale).Contains(pointer);
        }

        void DrawRegion(float scale)
        {
            var w = 280 * scale;
            var h = 46 * scale;
            Panel(14, 14, w, h, new Color(0.04f, 0.05f, 0.06f, 0.78f));
            Line(14, 14, w, 3, new Color(0.45f, 0.9f, 0.86f, 0.95f));
            Label(24, 22, w - 20, 28, region, title, new Color(0.92f, 0.96f, 0.94f));
        }

        void DrawMinimap(float scale)
        {
            var size = 118 * scale;
            var x = Screen.width - size - 14;
            Panel(x, 14, size, size, new Color(0.04f, 0.05f, 0.06f, 0.8f));
            Line(x, 14, size, 3, new Color(0.9f, 0.74f, 0.28f, 0.95f));
            Label(x + 10, 20, size - 20, 18, "MAPA", tiny, new Color(0.94f, 0.82f, 0.42f));
            var inner = size - 36;
            var ix = x + 18;
            var iy = 42;
            var verdantis = WorldSession.AreaId.StartsWith("Verdantis");
            Panel(ix, iy, inner, inner - 8, verdantis ? new Color(0.1f, 0.2f, 0.12f, 0.95f) : new Color(0.16f, 0.2f, 0.18f, 0.95f));
            var player = WorldAreaManager.Instance != null ? WorldAreaManager.Instance.Player : null;
            if (player != null)
            {
                var nx = Mathf.InverseLerp(-24f, 24f, player.position.x);
                var nz = Mathf.InverseLerp(20f, -48f, player.position.z);
                Panel(ix + nx * (inner - 10), iy + nz * (inner - 18), 8, 8, new Color(0.35f, 0.95f, 0.86f, 1f));
            }
        }

        void DrawDock(float scale)
        {
            var labels = new[] { "Party", "Bag", "Codex", "Map" };
            var count = labels.Length;
            var bw = 76 * scale;
            var bh = 48 * scale;
            var gap = 10 * scale;
            var total = count * bw + (count - 1) * gap;
            var x = (Screen.width - total) * 0.5f;
            var y = Screen.height - bh - 16;
            for (var i = 0; i < count; i++)
            {
                var rx = x + i * (bw + gap);
                if (Button(rx, y, bw, bh, labels[i], scale))
                {
                    Toast(labels[i] + " abre no Alpha web.");
                }
            }
        }

        void DrawPrompt(float scale)
        {
            if (string.IsNullOrEmpty(promptTitle) || ModalOpen)
            {
                return;
            }

            var w = 280 * scale;
            var h = 64 * scale;
            var x = (Screen.width - w) * 0.5f;
            var y = Screen.height - 140 * scale;
            Panel(x, y, w, h, new Color(0.05f, 0.06f, 0.07f, 0.86f));
            Label(x + 12, y + 8, w - 24, 24, promptTitle, title, new Color(0.94f, 0.82f, 0.42f));
            Label(x + 12, y + 32, w - 24, 24, promptBody, tiny, new Color(0.82f, 0.86f, 0.82f));
        }

        void DrawToast(float scale)
        {
            if (string.IsNullOrEmpty(toast) || Time.time > toastUntil)
            {
                return;
            }

            var w = 320 * scale;
            var h = 40 * scale;
            var x = (Screen.width - w) * 0.5f;
            Panel(x, 70 * scale, w, h, new Color(0.06f, 0.1f, 0.1f, 0.88f));
            Label(x + 12, 78 * scale, w - 24, 28, toast, tiny, new Color(0.7f, 0.94f, 0.88f));
        }

        void DrawDialogue(float scale)
        {
            if (string.IsNullOrEmpty(dialogueTitle))
            {
                return;
            }

            var w = Mathf.Min(420 * scale, Screen.width - 24);
            var h = 168 * scale;
            var x = (Screen.width - w) * 0.5f;
            var y = Screen.height * 0.5f - h * 0.5f;
            Panel(x, y, w, h, new Color(0.05f, 0.06f, 0.07f, 0.92f));
            Line(x, y, w, 3, new Color(0.45f, 0.9f, 0.86f, 0.95f));
            Label(x + 16, y + 14, w - 32, 28, dialogueTitle, title, new Color(0.94f, 0.82f, 0.42f));
            Label(x + 16, y + 48, w - 32, 68, dialogueBody, body, new Color(0.86f, 0.88f, 0.84f));
            if (Button(x + w - 128 * scale, y + h - 56 * scale, 112 * scale, 44 * scale, "Fechar", scale))
            {
                CloseModals();
            }
        }

        void DrawEncounter(float scale)
        {
            if (string.IsNullOrEmpty(encounterName))
            {
                return;
            }

            var w = Mathf.Min(400 * scale, Screen.width - 24);
            var h = 220 * scale;
            var x = (Screen.width - w) * 0.5f;
            var y = Screen.height * 0.5f - h * 0.5f;
            Panel(x, y, w, h, new Color(0.05f, 0.06f, 0.07f, 0.94f));
            Line(x, y, w, 3, new Color(0.86f, 0.32f, 0.22f, 0.95f));
            Label(x + 16, y + 12, w - 32, 26, encounterName, title, new Color(0.96f, 0.86f, 0.5f));
            Label(x + 16, y + 42, w - 32, 20, "Perigo médio · " + (string.IsNullOrEmpty(encounterSpecies) ? "selvagem" : encounterSpecies), tiny, new Color(0.78f, 0.8f, 0.76f));
            Label(x + 16, y + 66, w - 32, 48, string.IsNullOrEmpty(encounterBody) ? "Uma criatura visível no mapa. Observe ou enfrente." : encounterBody, body, new Color(0.86f, 0.88f, 0.84f));
            var bw = 110 * scale;
            var bh = 48 * scale;
            var by = y + h - bh - 16;
            if (Button(x + 16, by, bw, bh, "Observar", scale))
            {
                WorldEncounterSystem.Instance?.Observe();
            }

            if (Button(x + 16 + bw + 10, by, bw, bh, "Enfrentar", scale))
            {
                WorldEncounterSystem.Instance?.Fight();
            }

            if (Button(x + w - bw - 16, by, bw, bh, "Cancelar", scale))
            {
                WorldEncounterSystem.Instance?.Cancel();
            }
        }

        bool Button(float x, float y, float w, float h, string text, float scale)
        {
            var hover = Event.current.type == EventType.Repaint && new Rect(x, y, w, h).Contains(Event.current.mousePosition);
            Panel(x, y, w, h, hover ? new Color(0.18f, 0.22f, 0.2f, 0.96f) : new Color(0.1f, 0.12f, 0.12f, 0.94f));
            Label(x + 8, y + h * 0.28f, w - 16, 22 * scale, text, tiny, new Color(0.92f, 0.9f, 0.8f));
            return GUI.Button(new Rect(x, y, w, h), GUIContent.none, GUIStyle.none);
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

        void Label(float x, float y, float w, float h, string text, GUIStyle style, Color color)
        {
            GUI.color = color;
            GUI.Label(new Rect(x, y, w, h), text, style);
        }
    }
}
