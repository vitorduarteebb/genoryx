using UnityEngine;

namespace Genoryx
{
    /// <summary>
    /// Intenção só. Servidor valida movimento, encounter, respawn e recompensas.
    /// </summary>
    public class WorldBridge : MonoBehaviour
    {
        public static WorldBridge Instance { get; private set; }

        public PlayerMotor player;
        public CompanionFollower companion;
        public Transform companionRoot;
        public WorldCameraRig cameraRig;

        void Awake()
        {
            Instance = this;
        }

        public void ApplyWorldState(string json)
        {
            Debug.Log($"[GENORYX:world] state {json.Length}");
            if (json.Contains("encounterCleared") || json.Contains("ENCOUNTER_CLEAR"))
            {
                WorldEncounterSystem.Instance?.ClearFocusTarget();
            }
        }

        public void ApplyMobs(string json)
        {
            Debug.Log("[GENORYX:world] mobs");
        }

        public void BeginEncounter(string json)
        {
            AudioHooks.Play(AudioHooks.BattleStart);
            var cinematic = gameObject.GetComponent<EncounterCinematic>() ?? gameObject.AddComponent<EncounterCinematic>();
            cinematic.worldCamera = cameraRig != null ? cameraRig.GetComponent<Camera>() : Camera.main;
            if (WorldEncounterSystem.Instance != null && WorldEncounterSystem.Instance.Focus != null)
            {
                cinematic.focus = WorldEncounterSystem.Instance.Focus.transform;
            }

            cinematic.Play(json);
            SendIntent(json);
        }

        public void SendMove(float x, float y, int sequence)
        {
            SendIntent($"{{\"type\":\"MOVE\",\"x\":{x},\"y\":{y},\"sequence\":{sequence}}}");
        }

        public void SendInteract(string spawnKey, string npcKey)
        {
            SendIntent($"{{\"type\":\"INTERACT\",\"spawnKey\":\"{spawnKey}\",\"npcKey\":\"{npcKey}\"}}");
        }

        void SendIntent(string json)
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            Application.ExternalCall("genoryxWorldIntent", json);
#else
            Debug.Log("[GENORYX:world-intent] " + json);
#endif
        }

        public string LocalAppearanceIds()
        {
            var assembler = player != null ? player.GetComponent<CharacterAssembler>() : null;
            return CharacterAppearanceStore.ToNetworkPayload(assembler != null ? assembler.appearance : CharacterAppearanceData.Phase1());
        }

        public GameObject SpawnRemotePlayer(string id, Vector3 pos, string appearanceJson)
        {
            return CharacterAssembler.SpawnPlayer("Remote_" + id, pos, CharacterAppearanceStore.FromNetworkPayload(appearanceJson), CharacterQualityMode.PLAYER_REMOTE);
        }

        public void ApplyRemoteAppearance(GameObject target, string appearanceJson)
        {
            var assembler = target != null ? target.GetComponent<CharacterAssembler>() : null;
            assembler?.ApplyAppearance(CharacterAppearanceStore.FromNetworkPayload(appearanceJson));
        }
    }
}
