using UnityEngine;

namespace Genoryx
{
    public class PlayerMotor : MonoBehaviour
    {
        public float speed = 5.4f;
        public float turnDegreesPerSecond = 420f;
        public float stopDistance = 0.32f;
        public float obstacleRadius = 0.4f;
        public bool allowKeyboard = true;
        public Animator animator;
        public Vector3? Destination;
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
            if (WorldUIController.ModalOpen)
            {
                Animate(Vector3.zero);
                return;
            }

            ReadPointer();
            var keyboard = allowKeyboard
                ? new Vector3(Input.GetAxisRaw("Horizontal"), 0f, Input.GetAxisRaw("Vertical"))
                : Vector3.zero;
            if (keyboard.sqrMagnitude > 0.01f)
            {
                Destination = null;
                if (keyboard.sqrMagnitude > 1f)
                {
                    keyboard.Normalize();
                }

                Move(keyboard);
                return;
            }

            if (Destination.HasValue)
            {
                var dest = Destination.Value;
                dest.y = transform.position.y;
                var delta = dest - transform.position;
                delta.y = 0f;
                if (delta.magnitude <= stopDistance)
                {
                    Destination = null;
                    Animate(Vector3.zero);
                    WorldInteractionSystem.Instance?.Confirm();
                    return;
                }

                Move(delta.normalized);
                return;
            }

            Animate(Vector3.zero);
        }

        void ReadPointer()
        {
            if (WorldUIController.PointerBlocked || !PointerPressed())
            {
                return;
            }

            var cam = Camera.main;
            if (cam == null)
            {
                return;
            }

            var ray = cam.ScreenPointToRay(PointerPosition());
            if (!Physics.Raycast(ray, out var hit, 180f))
            {
                return;
            }

            var interact = hit.collider.GetComponentInParent<WorldInteractable>();
            if (interact != null)
            {
                WorldInteractionSystem.Instance?.Select(interact);
                return;
            }

            if (hit.collider.GetComponentInParent<WorldGround>() != null || hit.point.y < 0.55f)
            {
                var point = hit.point;
                point.y = transform.position.y;
                Destination = point;
                WorldInteractionSystem.Instance?.ClearIfWalking();
            }
        }

        void Move(Vector3 dir)
        {
            var step = dir * speed * Time.deltaTime;
            var next = transform.position + step;
            if (Physics.SphereCast(transform.position + Vector3.up * 0.9f, obstacleRadius, dir, out var hit, step.magnitude + 0.12f))
            {
                if (hit.collider.GetComponentInParent<WorldObstacle>() != null || hit.collider.GetComponentInParent<WorldInteractable>() != null)
                {
                    Destination = null;
                    Animate(Vector3.zero);
                    return;
                }
            }

            next.y = 0f;
            transform.position = next;
            if (dir.sqrMagnitude > 0.01f)
            {
                var target = Quaternion.LookRotation(dir);
                transform.rotation = Quaternion.RotateTowards(transform.rotation, target, turnDegreesPerSecond * Time.deltaTime);
                sequence += 1;
                WorldBridge.Instance?.SendMove(dir.x, dir.z, sequence);
            }

            Animate(dir);
        }

        void Animate(Vector3 input)
        {
            if (animator == null)
            {
                animator = GetComponentInChildren<Animator>();
            }

            if (animator == null)
            {
                return;
            }

            animator.applyRootMotion = false;
            animator.SetFloat("Speed", input.magnitude * speed);
            animator.SetFloat("MovementX", input.x);
            animator.SetFloat("MovementY", input.z);
            animator.SetBool("IsMoving", input.sqrMagnitude > 0.01f);
            animator.SetBool("IsRunning", input.magnitude > 0.72f);
        }

        static bool PointerPressed()
        {
            if (Input.touchCount == 1 && Input.GetTouch(0).phase == TouchPhase.Began)
            {
                return true;
            }

            return Input.GetMouseButtonDown(0);
        }

        static Vector3 PointerPosition()
        {
            if (Input.touchCount == 1)
            {
                return Input.GetTouch(0).position;
            }

            return Input.mousePosition;
        }
    }
}
