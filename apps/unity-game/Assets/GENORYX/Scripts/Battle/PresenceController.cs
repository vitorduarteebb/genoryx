using UnityEngine;

namespace Genoryx
{
    public class PresenceController : MonoBehaviour
    {
        public float breath = 0.035f;
        public float sway = 2.4f;
        Vector3 scale;

        void Awake()
        {
            scale = transform.localScale;
        }

        void Update()
        {
            var pulse = 1f + Mathf.Sin(Time.time * 1.6f) * breath;
            transform.localScale = scale * pulse;
            transform.localRotation = Quaternion.Euler(0f, Mathf.Sin(Time.time * 0.7f) * sway, 0f);
        }
    }
}
