using UnityEngine;

namespace Genoryx
{
    public class CrowdDummy : MonoBehaviour
    {
        public Vector3 home;
        public float roam = 2.2f;
        Vector3 dest;
        float next;

        void Start()
        {
            home = transform.position;
            dest = home;
        }

        void Update()
        {
            if (Time.time > next)
            {
                dest = home + new Vector3(Random.Range(-roam, roam), 0f, Random.Range(-roam, roam));
                next = Time.time + Random.Range(2.2f, 5.5f);
            }

            transform.position = Vector3.MoveTowards(transform.position, dest, 1.15f * Time.deltaTime);
            var delta = dest - transform.position;
            delta.y = 0f;
            if (delta.sqrMagnitude > 0.04f)
            {
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(delta), 0.08f);
            }
        }
    }
}
