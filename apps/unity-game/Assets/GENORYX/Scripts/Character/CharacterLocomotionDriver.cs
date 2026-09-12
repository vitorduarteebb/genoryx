using UnityEngine;

namespace Genoryx
{
    public class CharacterLocomotionDriver : MonoBehaviour
    {
        public Animator animator;
        public float walkThreshold = 0.15f;
        public float runThreshold = 4.2f;
        Vector3 last;
        float forcedSpeed = -1f;

        public bool GraphIsReady => animator != null && animator.runtimeAnimatorController != null && animator.avatar != null && animator.avatar.isHuman;
        public float ForcedSpeed => forcedSpeed;
        public AnimationClip IdleClip => null;
        public AnimationClip WalkClip => null;
        public AnimationClip RunClip => null;

        public void Bind(Animator target)
        {
            animator = target;
            if (animator == null)
            {
                return;
            }

            animator.applyRootMotion = false;
            animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;
        }

        public void ForceSpeed(float speed)
        {
            forcedSpeed = speed;
            last = transform.position;
            ApplySpeed(speed);
        }

        public void ClearForce()
        {
            forcedSpeed = -1f;
            last = transform.position;
        }

        public float MixerWeight(int input)
        {
            if (animator == null)
            {
                return 0f;
            }

            var blend = animator.GetFloat("Speed");
            if (input == 0)
            {
                return blend < 0.25f ? 1f : 0f;
            }

            if (input == 1)
            {
                return blend >= 0.25f && blend < 0.75f ? 1f : 0f;
            }

            return blend >= 0.75f ? 1f : 0f;
        }

        public double ClipTime(int input)
        {
            if (animator == null || animator.runtimeAnimatorController == null)
            {
                return 0d;
            }

            var info = animator.GetCurrentAnimatorStateInfo(0);
            return info.normalizedTime;
        }

        void Start()
        {
            last = transform.position;
        }

        void LateUpdate()
        {
            var delta = transform.position - last;
            delta.y = 0f;
            var speed = forcedSpeed >= 0f
                ? forcedSpeed
                : delta.magnitude / Mathf.Max(Time.deltaTime, 0.0001f);
            last = transform.position;
            ApplySpeed(speed);
        }

        void ApplySpeed(float speed)
        {
            if (animator == null)
            {
                return;
            }

            animator.applyRootMotion = false;
            var blend = 0f;
            if (speed >= runThreshold)
            {
                blend = 1f;
            }
            else if (speed >= walkThreshold)
            {
                blend = 0.5f;
            }

            if (forcedSpeed >= 0f)
            {
                animator.SetFloat("Speed", blend);
            }
            else
            {
                animator.SetFloat("Speed", blend, 0.08f, Time.deltaTime);
            }
        }
    }
}
