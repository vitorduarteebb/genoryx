using UnityEngine;

namespace Genoryx.WorldArt
{
    public enum HavenHouseSilhouette
    {
        Compact,
        Tall,
        Wide,
    }

    public static class WorldBuildingVisual
    {
        public static GameObject SpawnHouse(string name, Vector3 position, float yaw, HavenHouseSilhouette silhouette)
        {
            var root = new GameObject(name);
            root.transform.SetPositionAndRotation(position, Quaternion.Euler(0f, yaw, 0f));
            var width = silhouette == HavenHouseSilhouette.Wide ? 7.4f : 5.4f;
            var depth = silhouette == HavenHouseSilhouette.Tall ? 6.4f : 5.2f;
            var wallH = silhouette == HavenHouseSilhouette.Tall ? 4.2f : 3.1f;
            WorldSliceFactory.Child(root, "StoneBase", PrimitiveType.Cube, new Vector3(0f, 0.28f, 0f), new Vector3(width + 0.3f, 0.56f, depth + 0.3f), WorldArtPalettes.StoneSecondary, 0.24f, obstacle: true);
            WorldSliceFactory.Child(root, "Walls", PrimitiveType.Cube, new Vector3(0f, 0.56f + wallH * 0.5f, 0f), new Vector3(width, wallH, depth), WorldArtPalettes.Ivory, 0.2f, obstacle: true);
            WorldSliceFactory.Child(root, "Roof", PrimitiveType.Cube, new Vector3(0f, 0.56f + wallH + 0.7f, 0f), new Vector3(width + 0.8f, 0.55f, depth + 0.7f), WorldArtPalettes.Roof, 0.18f, Quaternion.Euler(0f, 0f, silhouette == HavenHouseSilhouette.Tall ? 8f : 4f));
            WorldSliceFactory.Child(root, "Ridge", PrimitiveType.Cube, new Vector3(0f, 0.56f + wallH + 1.05f, 0f), new Vector3(width * 0.2f, 0.18f, depth + 0.4f), WorldArtPalettes.Wood, 0.16f);
            WorldSliceFactory.Child(root, "Chimney", PrimitiveType.Cube, new Vector3(width * 0.28f, 0.56f + wallH + 1.35f, -depth * 0.15f), new Vector3(0.55f, 1.1f, 0.55f), WorldArtPalettes.StoneSecondary, 0.2f);
            WorldSliceFactory.Child(root, "Door", PrimitiveType.Cube, new Vector3(0f, 1.1f, depth * 0.51f), new Vector3(0.85f, 1.6f, 0.12f), WorldArtPalettes.Wood, 0.12f);
            WorldSliceFactory.Child(root, "WindowL", PrimitiveType.Cube, new Vector3(-width * 0.22f, 1.7f, depth * 0.51f), new Vector3(0.5f, 0.55f, 0.08f), WorldArtPalettes.WindowGlow, 0.4f, default, WorldArtPalettes.WindowGlow * 0.6f);
            WorldSliceFactory.Child(root, "WindowR", PrimitiveType.Cube, new Vector3(width * 0.22f, 1.7f, depth * 0.51f), new Vector3(0.5f, 0.55f, 0.08f), WorldArtPalettes.WindowGlow, 0.4f, default, WorldArtPalettes.WindowGlow * 0.6f);
            WorldSliceFactory.Child(root, "Eave", PrimitiveType.Cube, new Vector3(0f, 0.56f + wallH + 0.35f, depth * 0.55f), new Vector3(width + 0.4f, 0.1f, 0.35f), WorldArtPalettes.Wood, 0.14f);
            return root;
        }

        public static GameObject SpawnMarketStall(Vector3 position, float yaw = 0f)
        {
            var root = new GameObject("HavenMarketStallPrefab");
            root.transform.SetPositionAndRotation(position, Quaternion.Euler(0f, yaw, 0f));
            WorldSliceFactory.Child(root, "Counter", PrimitiveType.Cube, new Vector3(0f, 0.55f, 0f), new Vector3(2.4f, 1.1f, 1.1f), WorldArtPalettes.Wood, 0.16f, obstacle: true);
            WorldSliceFactory.Child(root, "Canopy", PrimitiveType.Cube, new Vector3(0f, 1.85f, 0f), new Vector3(2.8f, 0.12f, 1.6f), WorldArtPalettes.Roof, 0.14f);
            WorldSliceFactory.Child(root, "PoleL", PrimitiveType.Cube, new Vector3(-1.2f, 1.1f, 0.6f), new Vector3(0.12f, 2.2f, 0.12f), WorldArtPalettes.Wood, 0.1f);
            WorldSliceFactory.Child(root, "PoleR", PrimitiveType.Cube, new Vector3(1.2f, 1.1f, 0.6f), new Vector3(0.12f, 2.2f, 0.12f), WorldArtPalettes.Wood, 0.1f);
            WorldSliceFactory.Child(root, "Crate", PrimitiveType.Cube, new Vector3(-0.7f, 0.28f, 0.7f), new Vector3(0.55f, 0.45f, 0.45f), WorldArtPalettes.Gold, 0.18f);
            WorldSliceFactory.Child(root, "Sack", PrimitiveType.Sphere, new Vector3(0.7f, 0.28f, 0.55f), new Vector3(0.5f, 0.38f, 0.5f), WorldArtPalettes.Earth, 0.1f);
            WorldSliceFactory.Child(root, "Lantern", PrimitiveType.Sphere, new Vector3(0f, 1.55f, 0.2f), Vector3.one * 0.22f, WorldArtPalettes.WindowGlow, 0.4f, default, WorldArtPalettes.WindowGlow * 0.5f);
            WorldSliceFactory.HitPad(root, 1f);
            return root;
        }
    }
}
