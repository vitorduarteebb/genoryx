using UnityEngine;

namespace Genoryx
{
    public enum CharacterRole
    {
        Tamer,
        Guard,
        Merchant,
        Researcher,
        Breeder,
        Adventurer
    }

    /// <summary>Humano 6,5–7 cabeças. Silhueta, não cápsula. docs/CHARACTER_ART.md</summary>
    public static class CharacterKit
    {
        const float Head = 0.26f;

        public static GameObject Build(string name, Vector3 pos, CharacterRole role)
        {
            var root = new GameObject(name);
            root.transform.position = pos;
            var palette = ColorsFor(role);

            Part(root, "Pelvis", PrimitiveType.Cube, new Vector3(0f, 0.92f, 0f), new Vector3(0.32f, 0.16f, 0.2f), palette.pants, 0.22f);
            Part(root, "Torso", PrimitiveType.Cube, new Vector3(0f, 1.22f, 0.02f), new Vector3(0.4f, 0.42f, 0.24f), palette.shirt, 0.28f);
            Part(root, "Chest", PrimitiveType.Cube, new Vector3(0f, 1.38f, 0.04f), new Vector3(0.44f, 0.2f, 0.26f), palette.vest, 0.2f);
            Part(root, "ShoulderL", PrimitiveType.Sphere, new Vector3(-0.24f, 1.42f, 0.02f), Vector3.one * 0.12f, palette.vest, 0.22f);
            Part(root, "ShoulderR", PrimitiveType.Sphere, new Vector3(0.24f, 1.42f, 0.02f), Vector3.one * 0.12f, palette.vest, 0.22f);

            var armL = Part(root, "ArmL", PrimitiveType.Capsule, new Vector3(-0.28f, 1.18f, 0.02f), new Vector3(0.08f, 0.2f, 0.08f), palette.shirt, 0.24f);
            var armR = Part(root, "ArmR", PrimitiveType.Capsule, new Vector3(0.28f, 1.18f, 0.02f), new Vector3(0.08f, 0.2f, 0.08f), palette.shirt, 0.24f);
            Part(armL, "HandL", PrimitiveType.Sphere, new Vector3(0f, -0.55f, 0.05f), Vector3.one * 0.55f, palette.skin, 0.3f);
            Part(armR, "HandR", PrimitiveType.Sphere, new Vector3(0f, -0.55f, 0.05f), Vector3.one * 0.55f, palette.skin, 0.3f);

            var legL = Part(root, "LegL", PrimitiveType.Capsule, new Vector3(-0.1f, 0.5f, 0f), new Vector3(0.1f, 0.28f, 0.1f), palette.pants, 0.2f);
            var legR = Part(root, "LegR", PrimitiveType.Capsule, new Vector3(0.1f, 0.5f, 0f), new Vector3(0.1f, 0.28f, 0.1f), palette.pants, 0.2f);
            Part(legL, "BootL", PrimitiveType.Cube, new Vector3(0f, -0.72f, 0.12f), new Vector3(1.15f, 0.35f, 1.7f), palette.boot, 0.18f);
            Part(legR, "BootR", PrimitiveType.Cube, new Vector3(0f, -0.72f, 0.12f), new Vector3(1.15f, 0.35f, 1.7f), palette.boot, 0.18f);

            Part(root, "Belt", PrimitiveType.Cube, new Vector3(0f, 1.02f, 0.03f), new Vector3(0.42f, 0.07f, 0.26f), palette.leather, 0.25f);
            Part(root, "Neck", PrimitiveType.Cylinder, new Vector3(0f, 1.48f, 0.02f), new Vector3(0.1f, 0.06f, 0.1f), palette.skin, 0.32f);
            var head = Part(root, "Head", PrimitiveType.Sphere, new Vector3(0f, 1.62f, 0.04f), Vector3.one * Head, palette.skin, 0.32f);
            Part(head, "EyeL", PrimitiveType.Sphere, new Vector3(-0.22f, 0.08f, 0.42f), new Vector3(0.22f, 0.22f, 0.12f), Color.white, 0.55f);
            Part(head, "EyeR", PrimitiveType.Sphere, new Vector3(0.22f, 0.08f, 0.42f), new Vector3(0.22f, 0.22f, 0.12f), Color.white, 0.55f);
            Part(head, "IrisL", PrimitiveType.Sphere, new Vector3(-0.22f, 0.08f, 0.48f), new Vector3(0.12f, 0.12f, 0.08f), palette.eyes, 0.4f);
            Part(head, "IrisR", PrimitiveType.Sphere, new Vector3(0.22f, 0.08f, 0.48f), new Vector3(0.12f, 0.12f, 0.08f), palette.eyes, 0.4f);
            Part(head, "Brow", PrimitiveType.Cube, new Vector3(0f, 0.22f, 0.38f), new Vector3(0.7f, 0.08f, 0.12f), palette.hair, 0.15f);
            Part(head, "Nose", PrimitiveType.Cube, new Vector3(0f, -0.02f, 0.48f), new Vector3(0.12f, 0.16f, 0.14f), palette.skin * 0.92f, 0.28f);
            Part(head, "Mouth", PrimitiveType.Cube, new Vector3(0f, -0.18f, 0.44f), new Vector3(0.22f, 0.05f, 0.08f), new Color(0.45f, 0.22f, 0.22f), 0.2f);

            Part(root, "HairCap", PrimitiveType.Sphere, new Vector3(0f, 1.72f, 0.0f), new Vector3(0.3f, 0.18f, 0.28f), palette.hair, 0.18f);
            Part(root, "HairFront", PrimitiveType.Sphere, new Vector3(0.02f, 1.7f, 0.12f), new Vector3(0.22f, 0.12f, 0.16f), palette.hair, 0.16f);
            Part(root, "HairSide", PrimitiveType.Sphere, new Vector3(-0.14f, 1.64f, 0.0f), new Vector3(0.12f, 0.16f, 0.18f), palette.hair, 0.16f);

            Dress(root, role, palette);
            root.AddComponent<CharacterMotion>();
            return root;
        }

