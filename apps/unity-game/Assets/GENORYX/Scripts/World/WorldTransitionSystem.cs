using System.Collections;
using UnityEngine;

namespace Genoryx
{
    public class WorldTransitionSystem : MonoBehaviour
    {
        public static WorldTransitionSystem Instance { get; private set; }

        public bool Busy { get; private set; }

        void Awake()
        {
            Instance = this;
        }

        public void Travel(string areaId, Vector3 from)
        {
            if (Busy || string.IsNullOrEmpty(areaId))
            {
                return;
            }

            StartCoroutine(Run(areaId, from));
        }

        IEnumerator Run(string areaId, Vector3 from)
        {
            Busy = true;
            AudioHooks.Play(AudioHooks.WorldAmbient);
            WorldUIController.Fade(1f, 0.45f);
            if (WorldAreaManager.Instance != null && WorldAreaManager.Instance.CameraRig != null)
            {
                WorldAreaManager.Instance.CameraRig.ForceState(WorldCameraState.GateTransition);
            }

            yield return new WaitForSeconds(0.5f);

            WorldSession.AreaId = areaId;
            WorldSession.SuppressHavenAutoRebuild = areaId != WorldAreaId.HavenGenesisPlaza && areaId != WorldAreaId.HavenSouthGate;
            WorldSession.PendingSpawn = SpawnFor(areaId, from);

            if (areaId == WorldAreaId.VerdantisGreenRoad || areaId == WorldAreaId.VerdantisLuminaGrove)
            {
                VerdantisGreenRoadBuilder.Rebuild();
            }
            else
            {
                WorldSession.SuppressHavenAutoRebuild = false;
                HavenSliceBuilder.Rebuild();
            }

            WorldUIController.Fade(0f, 0.55f);
            WorldUIController.Toast(WorldAreaManager.Label(areaId) + " descoberta");
            Busy = false;
        }

        static Vector3 SpawnFor(string areaId, Vector3 from)
        {
            return areaId switch
            {
                WorldAreaId.VerdantisGreenRoad => new Vector3(0f, 0f, 16f),
                WorldAreaId.HavenGenesisPlaza => new Vector3(0f, 0f, -36f),
                WorldAreaId.HavenSouthGate => new Vector3(0f, 0f, -36f),
                _ => from
            };
        }
    }
}
