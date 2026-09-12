using UnityEngine;

namespace Genoryx
{
    public class CompanionFollower : MonoBehaviour
    {
        public Transform owner;
        public string temperament = "WILD";
        public float followDistance = 1.65f;
        public float runDistance = 4.2f;
        Vector3 wander;
        float moodUntil;
        string mood = "follow";

        void Update()
        {
            if (owner == null)
            {
                return;
            }

            var radius = temperament switch
            {
                "FRIENDLY" => followDistance,
                "NOBLE" => 1.85f,
                "FERAL" => 2.4f,
                "ABYSSAL" => 2.1f,
                _ => followDistance
            };

            if (Time.time > moodUntil)
            {
                mood = Random.value > 0.7f ? "sniff" : Random.value > 0.5f ? "look" : "follow";
                moodUntil = Time.time + (mood == "follow" ? 2.4f : 1.1f);
            }

            wander += new Vector3(Mathf.Sin(Time.time * 0.7f), 0f, Mathf.Cos(Time.time * 0.55f)) * 0.004f;
            var dest = owner.position - owner.forward * radius + wander;
            dest.y = 0f;
            if (mood == "sniff")
            {
                dest = owner.position - owner.forward * (radius * 0.7f) + owner.right * 0.45f;
                dest.y = 0f;
            }

            var flat = transform.position;
            flat.y = 0f;
            var gap = Vector3.Distance(flat, dest);
            var step = gap > runDistance ? 7.4f : mood == "sniff" ? 1.1f : 4.2f;
            var next = Vector3.MoveTowards(flat, dest, step * Time.deltaTime);
            next.y = 0f;
            transform.position = next;
            if (gap > 0.15f)
            {
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(dest - transform.position), 0.16f);
            }
            else if (mood == "look")
            {
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.Euler(0f, Time.time * 40f, 0f), 0.08f);
            }
        }
    }
}
