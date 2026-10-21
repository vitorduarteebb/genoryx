using UnityEngine;

namespace Genoryx
{
    public class WorldEncounterSystem : MonoBehaviour
    {
        public static WorldEncounterSystem Instance { get; private set; }

        public WorldInteractable Focus { get; private set; }
        public bool HasFocus => Focus != null;

        void Awake()
        {
            Instance = this;
            if (WorldSession.EncounterCleared && !string.IsNullOrEmpty(WorldSession.EncounterId))
            {
                var gone = GameObject.Find(WorldSession.EncounterId);
                if (gone != null)
                {
                    Destroy(gone);
                }

                WorldUIController.Toast("O encontro terminou. A trilha continua.");
                WorldSession.EncounterCleared = false;
                WorldSession.EncounterId = null;
            }
        }

        public void Open(WorldInteractable wild)
        {
            Focus = wild;
            WorldUIController.Encounter(wild.displayName, wild.body, wild.payload);
        }

        public void Observe()
        {
            if (Focus == null)
            {
                return;
            }

            WorldUIController.Dialogue(Focus.displayName, string.IsNullOrEmpty(Focus.body) ? "Ela observa você de volta." : Focus.body);
        }

        public void Fight()
        {
            if (Focus == null)
            {
                return;
            }

            WorldSession.EncounterId = Focus.id;
            var json = $"{{\"type\":\"ENCOUNTER\",\"spawnKey\":\"{Focus.id}\",\"species\":\"{Focus.payload}\"}}";
            if (WorldBridge.Instance != null)
            {
                WorldBridge.Instance.BeginEncounter(json);
            }

            WorldUIController.CloseModals();
        }

        public void Cancel()
        {
            Focus = null;
            WorldUIController.CloseModals();
        }

        public void ClearFocusTarget()
        {
            if (Focus != null)
            {
                Destroy(Focus.gameObject);
            }

            Focus = null;
            WorldSession.EncounterCleared = true;
        }
    }
}
