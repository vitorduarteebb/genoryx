using UnityEngine;
using UnityEngine.SceneManagement;

namespace Genoryx
{
    /// <summary>
    /// Vertical slice: Genesis Plaza + rua + portão + borda de Verdantis.
    /// Escala em metros. Player ~1.8. A câmera cabe uma praça, não a cidade.
    /// </summary>
    public static class HavenSliceBuilder
    {
        public const int Version = 8;
        public const float CameraPitch = 48f;
        public const float CameraYaw = 40f;
        public const float CameraDistance = 20f;
        public const float CameraFov = 36f;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void RebuildOnPlay()
        {
            if (!Application.isPlaying)
            {
                return;
            }

            SceneManager.sceneLoaded -= OnSceneLoaded;
            SceneManager.sceneLoaded += OnSceneLoaded;
            TryRebuild();
        }

        static void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            TryRebuild();
        }

        static void TryRebuild()
        {
            var scene = SceneManager.GetActiveScene();
            if (scene.name != "HavenSlice" && GameObject.Find("PlazaStone") == null)
            {
                return;
            }

            Rebuild();
        }

        public static void Rebuild()
        {
            Clear();
            Build();
        }

        public static void Clear()
        {
            var scene = SceneManager.GetActiveScene();
            if (!scene.IsValid())
            {
                return;
            }

            foreach (var root in scene.GetRootGameObjects())
            {
                if (root.GetComponent<HavenSliceRuntime>() != null)
                {
                    continue;
                }

                Object.DestroyImmediate(root);
            }
        }

        public static void Build()
        {
            SliceMaterials.ApplySky();
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogColor = new Color(0.62f, 0.72f, 0.78f);
            RenderSettings.fogDensity = 0.01f;
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.55f, 0.62f, 0.7f);
            RenderSettings.ambientEquatorColor = new Color(0.42f, 0.4f, 0.36f);
            RenderSettings.ambientGroundColor = new Color(0.18f, 0.2f, 0.16f);

            var sun = NewLight("KeyLight", LightType.Directional, new Color(1f, 0.93f, 0.78f), 1.45f);
            sun.transform.rotation = Quaternion.Euler(46f, -34f, 0f);
            var fill = NewLight("FillLight", LightType.Directional, new Color(0.45f, 0.58f, 0.72f), 0.32f);
            fill.transform.rotation = Quaternion.Euler(18f, 140f, 0f);

            Land();
            Plaza();
            RoadToGate();
            GenesisCore(Vector3.zero);
            House("House East", new Vector3(20.5f, 0f, 10f), 18f, new Color(0.66f, 0.58f, 0.48f));
            House("House West", new Vector3(-21f, 0f, 8.5f), -14f, new Color(0.58f, 0.52f, 0.46f));
            Stall("Market Stall", new Vector3(-3.2f, 0f, 18.5f));
            Stall("Market Stall B", new Vector3(3.4f, 0f, 19.2f));
            Shrine("Lyra Sanctuary", new Vector3(22.5f, 0f, -2f), new Color(0.72f, 0.52f, 0.78f));
            Banners("Arena Approach", new Vector3(-23f, 0f, 16f));
            Tree(new Vector3(-16f, 0f, 16.5f), 1f);
            Tree(new Vector3(17.5f, 0f, 15.8f), 0.92f);
            Tree(new Vector3(-18.5f, 0f, -8f), 0.88f);
            Tree(new Vector3(15.5f, 0f, -12f), 0.95f);
            SouthGate();
            VerdantisEdge();

