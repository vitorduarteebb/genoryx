using UnityEngine;

namespace Genoryx
{
    public class NpcActor : MonoBehaviour
    {
        public string displayName = "NPC";
        public string role = "citizen";
        float phase;

        void Start()
        {
            phase = Random.Range(0f, 8f);
        }

        void Update()
        {
            if (role == "guard")
            {
                transform.rotation = Quaternion.Euler(0f, Mathf.Sin(Time.time * 0.35f + phase) * 25f, 0f);
                return;
            }

            transform.position += new Vector3(0f, Mathf.Sin(Time.time * 1.4f + phase) * 0.002f, 0f);
            if (role == "adventurer" && Mathf.Repeat(Time.time + phase, 8f) < 3f)
            {
                transform.position += transform.forward * (0.6f * Time.deltaTime);
            }
        }

        void OnGUI()
        {
            var cam = Camera.main;
            if (cam == null)
            {
                return;
            }

            var head = transform.position + Vector3.up * 2.15f;
            var screen = cam.WorldToScreenPoint(head);
            if (screen.z < 0.4f || screen.z > 28f)
            {
                return;
            }

            var x = screen.x - 46;
            var y = Screen.height - screen.y - 28;
            GUI.color = new Color(0.05f, 0.06f, 0.07f, 0.7f);
            GUI.DrawTexture(new Rect(x, y, 92, 28), Texture2D.whiteTexture);
            GUI.color = new Color(0.94f, 0.82f, 0.42f);
            GUI.Label(new Rect(x + 6, y + 2, 84, 14), displayName);
            GUI.color = new Color(0.7f, 0.74f, 0.7f);
            GUI.Label(new Rect(x + 6, y + 14, 84, 12), role);
        }
    }
}
