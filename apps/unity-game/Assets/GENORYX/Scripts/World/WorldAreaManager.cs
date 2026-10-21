using UnityEngine;

namespace Genoryx
{
    public class WorldAreaManager : MonoBehaviour
    {
        public static WorldAreaManager Instance { get; private set; }

        public string areaId = WorldAreaId.HavenGenesisPlaza;
        public string displayName = "Haven · Genesis Plaza";
        public Transform Player { get; set; }
        public Transform Companion { get; set; }
        public WorldCameraRig CameraRig { get; set; }

        public float defaultDistance = 20f;
        public float narrowDistance = 17.5f;
        public float vistaDistance = 24f;
        public float encounterDistance = 16.5f;

        void Awake()
        {
            Instance = this;
            areaId = WorldSession.AreaId;
            displayName = Label(areaId);
        }

        public static string Label(string id)
        {
            return id switch
            {
                WorldAreaId.HavenSouthGate => "Haven · South Gate",
                WorldAreaId.VerdantisGreenRoad => "Verdantis · Green Road",
                WorldAreaId.VerdantisLuminaGrove => "Verdantis · Lumina Grove",
                WorldAreaId.VerdantisHollow => "Verdantis · Hollow",
                _ => "Haven · Genesis Plaza"
            };
        }

        public WorldCameraState CameraForPlayer()
        {
            if (WorldEncounterSystem.Instance != null && WorldEncounterSystem.Instance.HasFocus)
            {
                return WorldCameraState.EncounterFocus;
            }

            if (WorldTransitionSystem.Instance != null && WorldTransitionSystem.Instance.Busy)
            {
                return WorldCameraState.GateTransition;
            }

            if (Player == null)
            {
                return WorldCameraState.Exploration;
            }

            var p = Player.position;
            if (areaId == WorldAreaId.HavenGenesisPlaza || areaId == WorldAreaId.HavenSouthGate)
            {
                if (p.z < -36f)
                {
                    return WorldCameraState.Vista;
                }

                if (p.z < -20f)
                {
                    return WorldCameraState.NarrowPath;
                }
            }

            if (areaId == WorldAreaId.VerdantisGreenRoad && Mathf.Abs(p.x) > 7f)
            {
                return WorldCameraState.NarrowPath;
            }

            return WorldCameraState.Exploration;
        }

        public float DistanceFor(WorldCameraState state)
        {
            return state switch
            {
                WorldCameraState.NarrowPath => narrowDistance,
                WorldCameraState.Vista => vistaDistance,
                WorldCameraState.EncounterFocus => encounterDistance,
                WorldCameraState.GateTransition => 18.5f,
                _ => defaultDistance
            };
        }

        public void Bind(Transform player, Transform companion, WorldCameraRig rig)
        {
            Player = player;
            Companion = companion;
            CameraRig = rig;
            if (WorldSession.PendingSpawn.HasValue && player != null)
            {
                player.position = WorldSession.PendingSpawn.Value;
                if (companion != null)
                {
                    companion.position = player.position + new Vector3(-1.4f, 0f, -1.1f);
                }

                WorldSession.PendingSpawn = null;
            }
        }
    }
}
