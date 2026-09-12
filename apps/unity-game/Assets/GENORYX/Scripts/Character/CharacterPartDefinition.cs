using UnityEngine;

namespace Genoryx
{
    public enum CharacterSlot
    {
        BODY,
        FACE,
        HAIR,
        EYEBROWS,
        BEARD,
        CHEST,
        LEGS,
        GLOVES,
        BOOTS,
        SHOULDER,
        CAPE,
        BACK,
        ACCESSORY,
        WEAPON_RIGHT,
        WEAPON_LEFT
    }

    public enum BodyRegion
    {
        HEAD,
        SCALP,
        TORSO,
        UPPER_ARM_L,
        UPPER_ARM_R,
        LOWER_ARM_L,
        LOWER_ARM_R,
        HAND_L,
        HAND_R,
        PELVIS,
        UPPER_LEG_L,
        UPPER_LEG_R,
        LOWER_LEG_L,
        LOWER_LEG_R,
        FOOT_L,
        FOOT_R
    }

    [CreateAssetMenu(menuName = "GENORYX/Character Part", fileName = "CharacterPart")]
    public class CharacterPartDefinition : ScriptableObject
    {
        public string id;
        public string displayName;
        public CharacterSlot slot;
        public string[] bodyCompatibility = { "canonical_body" };
        public GameObject prefab;
        public string streamingRelativePath;
        public Sprite icon;
        public Material[] materials;
        public BodyRegion[] hiddenBodyRegions;
        public string rarity = "COMMON";
        public string unlockType = "DEFAULT";
    }
}
