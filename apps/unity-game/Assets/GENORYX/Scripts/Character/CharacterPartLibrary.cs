using UnityEngine;

namespace Genoryx
{
    [CreateAssetMenu(menuName = "GENORYX/Character Part Library", fileName = "CharacterPartLibrary")]
    public class CharacterPartLibrary : ScriptableObject
    {
        public GameObject bodyPrefab;
        public Avatar canonicalAvatar;
        public RuntimeAnimatorController animator;
        public GameObject hair01;
        public GameObject hair02;
        public GameObject chest01;
        public GameObject chest02;
        public GameObject pants01;
        public GameObject pants02;
        public GameObject boots01;
        public GameObject boots02;
        public Material skinMaterial;
        public Material underwearMaterial;
        public Material eyeMaterial;
        public Material debugBody;
        public Material debugHair;
        public Material debugChest;
        public Material debugPants;
        public Material debugBoots;

        static CharacterPartLibrary cached;

        public static CharacterPartLibrary Load()
        {
            if (cached != null)
            {
                return cached;
            }

            cached = Resources.Load<CharacterPartLibrary>("CharacterPartLibrary");
            return cached;
        }

        public GameObject Prefab(string id)
        {
            return id switch
            {
                "canonical_body" => bodyPrefab,
                "hair_01" => hair01,
                "hair_02" => hair02,
                "chest_01" => chest01,
                "chest_02" => chest02,
                "pants_01" => pants01,
                "pants_02" => pants02,
                "boots_01" => boots01,
                "boots_02" => boots02,
                _ => null
            };
        }

        public bool Ready => bodyPrefab != null && canonicalAvatar != null && animator != null;
    }
}
