using UnityEngine;

namespace Genoryx
{
    public class WorldInteractable : MonoBehaviour
    {
        public string id;
        public string displayName;
        public string prompt = "Interagir";
        public string body;
        public WorldInteractKind kind = WorldInteractKind.Poi;
        public string payload;
        public float interactRadius = 2.4f;

        public bool InRange(Vector3 from)
        {
            var a = transform.position;
            a.y = 0f;
            var b = from;
            b.y = 0f;
            return Vector3.Distance(a, b) <= interactRadius;
        }
    }
}
