using UnityEngine;

namespace Genoryx
{
    public class WorldInteractionSystem : MonoBehaviour
    {
        public static WorldInteractionSystem Instance { get; private set; }

        public WorldInteractable Selected { get; private set; }

        void Awake()
        {
            Instance = this;
        }

        public void Select(WorldInteractable item)
        {
            if (item == null)
            {
                return;
            }

            Selected = item;
            var player = WorldAreaManager.Instance != null ? WorldAreaManager.Instance.Player : null;
            if (player != null && !item.InRange(player.position))
            {
                var motor = player.GetComponent<PlayerMotor>();
                if (motor != null)
                {
                    motor.Destination = item.transform.position;
                }

                WorldUIController.Prompt(item.displayName, "Aproxime-se para interagir");
                return;
            }

            Open(item);
        }

        public void ClearIfWalking()
        {
            if (WorldUIController.ModalOpen)
            {
                return;
            }

            Selected = null;
            WorldUIController.ClearPrompt();
        }

        public void Confirm()
        {
            if (Selected != null)
            {
                Open(Selected);
            }
        }

        void Update()
        {
            if (Selected == null || WorldAreaManager.Instance == null || WorldAreaManager.Instance.Player == null)
            {
                return;
            }

            if (Selected.InRange(WorldAreaManager.Instance.Player.position) && !WorldUIController.ModalOpen)
            {
                WorldUIController.Prompt(Selected.displayName, Selected.prompt);
            }
        }

        void Open(WorldInteractable item)
        {
            Selected = item;
            switch (item.kind)
            {
                case WorldInteractKind.Npc:
                case WorldInteractKind.Poi:
                case WorldInteractKind.Collectable:
                    WorldUIController.Dialogue(item.displayName, string.IsNullOrEmpty(item.body) ? item.prompt : item.body);
                    WorldBridge.Instance?.SendInteract(item.id, item.displayName);
                    break;
                case WorldInteractKind.Exit:
                    WorldTransitionSystem.Instance?.Travel(item.payload, item.transform.position);
                    break;
                case WorldInteractKind.Wild:
                    WorldEncounterSystem.Instance?.Open(item);
                    break;
            }
        }
    }
}