            CharacterKit.Npc("Theo", CharacterRole.Merchant, new Vector3(-2.4f, 0f, 17.2f), CharacterQualityMode.NPC_NEAR);
            CharacterKit.Npc("Kael", CharacterRole.Researcher, new Vector3(-12.5f, 0f, 4.2f), CharacterQualityMode.NPC_NEAR);
            CharacterKit.Npc("Lyra", CharacterRole.Breeder, new Vector3(21.4f, 0f, -1.2f), CharacterQualityMode.NPC_NEAR);
            CharacterKit.Npc("Guard", CharacterRole.Guard, new Vector3(-3.4f, 0f, -38.6f), CharacterQualityMode.NPC_FAR);
            CharacterKit.Npc("Guard B", CharacterRole.Guard, new Vector3(3.4f, 0f, -38.6f), CharacterQualityMode.NPC_FAR);
            CharacterKit.Npc("Adventurer", CharacterRole.Adventurer, new Vector3(-5.5f, 0f, -24f), CharacterQualityMode.NPC_NEAR);
            CharacterKit.Npc("Mira", CharacterRole.Tamer, new Vector3(8.4f, 0f, 12.2f), CharacterQualityMode.NPC_NEAR);
            CharacterKit.Npc("Rook", CharacterRole.Guard, new Vector3(-8.2f, 0f, 10.5f), CharacterQualityMode.NPC_NEAR);
            CharacterKit.Npc("Sera", CharacterRole.Merchant, new Vector3(6.2f, 0f, -8.4f), CharacterQualityMode.NPC_FAR);
            CharacterKit.Npc("Nox", CharacterRole.Adventurer, new Vector3(-14.5f, 0f, -6.2f), CharacterQualityMode.NPC_FAR);

            var player = SpawnPlayer(new Vector3(0f, 0f, -18f));

            var baby = CreatureKit.PyronBaby("Companion", new Vector3(-1.2f, 0f, -19.4f));
            var follow = baby.AddComponent<CompanionFollower>();
            follow.owner = player.transform;
            follow.temperament = "FRIENDLY";
            follow.followDistance = WorldScale.FollowDistance;

            CrowdTest();

            var cam = new GameObject("WorldCamera");
            var camera = cam.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.Skybox;
            camera.backgroundColor = new Color(0.46f, 0.62f, 0.76f);
            camera.fieldOfView = CameraFov;
            camera.nearClipPlane = 0.15f;
            camera.farClipPlane = 180f;
            camera.tag = "MainCamera";
            cam.AddComponent<AudioListener>();
            var rig = cam.AddComponent<WorldCameraRig>();
            rig.target = player.transform;
            rig.pitch = CameraPitch;
            rig.yaw = CameraYaw;
            rig.distance = CameraDistance;
            rig.lookHeight = 1.5f;
            rig.minDistance = 16f;
            rig.maxDistance = 26f;
            rig.follow = 5.2f;

            var bridge = new GameObject("WorldBridge").AddComponent<WorldBridge>();
            bridge.player = player.GetComponent<PlayerMotor>();
            bridge.companion = follow;
            bridge.cameraRig = rig;

