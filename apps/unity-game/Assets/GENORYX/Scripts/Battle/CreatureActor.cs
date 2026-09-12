using UnityEngine;

namespace Genoryx
{
    public enum CreatureActorState
    {
        SPAWN,
        IDLE,
        SELECTED,
        TARGETED,
        ATTACK,
        CAST,
        REACTION,
        HIT,
        DODGE,
        STATUS,
        KO,
        VICTORY
    }

    public enum AnimationCapability
    {
        STATIC,
        ROOT_ANIMATED,
        RIGGED,
        FULL_ANIMATED
    }

    public class CreatureActor : MonoBehaviour
    {
        public string creatureId;
        public string slot;
        public CreatureActorState state = CreatureActorState.IDLE;
        public AnimationCapability capability = AnimationCapability.STATIC;
        public Animator animator;
        public PresenceController presence;
        public Transform hpAnchor;
        Vector3 rest;

        void Awake()
        {
            rest = transform.localPosition;
            if (presence == null)
            {
                presence = gameObject.AddComponent<PresenceController>();
            }
        }

        public void SetState(CreatureActorState next)
        {
            state = next;
            if (capability == AnimationCapability.RIGGED || capability == AnimationCapability.FULL_ANIMATED)
            {
                if (animator != null)
                {
                    animator.SetTrigger(next.ToString());
                }
                return;
            }

            StopAllCoroutines();
            if (next == CreatureActorState.ATTACK)
            {
                StartCoroutine(Lunge(1.1f));
            }
            else if (next == CreatureActorState.HIT)
            {
                StartCoroutine(Lunge(-0.45f));
            }
            else if (next == CreatureActorState.KO)
            {
                transform.localRotation = Quaternion.Euler(12f, 0f, 18f);
            }
        }

        System.Collections.IEnumerator Lunge(float amount)
        {
            var peak = rest + transform.forward * amount;
            var t = 0f;
            while (t < 0.16f)
            {
                t += Time.deltaTime;
                transform.localPosition = Vector3.Lerp(rest, peak, t / 0.16f);
                yield return null;
            }
            t = 0f;
            while (t < 0.18f)
            {
                t += Time.deltaTime;
                transform.localPosition = Vector3.Lerp(peak, rest, t / 0.18f);
                yield return null;
            }
            transform.localPosition = rest;
        }
    }
}