        public static GameObject Npc(string name, CharacterRole role, Vector3 pos, CharacterQualityMode quality = CharacterQualityMode.NPC_NEAR)
        {
            var data = AppearanceFor(role);
            var go = CharacterAssembler.SpawnPlayer("Npc_" + name, pos, data, quality);
            var npc = go.AddComponent<NpcActor>();
            npc.displayName = name;
            npc.role = role.ToString().ToLowerInvariant();
            return go;
        }

        public static CharacterAppearanceData AppearanceFor(CharacterRole role)
        {
            var data = CharacterAppearanceData.Phase1();
            switch (role)
            {
                case CharacterRole.Guard:
                    data.hairId = "hair_01";
                    data.chestId = "chest_02";
                    data.legsId = "pants_02";
                    data.bootsId = "boots_01";
                    data.skinTone = "tan";
                    data.hairColor = "black";
                    break;
                case CharacterRole.Merchant:
                    data.hairId = "hair_02";
                    data.chestId = "chest_01";
                    data.legsId = "pants_01";
                    data.bootsId = "boots_02";
                    data.skinTone = "sand";
                    data.hairColor = "brown";
                    break;
                case CharacterRole.Researcher:
                    data.hairId = "hair_01";
                    data.chestId = "chest_02";
                    data.legsId = "pants_01";
                    data.bootsId = "boots_02";
                    data.skinTone = "ivory";
                    data.hairColor = "white";
                    break;
                case CharacterRole.Breeder:
                    data.hairId = "hair_02";
                    data.chestId = "chest_01";
                    data.legsId = "pants_02";
                    data.bootsId = "boots_01";
                    data.skinTone = "umber";
                    data.hairColor = "red";
                    break;
                case CharacterRole.Adventurer:
                    data.hairId = "hair_02";
                    data.chestId = "chest_02";
                    data.legsId = "pants_02";
                    data.bootsId = "boots_01";
                    data.skinTone = "bronze";
                    data.hairColor = "dark_brown";
                    break;
                default:
                    data.hairId = "hair_01";
                    data.chestId = "chest_01";
                    data.legsId = "pants_01";
                    data.bootsId = "boots_01";
                    break;
            }

            return data;
        }

