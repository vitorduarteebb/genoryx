using UnityEngine;

namespace Genoryx.Creatures
{
    public enum WildState
    {
        Idle,
        Patrol,
        Aggro,
        Chase,
        Leash,
        Return,
        BattleTrigger
    }

    /// <summary>
    /// Mesmo prefab, modo WILD. Patrulha, agro, perseguicao, leash e gatilho de batalha.
    /// O gatilho apenas emite o evento: quem resolve encontro e o servidor.
    /// </summary>
    [RequireComponent(typeof(CreatureMotor))]
    public class WildCreatureController : MonoBehaviour
    {
        public Transform target;
        public float patrolRadius = 5f;
        public float aggroRadius = 6.5f;
        public float battleRadius = 1.6f;
        public float leashRadius = 14f;
        public float idleMin = 1.6f;
        public float idleMax = 4.2f;

        public WildState wildState = WildState.Idle;
        public System.Action<WildCreatureController, Transform> onBattleTrigger;

        CreatureMotor motor;
        Vector3 home;
        Vector3 patrolPoint;
        float idleTimer;
        bool battleFired;

        void Awake()
        {
            motor = GetComponent<CreatureMotor>();
            home = transform.position;
            patrolPoint = home;
            idleTimer = Random.Range(idleMin, idleMax);
        }

        public void SetHome(Vector3 position)
        {
            home = position;
            patrolPoint = position;
        }

        void Update()
        {
            if (motor == null || motor.Dead)
            {
                return;
            }

            var distanceHome = Vector3.Distance(transform.position, home);
            var hasTarget = target != null;
            var distanceTarget = hasTarget ? Vector3.Distance(transform.position, target.position) : float.MaxValue;

            if (distanceHome > leashRadius)
            {
                wildState = WildState.Leash;
                battleFired = false;
                motor.MoveTowards(home, true);
                return;
            }

            if (hasTarget && distanceTarget <= battleRadius)
            {
                wildState = WildState.BattleTrigger;
                motor.Stop();
                motor.FaceTowards(target.position);
                if (!battleFired)
                {
                    battleFired = true;
                    onBattleTrigger?.Invoke(this, target);
                }

                return;
            }

            if (hasTarget && distanceTarget <= aggroRadius)
            {
                wildState = distanceTarget > aggroRadius * 0.6f ? WildState.Aggro : WildState.Chase;
                motor.MoveTowards(target.position, wildState == WildState.Chase);
                return;
            }

            battleFired = false;

            if (Vector3.Distance(transform.position, home) > patrolRadius * 1.4f)
            {
                wildState = WildState.Return;
                motor.MoveTowards(home, false);
                return;
            }

            idleTimer -= Time.deltaTime;
            if (wildState == WildState.Patrol)
            {
                var remaining = motor.MoveTowards(patrolPoint, false);
                if (remaining < 0.25f)
                {
                    wildState = WildState.Idle;
                    idleTimer = Random.Range(idleMin, idleMax);
                }

                return;
            }

            wildState = WildState.Idle;
            motor.Stop();

            if (idleTimer <= 0f)
            {
                var angle = Random.Range(0f, Mathf.PI * 2f);
                var radius = Random.Range(patrolRadius * 0.35f, patrolRadius);
                patrolPoint = home + new Vector3(Mathf.Cos(angle), 0f, Mathf.Sin(angle)) * radius;
                wildState = WildState.Patrol;
            }
        }
    }
}
