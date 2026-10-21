using UnityEngine;

namespace Genoryx.WorldArt
{
    /// <summary>
    /// Visual-only landmarks. World Engineer keeps colliders, interactables and camera.
    /// </summary>
    public static class WorldLandmarkVisual
    {
        public static GameObject SpawnGenesisCore(Vector3 position, bool mobile = false)
        {
            var root = new GameObject("HavenCorePrefab");
            root.transform.position = position;
            WorldSliceFactory.Child(root, "PlatformLow", PrimitiveType.Cylinder, new Vector3(0f, 0.12f, 0f), new Vector3(4.6f, 0.12f, 4.6f), WorldArtPalettes.StonePrimary, 0.32f, obstacle: true);
            WorldSliceFactory.Child(root, "PlatformMid", PrimitiveType.Cylinder, new Vector3(0f, 0.32f, 0f), new Vector3(3.4f, 0.1f, 3.4f), WorldArtPalettes.Ivory, 0.34f, obstacle: true);
            WorldSliceFactory.Child(root, "GoldRing", PrimitiveType.Cylinder, new Vector3(0f, 0.4f, 0f), new Vector3(3.55f, 0.03f, 3.55f), WorldArtPalettes.Gold, 0.55f);
            WorldSliceFactory.Child(root, "Pedestal", PrimitiveType.Cube, new Vector3(0f, 0.85f, 0f), new Vector3(1.35f, 0.9f, 1.35f), WorldArtPalettes.StoneSecondary, 0.28f, Quaternion.Euler(0f, 28f, 0f), obstacle: true);
            WorldSliceFactory.Child(root, "PedestalCut", PrimitiveType.Cube, new Vector3(0f, 1.15f, 0f), new Vector3(0.85f, 0.55f, 0.85f), WorldArtPalettes.Wood, 0.22f, Quaternion.Euler(0f, 12f, 0f));
            var crystal = WorldSliceFactory.Child(root, "MainCrystal", PrimitiveType.Cube, new Vector3(0f, 2.35f, 0f), new Vector3(0.95f, 1.7f, 0.7f), WorldArtPalettes.GenesisCyan, 0.62f, Quaternion.Euler(16f, 22f, 8f), WorldArtPalettes.GenesisCyan * 1.4f);
            crystal.transform.localScale = new Vector3(0.95f, 1.7f, 0.7f);
            SpawnShard(root, "ShardA", new Vector3(1.15f, 2.1f, 0.2f), new Vector3(0.28f, 0.62f, 0.22f));
            SpawnShard(root, "ShardB", new Vector3(-0.95f, 2.35f, 0.7f), new Vector3(0.22f, 0.5f, 0.18f));
            SpawnShard(root, "ShardC", new Vector3(0.2f, 1.95f, -1.1f), new Vector3(0.2f, 0.42f, 0.16f));
            if (!mobile)
            {
                SpawnShard(root, "ShardD", new Vector3(-0.7f, 2.6f, -0.55f), new Vector3(0.16f, 0.36f, 0.14f));
                WorldSliceFactory.Child(root, "EnergyRing", PrimitiveType.Cylinder, new Vector3(0f, 1.72f, 0f), new Vector3(2.1f, 0.04f, 2.1f), WorldArtPalettes.GenesisCyan, 0.7f, default, WorldArtPalettes.GenesisCyan * 0.8f);
            }

            WorldSliceFactory.Child(root, "GroundGlow", PrimitiveType.Cylinder, new Vector3(0f, 0.05f, 0f), new Vector3(3.2f, 0.02f, 3.2f), WorldArtPalettes.GenesisCyan, 0.1f, default, WorldArtPalettes.GenesisCyan * 0.15f);
            WorldSliceFactory.HitPad(root, 1.4f);
            return root;
        }

        static void SpawnShard(GameObject root, string name, Vector3 pos, Vector3 scale)
        {
            WorldSliceFactory.Child(root, name, PrimitiveType.Cube, pos, scale, WorldArtPalettes.GenesisCyan, 0.6f, Quaternion.Euler(18f, 30f, 12f), WorldArtPalettes.GenesisCyan);
        }

