using UnityEngine;

namespace Genoryx
{
    public class PlayerMotor : MonoBehaviour
    {
        public float speed = 6.2f;
        public float turnDegreesPerSecond = 420f;
        public Animator animator;
        int sequence;

        void Awake()
        {
            if (animator == null)
            {
                animator = GetComponentInChildren<Animator>();
            }

            if (animator != null)
            {
                animator.applyRootMotion = false;
            }
        }

        void Update()
        {
            var input = new Vector3(Input.GetAxisRaw("Horizontal"), 0f, Input.GetAxisRaw("Vertical"));
            if (input.sqrMagnitude > 1f)
            {
                input.Normalize();
            }

            transform.position += input * speed * Time.deltaTime;
            if (input.sqrMagnitude > 0.01f)
            {
                var target = Quaternion.LookRotation(input);
                transform.rotation = Quaternion.RotateTowards(transform.rotation, target, turnDegreesPerSecond * Time.deltaTime);
                sequence += 1;
                if (WorldBridge.Instance != null)
                {
                    WorldBridge.Instance.SendMove(input.x, input.z, sequence);
                }
            }

            if (animator == null)
            {
                animator = GetComponentInChildren<Animator>();
            }

            if (animator != null)
            {
                animator.applyRootMotion = false;
                animator.SetFloat("Speed", input.magnitude * speed);
                animator.SetFloat("MovementX", input.x);
                animator.SetFloat("MovementY", input.z);
                animator.SetBool("IsMoving", input.sqrMagnitude > 0.01f);
                animator.SetBool("IsRunning", input.magnitude > 0.72f);
            }
        }
    }
}
