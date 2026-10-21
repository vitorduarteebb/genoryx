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
    }
}
