using UnityEngine;
using Genoryx.Creatures;

namespace Genoryx
{
    public class WorldWildActor : MonoBehaviour
    {
        public Vector3 home;
        public float roamRadius = 3.2f;
        public WorldWildBehavior behavior = WorldWildBehavior.Curious;
        public float detectRadius = 5.5f;
        CreatureMotor motor;
        float phase;

        void Start()
        {
            home = transform.position;
            phase = Random.Range(0f, Mathf.PI * 2f);
            motor = GetComponent<CreatureMotor>();
        }

        void Update()
        {
            var player = WorldAreaManager.Instance != null ? WorldAreaManager.Instance.Player : null;
            var toPlayer = player != null ? player.position - transform.position : Vector3.zero;
            toPlayer.y = 0f;
            var gap = toPlayer.magnitude;

            if (player != null && gap < detectRadius)
            {
                if (behavior == WorldWildBehavior.Curious && gap > 1.8f)
                {
                    Move(transform.position + toPlayer.normalized * 0.6f, false);
                    return;
                }

                if (behavior == WorldWildBehavior.Territorial && gap < 3.4f)
                {
                    motor?.FaceTowards(player.position);
                    return;
                }

                if (behavior == WorldWildBehavior.Predatory)
                {
                    Move(player.position, gap > 2.4f);
                    return;
                }
            }

            var wander = home + new Vector3(Mathf.Sin(Time.time * 0.35f + phase), 0f, Mathf.Cos(Time.time * 0.28f + phase)) * roamRadius;
            Move(wander, false);
        }

        void Move(Vector3 dest, bool run)
        {
            dest.y = transform.position.y;
            if (motor != null)
            {
                motor.MoveTowards(dest, run);
                return;
            }

            transform.position = Vector3.MoveTowards(transform.position, dest, 1.1f * Time.deltaTime);
        }
    }
}
