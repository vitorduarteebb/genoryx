using UnityEngine;

namespace Genoryx.Creatures
{
    public enum CreatureState
    {
        Idle,
        Move,
        Follow,
        Chase,
        Attack,
        Hit,
        Death
    }

    /// <summary>
    /// Estado e locomocao de uma criatura. Serve como companion, mob selvagem,
    /// inimigo ou criatura de PvP — o prefab e o mesmo.
    /// Movimento e autoridade do gameplay/rede: applyRootMotion fica desligado.
    /// </summary>
    [RequireComponent(typeof(CreatureAssembler))]
    public class CreatureMotor : MonoBehaviour
    {
        public static class Param
        {
            public const string Speed = "Speed";
            public const string Attack01 = "Attack01";
            public const string Attack02 = "Attack02";
            public const string Hit = "Hit";
            public const string Death = "Death";
            public const string Victory = "Victory";
            public const string Spawn = "Spawn";
            public const string Capture = "Capture";
            public const string Sleep = "Sleep";
            public const string Eat = "Eat";
            public const string Happy = "Happy";
        }

        public float walkSpeed = 1.10f;
        public float runSpeed = 2.85f;
        public float turnSpeed = 480f;
        public float acceleration = 9f;

        public CreatureState state = CreatureState.Idle;

        Animator animator;
        CreatureAssembler assembler;
        Vector3 velocity;
        float animatedSpeed;
        bool dead;

        public bool Dead => dead;
        public float CurrentSpeed => velocity.magnitude;

        void Awake()
        {
            assembler = GetComponent<CreatureAssembler>();
            assembler.BuildStructure();
            animator = assembler.Animator;
        }

        void Update()
        {
            if (animator == null)
            {
                animator = assembler != null ? assembler.Animator : null;
            }

            if (animator == null || animator.runtimeAnimatorController == null)
            {
                return;
            }

            var target = dead ? 0f : Mathf.Clamp01(velocity.magnitude / Mathf.Max(runSpeed, 0.01f));
            animatedSpeed = Mathf.MoveTowards(animatedSpeed, target, Time.deltaTime * 4f);
            SetFloat(Param.Speed, animatedSpeed);
        }

        /// <summary>Move em direcao a um ponto. Retorna a distancia restante.</summary>
        public float MoveTowards(Vector3 destination, bool run)
        {
            if (dead)
            {
                return 0f;
            }

            var flat = destination - transform.position;
            flat.y = 0f;
            var distance = flat.magnitude;

            if (distance < 0.05f)
            {
                Stop();
                return distance;
            }

            var direction = flat / distance;
            var desired = direction * (run ? runSpeed : walkSpeed);
            velocity = Vector3.MoveTowards(velocity, desired, acceleration * Time.deltaTime);
            transform.position += velocity * Time.deltaTime;

            var look = Quaternion.LookRotation(direction, Vector3.up);
            transform.rotation = Quaternion.RotateTowards(transform.rotation, look, turnSpeed * Time.deltaTime);

            state = run ? CreatureState.Chase : CreatureState.Move;
            return distance;
        }

        public void Stop()
        {
            velocity = Vector3.MoveTowards(velocity, Vector3.zero, acceleration * 2f * Time.deltaTime);
            if (!dead && velocity.sqrMagnitude < 0.0004f)
            {
                velocity = Vector3.zero;
                state = CreatureState.Idle;
            }
        }

        public void FaceTowards(Vector3 point)
        {
            var flat = point - transform.position;
            flat.y = 0f;
            if (flat.sqrMagnitude < 0.0004f)
            {
                return;
            }

            var look = Quaternion.LookRotation(flat.normalized, Vector3.up);
            transform.rotation = Quaternion.RotateTowards(transform.rotation, look, turnSpeed * Time.deltaTime);
        }

        public void Teleport(Vector3 position)
        {
            transform.position = position;
            velocity = Vector3.zero;
        }

        public void AttackBody()
        {
            if (dead)
            {
                return;
            }

            state = CreatureState.Attack;
            Trigger(Param.Attack01);
        }

        public void AttackCore()
        {
            if (dead)
            {
                return;
            }

            state = CreatureState.Attack;
            Trigger(Param.Attack02);
        }

        public void TakeHit()
        {
            if (dead)
            {
                return;
            }

            state = CreatureState.Hit;
            Trigger(Param.Hit);
        }

        public void Die()
        {
            if (dead)
            {
                return;
            }

            dead = true;
            velocity = Vector3.zero;
            state = CreatureState.Death;
            Trigger(Param.Death);
        }

        public void Revive()
        {
            dead = false;
            state = CreatureState.Idle;
            Trigger(Param.Spawn);
        }

        public void Celebrate()
        {
            Trigger(Param.Victory);
        }

        public void ReactToCapture()
        {
            Trigger(Param.Capture);
        }

        public void SetSleeping(bool value)
        {
            SetBool(Param.Sleep, value);
        }

        public void SetEating(bool value)
        {
            SetBool(Param.Eat, value);
        }

        public void SetHappy(bool value)
        {
            SetBool(Param.Happy, value);
        }

        public void PlaySpawn()
        {
            Trigger(Param.Spawn);
        }

        void Trigger(string param)
        {
            if (HasParam(param, AnimatorControllerParameterType.Trigger))
            {
                animator.SetTrigger(param);
            }
        }

        void SetBool(string param, bool value)
        {
            if (HasParam(param, AnimatorControllerParameterType.Bool))
            {
                animator.SetBool(param, value);
            }
        }

        void SetFloat(string param, float value)
        {
            if (HasParam(param, AnimatorControllerParameterType.Float))
            {
                animator.SetFloat(param, value);
            }
        }

        bool HasParam(string param, AnimatorControllerParameterType type)
        {
            if (animator == null || animator.runtimeAnimatorController == null)
            {
                return false;
            }

            var all = animator.parameters;
            for (var i = 0; i < all.Length; i++)
            {
                if (all[i].name == param && all[i].type == type)
                {
                    return true;
                }
            }

            return false;
        }
    }
}
