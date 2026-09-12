using UnityEngine;

namespace Genoryx
{
    public enum BattleCameraState
    {
        OVERVIEW,
        CARD_SELECTED,
        TARGET_SELECTION,
        ACTION,
        REACTION,
        ULTIMATE,
        FUSION,
        CONVERGENCE,
        KO,
        VICTORY
    }

    public class BattleCameraDirector : MonoBehaviour
    {
        public Transform overview;
        public Transform action;
        public Transform ultimate;
        public float damp = 4.5f;
        public BattleCameraState state = BattleCameraState.OVERVIEW;

        public void SetState(BattleCameraState next)
        {
            state = next;
        }

        void LateUpdate()
        {
            var dest = state switch
            {
                BattleCameraState.ULTIMATE or BattleCameraState.CONVERGENCE => ultimate,
                BattleCameraState.ACTION or BattleCameraState.FUSION => action,
                _ => overview
            };
            if (dest == null)
            {
                return;
            }
            transform.position = Vector3.Lerp(transform.position, dest.position, Time.deltaTime * damp);
            transform.rotation = Quaternion.Slerp(transform.rotation, dest.rotation, Time.deltaTime * damp);
        }
    }
}