        static void Dress(GameObject root, CharacterRole role, Palette p)
        {
            switch (role)
            {
                case CharacterRole.Tamer:
                    Part(root, "Badge", PrimitiveType.Cube, new Vector3(0.14f, 1.36f, 0.16f), new Vector3(0.07f, 0.09f, 0.03f), new Color(0.4f, 0.9f, 0.86f), 0.6f, new Color(0.2f, 0.8f, 0.7f));
                    Part(root, "Pouch", PrimitiveType.Cube, new Vector3(0.2f, 1.0f, 0.08f), new Vector3(0.1f, 0.1f, 0.08f), p.leather, 0.2f);
                    Part(root, "Bracer", PrimitiveType.Cylinder, new Vector3(-0.28f, 1.08f, 0.04f), new Vector3(0.09f, 0.07f, 0.09f), p.leather, 0.22f);
                    break;
                case CharacterRole.Guard:
                    Part(root, "Helm", PrimitiveType.Sphere, new Vector3(0f, 1.7f, 0.02f), new Vector3(0.3f, 0.16f, 0.28f), p.metal, 0.45f);
                    Part(root, "Spear", PrimitiveType.Cylinder, new Vector3(0.34f, 1.15f, 0.12f), new Vector3(0.04f, 0.7f, 0.04f), p.metal, 0.4f, null, Quaternion.Euler(12f, 0f, 8f));
                    Part(root, "SpearTip", PrimitiveType.Cube, new Vector3(0.38f, 1.82f, 0.22f), new Vector3(0.06f, 0.16f, 0.06f), new Color(0.7f, 0.74f, 0.72f), 0.5f);
                    break;
                case CharacterRole.Merchant:
                    Part(root, "Apron", PrimitiveType.Cube, new Vector3(0f, 1.12f, 0.14f), new Vector3(0.36f, 0.38f, 0.04f), p.accent, 0.25f);
                    Part(root, "BagL", PrimitiveType.Cube, new Vector3(-0.2f, 1.0f, 0.06f), new Vector3(0.1f, 0.12f, 0.1f), p.leather, 0.2f);
                    Part(root, "BagR", PrimitiveType.Cube, new Vector3(0.2f, 1.0f, 0.06f), new Vector3(0.1f, 0.12f, 0.1f), p.leather, 0.2f);
                    break;
                case CharacterRole.Researcher:
                    Part(root, "Collar", PrimitiveType.Cube, new Vector3(0f, 1.46f, 0.08f), new Vector3(0.32f, 0.08f, 0.18f), p.metal, 0.4f);
                    Part(root, "Crystal", PrimitiveType.Cube, new Vector3(0f, 1.4f, 0.18f), new Vector3(0.08f, 0.12f, 0.06f), new Color(0.45f, 0.92f, 0.88f), 0.7f, new Color(0.2f, 0.9f, 0.8f), Quaternion.Euler(18f, 12f, 0f));
                    break;
                case CharacterRole.Breeder:
                    Part(root, "Sash", PrimitiveType.Cube, new Vector3(0.02f, 1.24f, 0.14f), new Vector3(0.12f, 0.42f, 0.05f), p.accent, 0.22f, default, Quaternion.Euler(0f, 0f, 18f));
                    Part(root, "Leaf", PrimitiveType.Sphere, new Vector3(-0.16f, 1.7f, 0.08f), new Vector3(0.1f, 0.08f, 0.12f), new Color(0.28f, 0.5f, 0.3f), 0.18f);
                    break;
                case CharacterRole.Adventurer:
                    Part(root, "Cape", PrimitiveType.Cube, new Vector3(0f, 1.18f, -0.16f), new Vector3(0.38f, 0.55f, 0.06f), p.accent, 0.2f);
                    Part(root, "Pack", PrimitiveType.Cube, new Vector3(0f, 1.28f, -0.2f), new Vector3(0.28f, 0.24f, 0.14f), p.leather, 0.18f);
                    break;
            }
        }

