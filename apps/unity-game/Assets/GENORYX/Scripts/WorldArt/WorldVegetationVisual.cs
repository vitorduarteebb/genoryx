using UnityEngine;

namespace Genoryx.WorldArt
{
    public static class WorldVegetationVisual
    {
        public static GameObject SpawnHavenTree(Vector3 position, int variant)
        {
            return SpawnTree(position, variant, false);
        }

        public static GameObject SpawnVerdantisTree(Vector3 position, int variant)
        {
            return SpawnTree(position, variant, true);
        }

        static GameObject SpawnTree(Vector3 position, int variant, bool verdantis)
        {
            var root = new GameObject(verdantis ? $"VerdantisTree_{variant}" : $"HavenTree_{variant}");
            root.transform.position = position;
            var lean = (variant % 4 - 1.5f) * 7f;
            var height = verdantis ? 3.4f + variant * 0.35f : 2.8f + variant * 0.28f;
            var canopy = verdantis ? WorldArtPalettes.ForestGreen : WorldArtPalettes.Foliage;
            WorldSliceFactory.Child(root, "Trunk", PrimitiveType.Cylinder, new Vector3(0f, height * 0.28f, 0f), new Vector3(0.38f, height * 0.28f, 0.38f), WorldArtPalettes.Wood, 0.12f, Quaternion.Euler(0f, 0f, lean * 0.15f), obstacle: true);
            WorldSliceFactory.Child(root, "CanopyA", PrimitiveType.Sphere, new Vector3(0f, height, 0f), Vector3.one * (1.8f + variant * 0.15f), canopy, 0.08f);
            WorldSliceFactory.Child(root, "CanopyB", PrimitiveType.Sphere, new Vector3(-0.55f, height - 0.2f, 0.2f), Vector3.one * 1.15f, verdantis ? WorldArtPalettes.DeepGreen : WorldArtPalettes.Moss, 0.08f);
            WorldSliceFactory.Child(root, "CanopyC", PrimitiveType.Sphere, new Vector3(0.5f, height + 0.15f, -0.15f), Vector3.one * 0.95f, verdantis ? WorldArtPalettes.Moss : WorldArtPalettes.ForestGreen, 0.08f);
            return root;
        }

        public static GameObject SpawnBush(Vector3 position, int variant)
        {
            var root = new GameObject($"Bush_{variant}");
            root.transform.position = position;
            WorldSliceFactory.Child(root, "Body", PrimitiveType.Sphere, new Vector3(0f, 0.35f, 0f), new Vector3(0.9f + variant * 0.08f, 0.55f, 0.8f), WorldArtPalettes.Foliage, 0.08f);
            return root;
        }

        public static GameObject SpawnRockGroup(Vector3 position, int variant)
        {
            var root = new GameObject($"Rocks_{variant}");
            root.transform.position = position;
            WorldSliceFactory.Child(root, "A", PrimitiveType.Cube, new Vector3(0f, 0.18f, 0f), new Vector3(0.7f, 0.35f, 0.55f), WorldArtPalettes.AncientStone, 0.16f, Quaternion.Euler(8f, 12f, -4f));
            WorldSliceFactory.Child(root, "B", PrimitiveType.Cube, new Vector3(0.35f, 0.12f, 0.2f), new Vector3(0.4f, 0.22f, 0.32f), WorldArtPalettes.StoneSecondary, 0.16f);
            return root;
        }
    }
}