        public static GameObject SpawnSouthGate(Vector3 position)
        {
            var root = new GameObject("HavenSouthGatePrefab");
            root.transform.position = position;
            WorldSliceFactory.Child(root, "PillarL", PrimitiveType.Cube, new Vector3(-2.4f, 2.4f, 0f), new Vector3(1.1f, 4.8f, 1.1f), WorldArtPalettes.StoneSecondary, 0.28f, obstacle: true);
            WorldSliceFactory.Child(root, "PillarR", PrimitiveType.Cube, new Vector3(2.4f, 2.4f, 0f), new Vector3(1.1f, 4.8f, 1.1f), WorldArtPalettes.StoneSecondary, 0.28f, obstacle: true);
            WorldSliceFactory.Child(root, "Arch", PrimitiveType.Cube, new Vector3(0f, 4.7f, 0f), new Vector3(6.2f, 0.7f, 1.3f), WorldArtPalettes.Ivory, 0.3f, obstacle: true);
            WorldSliceFactory.Child(root, "Crest", PrimitiveType.Cube, new Vector3(0f, 5.35f, 0.1f), new Vector3(0.7f, 0.7f, 0.2f), WorldArtPalettes.GenesisCyan, 0.5f, Quaternion.Euler(0f, 0f, 45f), WorldArtPalettes.GenesisCyan);
            WorldSliceFactory.Child(root, "GuardL", PrimitiveType.Cube, new Vector3(-3.3f, 0.9f, 0.6f), new Vector3(0.9f, 1.8f, 0.9f), WorldArtPalettes.Wood, 0.2f);
            WorldSliceFactory.Child(root, "GuardR", PrimitiveType.Cube, new Vector3(3.3f, 0.9f, 0.6f), new Vector3(0.9f, 1.8f, 0.9f), WorldArtPalettes.Wood, 0.2f);
            WorldSliceFactory.Child(root, "BannerL", PrimitiveType.Cube, new Vector3(-2.4f, 3.2f, 0.7f), new Vector3(0.12f, 1.6f, 0.5f), WorldArtPalettes.Roof, 0.15f);
            WorldSliceFactory.Child(root, "BannerR", PrimitiveType.Cube, new Vector3(2.4f, 3.2f, 0.7f), new Vector3(0.12f, 1.6f, 0.5f), WorldArtPalettes.Roof, 0.15f);
            WorldSliceFactory.HitPad(root, 1.6f);
            return root;
        }

        public static GameObject SpawnLyraShrine(Vector3 position)
        {
            var root = new GameObject("HavenLyraShrinePrefab");
            root.transform.position = position;
            var violet = new Color(0.55f, 0.32f, 0.72f);
            WorldSliceFactory.Child(root, "Base", PrimitiveType.Cylinder, new Vector3(0f, 0.16f, 0f), new Vector3(2.4f, 0.16f, 2.4f), WorldArtPalettes.StoneSecondary, 0.28f, obstacle: true);
            WorldSliceFactory.Child(root, "Research", PrimitiveType.Cube, new Vector3(0.7f, 0.55f, 0.2f), new Vector3(0.7f, 0.5f, 0.7f), WorldArtPalettes.Wood, 0.2f);
            WorldSliceFactory.Child(root, "Crystal", PrimitiveType.Cube, new Vector3(0f, 1.4f, 0f), new Vector3(0.45f, 1.3f, 0.45f), violet, 0.55f, Quaternion.Euler(12f, 18f, 8f), violet * 1.3f);
            WorldSliceFactory.Child(root, "Plant", PrimitiveType.Sphere, new Vector3(-0.8f, 0.4f, 0.5f), new Vector3(0.6f, 0.45f, 0.6f), WorldArtPalettes.Foliage, 0.12f);
            WorldSliceFactory.HitPad(root, 1.1f);
            return root;
        }