        struct Palette
        {
            public Color skin, hair, eyes, shirt, vest, pants, boot, leather, metal, accent;
        }

        static Palette ColorsFor(CharacterRole role)
        {
            var p = new Palette
            {
                skin = new Color(0.8f, 0.64f, 0.5f),
                hair = new Color(0.16f, 0.1f, 0.08f),
                eyes = new Color(0.22f, 0.38f, 0.42f),
                shirt = new Color(0.72f, 0.62f, 0.48f),
                vest = new Color(0.38f, 0.28f, 0.2f),
                pants = new Color(0.24f, 0.24f, 0.26f),
                boot = new Color(0.18f, 0.12f, 0.1f),
                leather = new Color(0.32f, 0.2f, 0.12f),
                metal = new Color(0.45f, 0.46f, 0.48f),
                accent = new Color(0.35f, 0.72f, 0.68f)
            };

            switch (role)
            {
                case CharacterRole.Guard:
                    p.vest = new Color(0.34f, 0.34f, 0.36f);
                    p.shirt = new Color(0.28f, 0.3f, 0.32f);
                    p.accent = new Color(0.55f, 0.22f, 0.2f);
                    p.hair = new Color(0.22f, 0.18f, 0.14f);
                    break;
                case CharacterRole.Merchant:
                    p.vest = new Color(0.62f, 0.42f, 0.18f);
                    p.accent = new Color(0.82f, 0.64f, 0.22f);
                    p.hair = new Color(0.28f, 0.16f, 0.08f);
                    p.eyes = new Color(0.35f, 0.28f, 0.18f);
                    break;
                case CharacterRole.Researcher:
                    p.vest = new Color(0.28f, 0.38f, 0.44f);
                    p.shirt = new Color(0.55f, 0.62f, 0.66f);
                    p.hair = new Color(0.42f, 0.48f, 0.52f);
                    p.eyes = new Color(0.25f, 0.55f, 0.6f);
                    break;
                case CharacterRole.Breeder:
                    p.vest = new Color(0.42f, 0.32f, 0.38f);
                    p.shirt = new Color(0.7f, 0.58f, 0.62f);
                    p.accent = new Color(0.55f, 0.32f, 0.52f);
                    p.hair = new Color(0.35f, 0.18f, 0.22f);
                    p.eyes = new Color(0.42f, 0.28f, 0.48f);
                    break;
                case CharacterRole.Adventurer:
                    p.vest = new Color(0.3f, 0.38f, 0.24f);
                    p.accent = new Color(0.28f, 0.36f, 0.22f);
                    p.hair = new Color(0.2f, 0.14f, 0.08f);
                    break;
            }

            return p;
        }

        static GameObject Part(GameObject parent, string name, PrimitiveType type, Vector3 localPos, Vector3 scale, Color color, float smoothness, Color? emission = null, Quaternion rot = default)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetParent(parent.transform, false);
            go.transform.localPosition = localPos;
            go.transform.localRotation = rot == default ? Quaternion.identity : rot;
            go.transform.localScale = scale;
            SliceMaterials.Paint(go, color, smoothness, emission);
            var col = go.GetComponent<Collider>();
            if (col != null)
            {
                Object.DestroyImmediate(col);
            }

            return go;
        }
    }
}
