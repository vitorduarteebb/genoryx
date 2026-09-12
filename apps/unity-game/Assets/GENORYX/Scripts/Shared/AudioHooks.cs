using UnityEngine;

namespace Genoryx
{
    public static class AudioHooks
    {
        public const string WorldAmbient = "worldAmbient";
        public const string MobAggro = "mobAggro";
        public const string BattleStart = "battleStart";
        public const string Attack = "attack";
        public const string Hit = "hit";
        public const string Fusion = "fusion";
        public const string Convergence = "convergence";
        public const string Victory = "victory";
        public const string MaturationGain = "maturationGain";
        public const string EvolutionReady = "evolutionReady";
        public const string Evolution = "evolution";

        public static void Play(string hook)
        {
            Debug.Log($"[GENORYX:audio] {hook}");
        }
    }
}