        public static GameObject SpawnArenaApproach(Vector3 position)
        {
            var root = new GameObject("HavenArenaApproachPrefab");
            root.transform.position = position;
            WorldSliceFactory.Child(root, "Path", PrimitiveType.Cube, new Vector3(0f, 0.04f, 1.2f), new Vector3(2.4f, 0.08f, 4.2f), WorldArtPalettes.StoneSecondary, 0.2f);
            WorldSliceFactory.Child(root, "PillarL", PrimitiveType.Cube, new Vector3(-1.5f, 1.6f, 0f), new Vector3(0.55f, 3.2f, 0.55f), WorldArtPalettes.StonePrimary, 0.26f, obstacle: true);
            WorldSliceFactory.Child(root, "PillarR", PrimitiveType.Cube, new Vector3(1.5f, 1.6f, 0f), new Vector3(0.55f, 3.2f, 0.55f), WorldArtPalettes.StonePrimary, 0.26f, obstacle: true);
            WorldSliceFactory.Child(root, "Arch", PrimitiveType.Cube, new Vector3(0f, 3.2f, 0f), new Vector3(3.6f, 0.4f, 0.55f), WorldArtPalettes.Roof, 0.22f);
            WorldSliceFactory.Child(root, "Crest", PrimitiveType.Cube, new Vector3(0f, 3.55f, 0.1f), new Vector3(0.4f, 0.4f, 0.12f), WorldArtPalettes.Gold, 0.4f);
            WorldSliceFactory.HitPad(root, 1.2f);
            return root;
        }

        public static GameObject SpawnWaystone(Vector3 position)
        {
            var root = new GameObject("VerdantisWaystonePrefab");
            root.transform.position = position;
            WorldSliceFactory.Child(root, "Stone", PrimitiveType.Cube, new Vector3(0f, 1.1f, 0f), new Vector3(1.8f, 2.2f, 1.1f), WorldArtPalettes.AncientStone, 0.18f, Quaternion.Euler(8f, 16f, -6f), obstacle: true);
            WorldSliceFactory.Child(root, "Split", PrimitiveType.Cube, new Vector3(0.4f, 1.7f, 0.1f), new Vector3(0.55f, 1.3f, 0.4f), WorldArtPalettes.AncientStone, 0.18f, Quaternion.Euler(14f, -8f, 12f));
            WorldSliceFactory.Child(root, "Moss", PrimitiveType.Cube, new Vector3(-0.15f, 0.28f, 0.45f), new Vector3(1.3f, 0.14f, 0.55f), WorldArtPalettes.Moss, 0.1f);
            WorldSliceFactory.Child(root, "Rune", PrimitiveType.Cube, new Vector3(0f, 1.25f, 0.58f), new Vector3(0.22f, 0.55f, 0.05f), WorldArtPalettes.MagicCyan, 0.5f, default, WorldArtPalettes.MagicCyan * 0.6f);
            WorldSliceFactory.Child(root, "Root", PrimitiveType.Cube, new Vector3(-0.7f, 0.22f, 0.2f), new Vector3(1.4f, 0.16f, 0.22f), WorldArtPalettes.Wood, 0.12f, Quaternion.Euler(0f, 24f, 8f));
            WorldSliceFactory.HitPad(root, 1.1f);
            return root;
        }

        public static GameObject SpawnCrystalHollow(Vector3 position)
        {
            var root = new GameObject("VerdantisHollowPrefab");
            root.transform.position = position;
            WorldSliceFactory.Child(root, "MoundL", PrimitiveType.Sphere, new Vector3(-1.3f, 0.85f, 0.1f), new Vector3(2.6f, 1.8f, 2.2f), WorldArtPalettes.DeepGreen, 0.08f, obstacle: true);
            WorldSliceFactory.Child(root, "MoundR", PrimitiveType.Sphere, new Vector3(1.35f, 0.8f, -0.2f), new Vector3(2.4f, 1.7f, 2.1f), WorldArtPalettes.ForestGreen, 0.08f, obstacle: true);
            WorldSliceFactory.Child(root, "Mouth", PrimitiveType.Cube, new Vector3(0f, 0.7f, 0.9f), new Vector3(1.2f, 1.2f, 0.3f), WorldArtPalettes.Shadow, 0.05f);
            WorldSliceFactory.Child(root, "Crystal", PrimitiveType.Cube, new Vector3(-0.35f, 0.85f, 0.4f), new Vector3(0.28f, 0.7f, 0.28f), WorldArtPalettes.MagicCyan, 0.55f, Quaternion.Euler(18f, 10f, 8f), WorldArtPalettes.MagicCyan);
            WorldSliceFactory.HitPad(root, 1.25f);
            return root;
        }
    }
}
