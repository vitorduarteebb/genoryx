using UnityEngine;

namespace Genoryx
{
    public class CorePulse : MonoBehaviour
    {
        public Transform crystal;
        public Transform[] shards = System.Array.Empty<Transform>();
        public Light glow;
        float seed;

        void Start()
        {
            seed = Random.Range(0f, 8f);
        }

        void Update()
        {
            var t = Time.time + seed;
            var pulse = 0.85f + Mathf.Sin(t * 1.6f) * 0.15f;
            if (crystal != null)
            {
                crystal.localPosition = new Vector3(0f, 13.2f + Mathf.Sin(t * 0.7f) * 0.35f, 0f);
                crystal.Rotate(0f, 18f * Time.deltaTime, 0f, Space.World);
                crystal.localScale = Vector3.one * (2.2f * pulse);
            }

            if (glow != null)
            {
                glow.intensity = 2.4f + Mathf.Sin(t * 1.6f) * 0.7f;
            }

            for (var i = 0; i < shards.Length; i++)
            {
                if (shards[i] == null)
                {
                    continue;
                }

                var angle = t * (18f + i * 7f) + i * 120f;
                var rad = (angle * Mathf.Deg2Rad);
                var radius = 3.1f + i * 0.35f;
                var y = 10.4f + Mathf.Sin(t * 1.1f + i) * 0.55f;
                shards[i].localPosition = new Vector3(Mathf.Cos(rad) * radius, y, Mathf.Sin(rad) * radius);
                shards[i].Rotate(12f * Time.deltaTime, 22f * Time.deltaTime, 0f);
            }
        }
    }
}
