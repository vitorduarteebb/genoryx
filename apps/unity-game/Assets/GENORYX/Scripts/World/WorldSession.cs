using UnityEngine;

namespace Genoryx
{
    /// <summary>Estado persistente entre rebuilds da mesma sessão de Play.</summary>
    public static class WorldSession
    {
        public static string AreaId = WorldAreaId.HavenGenesisPlaza;
        public static Vector3? PendingSpawn;
        public static bool SuppressHavenAutoRebuild;
        public static string EncounterId;
        public static bool EncounterCleared;
        public static string LastToast;
    }
}
