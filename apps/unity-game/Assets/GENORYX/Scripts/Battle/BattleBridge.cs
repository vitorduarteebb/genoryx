using UnityEngine;

namespace Genoryx
{
    public class BattleBridge : MonoBehaviour
    {
        public BattleCameraDirector cameraDirector;
        public CreatureActor[] actors;

        public void LoadBattleState(string json)
        {
            Debug.Log($"[GENORYX:battle] state {json.Length}");
            if (cameraDirector != null)
            {
                cameraDirector.SetState(BattleCameraState.OVERVIEW);
            }
        }

        public void ApplyBattleEvent(string json)
        {
            if (json.Contains("FUSION"))
            {
                AudioHooks.Play(AudioHooks.Fusion);
                cameraDirector?.SetState(BattleCameraState.FUSION);
            }
            else if (json.Contains("CONVERGENCE"))
            {
                AudioHooks.Play(AudioHooks.Convergence);
                cameraDirector?.SetState(BattleCameraState.CONVERGENCE);
            }
            else if (json.Contains("ULTIMATE") || json.Contains("G10"))
            {
                cameraDirector?.SetState(BattleCameraState.ULTIMATE);
            }
            else if (json.Contains("DAMAGE") || json.Contains("HIT"))
            {
                AudioHooks.Play(AudioHooks.Hit);
                cameraDirector?.SetState(BattleCameraState.ACTION);
            }
            else
            {
                AudioHooks.Play(AudioHooks.Attack);
                cameraDirector?.SetState(BattleCameraState.ACTION);
            }
        }

        public void SetValidTargets(string json)
        {
            Debug.Log($"[GENORYX:battle] targets {json}");
        }

        public void SetSelectedCard(string json)
        {
            cameraDirector?.SetState(BattleCameraState.CARD_SELECTED);
        }

        public void SendTarget(string creatureId)
        {
            Application.ExternalCall("genoryxBattleIntent", $"{{\"type\":\"TARGET\",\"targetId\":\"{creatureId}\"}}");
        }
    }
}