            var hud = new GameObject("WorldHud").AddComponent<WorldHud>();
            hud.characterName = "Tamer";
            hud.companionName = "Pyron";
            hud.companionStage = "Baby";
            hud.region = "Haven · Genesis Plaza";
        }

        static void Land()
        {
            Prim("Grass", PrimitiveType.Cube, new Vector3(0f, -0.24f, -8f), new Vector3(140f, 0.28f, 140f), new Color(0.22f, 0.34f, 0.18f), 0.12f);
            Prim("DirtRing", PrimitiveType.Cube, new Vector3(0f, -0.12f, 0f), new Vector3(62f, 0.12f, 58f), new Color(0.36f, 0.3f, 0.22f), 0.18f);
        }

        static void Plaza()
        {
            Prim("PlazaStone", PrimitiveType.Cube, new Vector3(0f, -0.02f, 0f), new Vector3(WorldScale.PlazaWidth, 0.16f, WorldScale.PlazaDepth), new Color(0.52f, 0.5f, 0.46f), 0.34f);
            Prim("PlazaInset", PrimitiveType.Cube, new Vector3(0f, 0.03f, 0f), new Vector3(WorldScale.CoreClearing, 0.08f, WorldScale.CoreClearing), new Color(0.4f, 0.48f, 0.5f), 0.42f);
            for (var i = 0; i < 8; i++)
            {
                var a = i * 45f * Mathf.Deg2Rad;
                Prim($"PlazaWear_{i}", PrimitiveType.Cube, new Vector3(Mathf.Sin(a) * 16f, 0.05f, Mathf.Cos(a) * 13.5f), new Vector3(2.2f, 0.06f, 1.2f), new Color(0.4f, 0.36f, 0.3f), 0.2f, Quaternion.Euler(0f, i * 45f, 0f));
            }
        }

        static void RoadToGate()
        {
            for (var i = 0; i < 10; i++)
            {
                var sway = Mathf.Sin(i * 0.45f) * 0.7f;
                Prim($"Road_{i}", PrimitiveType.Cube, new Vector3(sway, 0.03f, -22f - i * 2.05f), new Vector3(WorldScale.StreetMain, 0.1f, 2.2f), i % 2 == 0 ? new Color(0.4f, 0.33f, 0.26f) : new Color(0.46f, 0.38f, 0.3f), 0.16f, Quaternion.Euler(0f, sway * 5f, 0f));
            }
        }

        static void GenesisCore(Vector3 pos)
        {
            var root = new GameObject("GenesisCore");
            root.transform.position = pos;
            Child(root, "CoreBase", PrimitiveType.Cylinder, new Vector3(0f, 0.4f, 0f), new Vector3(5.2f, 0.4f, 5.2f), new Color(0.3f, 0.32f, 0.34f), 0.45f);
            Child(root, "CoreTrunk", PrimitiveType.Cylinder, new Vector3(0f, 4.6f, 0f), new Vector3(2.1f, 4.2f, 2.1f), new Color(0.22f, 0.38f, 0.42f), 0.38f);
            Child(root, "CoreRing", PrimitiveType.Cylinder, new Vector3(0f, 8.6f, 0f), new Vector3(3.4f, 0.14f, 3.4f), new Color(0.5f, 0.9f, 0.86f), 0.6f, default, new Color(0.12f, 0.7f, 0.62f));
            for (var i = 0; i < 4; i++)
            {
                var a = i * 90f * Mathf.Deg2Rad;
                Child(root, $"CoreRoot_{i}", PrimitiveType.Cube, new Vector3(Mathf.Cos(a) * 3.4f, 0.22f, Mathf.Sin(a) * 3.4f), new Vector3(3.8f, 0.28f, 0.55f), new Color(0.28f, 0.42f, 0.44f), 0.3f, Quaternion.Euler(0f, i * 90f, 8f));
            }

            var crystal = Child(root, "CoreCrystal", PrimitiveType.Cube, new Vector3(0f, 13.2f, 0f), new Vector3(2.2f, 3.4f, 2.2f), new Color(0.42f, 0.95f, 0.9f), 0.72f, Quaternion.Euler(18f, 20f, 12f), new Color(0.25f, 1.6f, 1.3f));
            var shardA = Child(root, "ShardA", PrimitiveType.Cube, new Vector3(3f, 10.4f, 0f), new Vector3(0.7f, 1.3f, 0.55f), new Color(0.55f, 0.95f, 0.9f), 0.65f, default, new Color(0.15f, 0.9f, 0.8f));
            var shardB = Child(root, "ShardB", PrimitiveType.Cube, new Vector3(-2.4f, 11f, 2.1f), new Vector3(0.55f, 1.1f, 0.45f), new Color(0.5f, 0.92f, 0.88f), 0.65f, default, new Color(0.15f, 0.85f, 0.75f));
            var shardC = Child(root, "ShardC", PrimitiveType.Cube, new Vector3(0.6f, 9.8f, -3f), new Vector3(0.5f, 0.95f, 0.4f), new Color(0.48f, 0.9f, 0.86f), 0.65f, default, new Color(0.12f, 0.8f, 0.7f));
            var glow = NewLight("CoreGlow", LightType.Point, new Color(0.4f, 0.95f, 0.88f), 3.2f);
            glow.range = 24f;
            glow.transform.SetParent(root.transform, false);
            glow.transform.localPosition = new Vector3(0f, 12.4f, 0f);
            var pulse = root.AddComponent<CorePulse>();
            pulse.crystal = crystal.transform;
            pulse.shards = new[] { shardA.transform, shardB.transform, shardC.transform };
            pulse.glow = glow;
        }

        static void House(string name, Vector3 pos, float yaw, Color wall)
        {
            var root = new GameObject(name);
            root.transform.SetPositionAndRotation(pos, Quaternion.Euler(0f, yaw, 0f));
            var wallH = 4.2f;
            Child(root, "Body", PrimitiveType.Cube, new Vector3(0f, wallH * 0.5f, 0f), new Vector3(WorldScale.HouseWidth, wallH, WorldScale.HouseDepth), wall, 0.22f);
            Child(root, "Roof", PrimitiveType.Cube, new Vector3(0f, wallH + 0.7f, 0f), new Vector3(WorldScale.HouseWidth + 0.8f, 1.2f, WorldScale.HouseDepth + 0.7f), new Color(0.46f, 0.22f, 0.2f), 0.18f, Quaternion.Euler(0f, 0f, 6f));
            Child(root, "Door", PrimitiveType.Cube, new Vector3(0f, WorldScale.DoorHeight * 0.5f, WorldScale.HouseDepth * 0.5f + 0.06f), new Vector3(WorldScale.DoorWidth, WorldScale.DoorHeight, 0.12f), new Color(0.22f, 0.16f, 0.12f), 0.2f);
            Child(root, "WindowL", PrimitiveType.Cube, new Vector3(-1.45f, 2.55f, WorldScale.HouseDepth * 0.5f + 0.05f), new Vector3(0.85f, 0.85f, 0.1f), new Color(0.95f, 0.78f, 0.42f), 0.7f, default, new Color(1.1f, 0.7f, 0.2f));
            Child(root, "WindowR", PrimitiveType.Cube, new Vector3(1.45f, 2.55f, WorldScale.HouseDepth * 0.5f + 0.05f), new Vector3(0.85f, 0.85f, 0.1f), new Color(0.95f, 0.78f, 0.42f), 0.7f, default, new Color(1.1f, 0.7f, 0.2f));
            Child(root, "Chimney", PrimitiveType.Cube, new Vector3(1.8f, wallH + 1.35f, -0.5f), new Vector3(0.55f, 1.1f, 0.55f), new Color(0.38f, 0.28f, 0.24f), 0.15f);
        }

        static void Stall(string name, Vector3 pos)
        {
            Prim(name, PrimitiveType.Cube, pos + Vector3.up * 0.55f, new Vector3(2.5f, 1.05f, 1.5f), new Color(0.48f, 0.32f, 0.18f), 0.2f);
            Prim("StallCloth", PrimitiveType.Cube, pos + new Vector3(0f, 1.32f, 0f), new Vector3(2.7f, 0.1f, 1.7f), new Color(0.82f, 0.62f, 0.18f), 0.35f);
            Prim("StallCanopy", PrimitiveType.Cube, pos + new Vector3(0f, 2.15f, 0f), new Vector3(3f, 0.08f, 1.9f), new Color(0.72f, 0.2f, 0.18f), 0.25f);
        }

        static void Shrine(string name, Vector3 pos, Color tone)
        {
            Prim(name, PrimitiveType.Cylinder, pos + Vector3.up * 1.05f, new Vector3(2.1f, 1.05f, 2.1f), tone, 0.4f);
            Prim(name + "Crystal", PrimitiveType.Cube, pos + new Vector3(0f, 2.5f, 0f), new Vector3(0.45f, 1.1f, 0.45f), new Color(0.82f, 0.55f, 0.95f), 0.7f, Quaternion.Euler(12f, 20f, 8f), new Color(0.7f, 0.25f, 1.1f));
        }

        static void Banners(string name, Vector3 pos)
        {
            for (var i = 0; i < 3; i++)
            {
                var p = pos + new Vector3(i * 2.15f, 2.35f, 0f);
                Prim($"{name}_{i}", PrimitiveType.Cylinder, p, new Vector3(0.16f, 2.35f, 0.16f), new Color(0.22f, 0.18f, 0.16f), 0.15f);
                Prim($"Banner_{i}", PrimitiveType.Cube, p + new Vector3(0.42f, 0.45f, 0f), new Vector3(0.85f, 1.5f, 0.07f), new Color(0.74f, 0.18f, 0.18f), 0.22f);
            }
        }

        static void Tree(Vector3 pos, float scale)
        {
            Prim("TreeTrunk", PrimitiveType.Cylinder, pos + Vector3.up * (1.55f * scale), new Vector3(0.42f, 1.55f, 0.42f) * scale, new Color(0.3f, 0.2f, 0.13f), 0.12f);
            Prim("TreeCanopy", PrimitiveType.Sphere, pos + Vector3.up * (4.1f * scale), Vector3.one * (3.3f * scale), new Color(0.16f, 0.36f, 0.18f), 0.14f);
            Prim("TreeCanopyB", PrimitiveType.Sphere, pos + new Vector3(0.55f * scale, 3.5f * scale, -0.3f * scale), Vector3.one * (2.2f * scale), new Color(0.2f, 0.4f, 0.2f), 0.14f);
        }

        static void SouthGate()
        {
            const float z = -41.5f;
            Prim("GatePillar_L", PrimitiveType.Cube, new Vector3(-3.6f, 3.2f, z), new Vector3(1.2f, 6.4f, 1.4f), new Color(0.48f, 0.46f, 0.42f), 0.3f);
            Prim("GatePillar_R", PrimitiveType.Cube, new Vector3(3.6f, 3.2f, z), new Vector3(1.2f, 6.4f, 1.4f), new Color(0.48f, 0.46f, 0.42f), 0.3f);
            Prim("SouthGate", PrimitiveType.Cube, new Vector3(0f, 6.5f, z), new Vector3(8.6f, 1.05f, 1.25f), new Color(0.54f, 0.5f, 0.44f), 0.32f);
            Prim("GateCrest", PrimitiveType.Cube, new Vector3(0f, 7.35f, z + 0.2f), new Vector3(1.2f, 1f, 0.3f), new Color(0.45f, 0.9f, 0.86f), 0.6f, default, new Color(0.15f, 0.7f, 0.65f));
        }

        static void VerdantisEdge()
        {
            for (var i = 0; i < 8; i++)
            {
                Tree(new Vector3(-18f + i * 5.1f, 0f, -50f - (i % 3) * 2.1f), 1.05f + (i % 3) * 0.08f);
            }

            Prim("VerdantisRidge", PrimitiveType.Cube, new Vector3(0f, 7.4f, -62f), new Vector3(70f, 16f, 8f), new Color(0.13f, 0.24f, 0.16f), 0.1f);
        }

        static void CrowdTest()
        {
            for (var i = 0; i < 10; i++)
            {
                var a = (i / 10f) * Mathf.PI * 2f + 0.35f;
                var radius = 12.5f + (i % 3) * 1.4f;
                var pos = new Vector3(Mathf.Cos(a) * radius, 0f, Mathf.Sin(a) * radius + 1.5f);
                if (pos.z < -16f)
                {
                    pos.z += 8f;
                }

                var tamer = SpawnCrowdTamer($"CrowdTamer_{i}", pos);
                var baby = CreatureKit.PyronBaby($"CrowdBaby_{i}", pos + new Vector3(-1.1f, 0f, -0.8f));
                var follow = baby.AddComponent<CompanionFollower>();
                follow.owner = tamer.transform;
                follow.temperament = "FRIENDLY";
                follow.followDistance = WorldScale.FollowDistance;
            }
        }

        static GameObject SpawnPlayer(Vector3 pos)
        {
            if (!CharacterAssets.PlayerCharacterReady())
            {
                Debug.LogError("[GENORYX] Tamer UnityReady/FASE 1 ausente. Player não será uma cápsula.");
                var missing = new GameObject("PlayerMissingMeshy");
                missing.transform.position = pos;
                missing.AddComponent<PlayerMotor>();
                missing.AddComponent<PlayerBeacon>();
                return missing;
            }

            var player = CharacterAssembler.SpawnPlayer("Player", pos, CharacterAppearanceStore.Load(), CharacterQualityMode.PLAYER_LOCAL);
            player.AddComponent<PlayerMotor>();
            player.AddComponent<PlayerBeacon>();
            return player;
        }

        static GameObject SpawnCrowdTamer(string name, Vector3 pos)
        {
            if (!CharacterAssets.PlayerCharacterReady())
            {
                var fallback = CharacterKit.Build(name, pos, CharacterRole.Tamer);
                fallback.AddComponent<CrowdDummy>();
                return fallback;
            }

            var tones = new[] { "sand", "tan", "bronze", "ivory", "umber" };
            var hairs = new[] { "dark_brown", "black", "blonde", "red", "white" };
            var data = CharacterAppearanceData.Phase1();
            data.skinTone = tones[Mathf.Abs(name.GetHashCode()) % tones.Length];
            data.hairColor = hairs[Mathf.Abs(name.GetHashCode() / 7) % hairs.Length];
            data.hairId = Mathf.Abs(name.GetHashCode()) % 2 == 0 ? "hair_01" : "hair_02";
            data.chestId = Mathf.Abs(name.GetHashCode() / 3) % 2 == 0 ? "chest_01" : "chest_02";
            data.legsId = Mathf.Abs(name.GetHashCode() / 5) % 2 == 0 ? "pants_01" : "pants_02";
            data.bootsId = Mathf.Abs(name.GetHashCode() / 11) % 2 == 0 ? "boots_01" : "boots_02";
            data.hairId = Mathf.Abs(name.GetHashCode()) % 2 == 0 ? "hair_01" : "hair_02";
            data.chestId = Mathf.Abs(name.GetHashCode() / 3) % 2 == 0 ? "chest_01" : "chest_02";
            data.legsId = Mathf.Abs(name.GetHashCode() / 5) % 2 == 0 ? "pants_01" : "pants_02";
            data.bootsId = Mathf.Abs(name.GetHashCode() / 11) % 2 == 0 ? "boots_01" : "boots_02";
            var tamer = CharacterAssembler.SpawnPlayer(name, pos, data, CharacterQualityMode.NPC_FAR);
            tamer.AddComponent<CrowdDummy>();
            return tamer;
        }

        static GameObject Prim(string name, PrimitiveType type, Vector3 pos, Vector3 scale, Color color, float smoothness, Quaternion rotation = default, Color? emission = null)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetPositionAndRotation(pos, rotation == default ? Quaternion.identity : rotation);
            go.transform.localScale = scale;
            SliceMaterials.Paint(go, color, smoothness, emission);
            return go;
        }

        static GameObject Child(GameObject parent, string name, PrimitiveType type, Vector3 localPos, Vector3 scale, Color color, float smoothness, Quaternion localRot = default, Color? emission = null)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetParent(parent.transform, false);
            go.transform.localPosition = localPos;
            go.transform.localRotation = localRot == default ? Quaternion.identity : localRot;
            go.transform.localScale = scale;
            SliceMaterials.Paint(go, color, smoothness, emission);
            return go;
        }

        static Light NewLight(string name, LightType type, Color color, float intensity)
        {
            var go = new GameObject(name);
            var light = go.AddComponent<Light>();
            light.type = type;
            light.color = color;
            light.intensity = intensity;
            light.shadows = LightShadows.Soft;
            return light;
        }
    }
}
