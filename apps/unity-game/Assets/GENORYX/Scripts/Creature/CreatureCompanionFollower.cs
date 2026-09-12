using UnityEngine;

namespace Genoryx.Creatures
{
    public enum CompanionState
    {
        Follow,
        CatchUp,
        IdleNearOwner,
        TeleportToOwner
    }

    /// <summary>
    /// Companion do Tamer. Integra com o anchor exposto pelo CharacterAssembler.
    /// Baby ganha comportamento proprio: olha ao redor, para, e acelera para alcancar.
    /// </summary>
    [RequireComponent(typeof(CreatureMotor))]
    public class CreatureCompanionFollower : MonoBehaviour
    {
        public Transform owner;
        public float idleRadius = 1.5f;
        public float followRadius = 2.6f;
        public float catchUpRadius = 5.5f;
        public float teleportRadius = 22f;
        public float sideOffset = 0.7f;

        public CompanionState companionState = CompanionState.IdleNearOwner;

        CreatureMotor motor;
        CreatureAssembler assembler;
        float lookTimer;
        float pauseTimer;
        Vector3 lookTarget;

        void Awake()
        {
            motor = GetComponent<CreatureMotor>();
            assembler = GetComponent<CreatureAssembler>();
        }

        /// <summary>Aceita o root do Tamer e resolve o anchor de companion se existir.</summary>
        public void Bind(Transform tamer)
        {
            if (tamer == null)
            {
                owner = null;
                return;
            }

            var anchor = tamer.Find("CreatureFollowAnchor");
            owner = anchor != null ? anchor : tamer;
        }

        void Update()
        {
            if (owner == null || motor == null || motor.Dead)
            {
                return;
            }

            var target = DesiredPosition();
            var distance = Vector3.Distance(transform.position, owner.position);

            if (distance > teleportRadius)
            {
                companionState = CompanionState.TeleportToOwner;
                motor.Teleport(target);
                motor.PlaySpawn();
                return;
            }

            if (distance > catchUpRadius)
            {
                companionState = CompanionState.CatchUp;
                motor.MoveTowards(target, true);
                return;
            }

            if (distance > followRadius)
            {
                companionState = CompanionState.Follow;
                motor.MoveTowards(target, false);
                return;
            }

            companionState = CompanionState.IdleNearOwner;
            motor.Stop();
            IdleBehaviour(distance);
        }

        Vector3 DesiredPosition()
        {
            var right = owner.right;
            var back = -owner.forward;
            return owner.position + back * followRadius * 0.6f + right * sideOffset;
        }

        void IdleBehaviour(float distance)
        {
            var baby = assembler != null && assembler.dna != null && assembler.dna.growthStage == CreatureGrowthStage.Baby;

            lookTimer -= Time.deltaTime;
            if (lookTimer <= 0f)
            {
                lookTimer = baby ? Random.Range(0.9f, 2.2f) : Random.Range(2.0f, 4.5f);
                var angle = Random.Range(0f, Mathf.PI * 2f);
                lookTarget = transform.position + new Vector3(Mathf.Cos(angle), 0f, Mathf.Sin(angle)) * 3f;
                if (Random.value < (baby ? 0.45f : 0.7f))
                {
                    lookTarget = owner.position;
                }
            }

            if (distance > idleRadius)
            {
                motor.FaceTowards(owner.position);
            }
            else
            {
                motor.FaceTowards(lookTarget);
            }

            if (baby)
            {
                pauseTimer -= Time.deltaTime;
                if (pauseTimer <= 0f)
                {
                    pauseTimer = Random.Range(4f, 9f);
                    motor.SetHappy(true);
                    Invoke(nameof(ClearHappy), 1.0f);
                }
            }
        }

        void ClearHappy()
        {
            if (motor != null)
            {
                motor.SetHappy(false);
            }
        }
    }
}
