using UnityEngine;

namespace Genoryx
{
    public static class CharacterAssets
    {
        public static CharacterPartLibrary Library()
        {
            return CharacterPartLibrary.Load();
        }

        public static bool PrefabPipelineReady()
        {
            var lib = Library();
            return lib != null && lib.bodyPrefab != null;
        }

        public static bool PlayerCharacterReady()
        {
            return PrefabPipelineReady() || CharacterGltfLoader.Phase1Ready();
        }
    }
}
