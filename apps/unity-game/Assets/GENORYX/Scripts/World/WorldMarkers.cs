using UnityEngine;

namespace Genoryx
{
    public class WorldGround : MonoBehaviour
    {
    }

    public class WorldObstacle : MonoBehaviour
    {
    }

    public class WorldClothSway : MonoBehaviour
    {
        Vector3 baseScale;

        void Start()
        {
            baseScale = transform.localScale;
        }

        void Update()
        {
            var wave = 1f + Mathf.Sin(Time.time * 1.35f + transform.position.x) * 0.035f;
            transform.localScale = new Vector3(baseScale.x * wave, baseScale.y, baseScale.z);
        }
    }

    public class WorldDiscoveryZone : MonoBehaviour
    {
        public string discoveryId;
        public string toast;
        public float radius = 6f;
        bool revealed;

        void Update()
        {
            if (revealed || WorldAreaManager.Instance == null || WorldAreaManager.Instance.Player == null)
            {
                return;
            }

            var gap = Vector3.Distance(transform.position, WorldAreaManager.Instance.Player.position);
            if (gap > radius)
            {
                return;
            }

            revealed = true;
            WorldUIController.Toast(toast);
        }
    }
}
