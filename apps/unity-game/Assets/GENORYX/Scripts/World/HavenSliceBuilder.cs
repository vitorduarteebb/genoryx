using UnityEngine;
using UnityEngine.SceneManagement;
using Genoryx.Creatures;

namespace Genoryx
{
    /// <summary>
    /// Haven · Genesis Plaza V1. Diorama jogável, não cidade aberta.
    /// </summary>
    public static class HavenSliceBuilder
    {
        public const int Version = 9;
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
            if (WorldSession.SuppressHavenAutoRebuild)
            {
                return;
            }

            if (WorldSession.AreaId == WorldAreaId.VerdantisGreenRoad || WorldSession.AreaId == WorldAreaId.VerdantisLuminaGrove)
            {
                return;
            }

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
            WorldSession.AreaId = WorldAreaId.HavenGenesisPlaza;
            SliceMaterials.ApplySky();
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;

            var sun = WorldSliceFactory.NewLight("KeyLight", LightType.Directional, new Color(1f, 0.93f, 0.78f), 1.35f);
            sun.transform.rotation = Quaternion.Euler(46f, -34f, 0f);
            var fill = WorldSliceFactory.NewLight("FillLight", LightType.Directional, new Color(0.45f, 0.58f, 0.72f), 0.28f);
            fill.transform.rotation = Quaternion.Euler(18f, 140f, 0f);

            Land();
            Plaza();
            RoadToGate();
            GenesisCore(Vector3.zero);
            House("House East", new Vector3(20.5f, 0f, 10f), 18f, new Color(0.66f, 0.58f, 0.48f));
            House("House West", new Vector3(-21f, 0f, 8.5f), -14f, new Color(0.58f, 0.52f, 0.46f));
            Market("Market Stall", new Vector3(-3.2f, 0f, 18.5f));
            Market("Market Stall B", new Vector3(3.4f, 0f, 19.2f), true);
            Shrine("Lyra Sanctuary", new Vector3(22.5f, 0f, -2f));
            ArenaApproach(new Vector3(-23f, 0f, 16f));
            WorldSliceFactory.Tree(new Vector3(-16f, 0f, 16.5f), 1f);
            WorldSliceFactory.Tree(new Vector3(17.5f, 0f, 15.8f), 0.92f);
            WorldSliceFactory.Tree(new Vector3(-18.5f, 0f, -8f), 0.88f);
            WorldSliceFactory.Tree(new Vector3(15.5f, 0f, -12f), 0.95f);
            SouthGate();
            VerdantisEdge();

            BindNpc(CharacterKit.Npc("Theo", CharacterRole.Merchant, new Vector3(-2.4f, 0f, 17.2f), CharacterQualityMode.NPC_NEAR), "npc.theo", "Orbes, tecidos e rumor de rota. O mercado vive aqui.");
            BindNpc(CharacterKit.Npc("Sera", CharacterRole.Merchant, new Vector3(3.6f, 0f, 18.1f), CharacterQualityMode.NPC_NEAR), "npc.sera", "Fruta da borda. Ainda segura, se você não for fundo demais.");
            BindNpc(CharacterKit.Npc("Lyra", CharacterRole.Breeder, new Vector3(21.4f, 0f, -1.2f), CharacterQualityMode.NPC_NEAR), "npc.lyra", "O shrine lê o pulso. Pesquisa, não milagre.");
            BindNpc(CharacterKit.Npc("Kael", CharacterRole.Researcher, new Vector3(8.2f, 0f, 3.4f), CharacterQualityMode.NPC_NEAR), "npc.kael", "O Core não é ornamento. É âncora.");
            BindNpc(CharacterKit.Npc("Guard", CharacterRole.Guard, new Vector3(-3.4f, 0f, -38.6f), CharacterQualityMode.NPC_FAR), "npc.guard.l", "Além do portão começa Verdantis. Volte antes do escuro.");
            BindNpc(CharacterKit.Npc("Guard B", CharacterRole.Guard, new Vector3(3.4f, 0f, -38.6f), CharacterQualityMode.NPC_FAR), "npc.guard.r", "A trilha é curta. A floresta não.");
            BindNpc(CharacterKit.Npc("Adventurer", CharacterRole.Adventurer, new Vector3(-5.5f, 0f, -24f), CharacterQualityMode.NPC_NEAR), "npc.adventurer", "Green Road está viva hoje. Vi algo verde na clareira.");

            var player = SpawnPlayer(WorldSession.PendingSpawn ?? new Vector3(0f, 0f, -18f));
            var companion = SpawnCompanion(player.transform);

            WorldSliceFactory.Discovery("haven.plaza", "Genesis Plaza descoberta", Vector3.zero, 10f);
            WorldSliceFactory.Discovery("haven.gate", "South Gate descoberta", new Vector3(0f, 0f, -40f), 7f);
            Poi("poi.core", "Genesis Core", "O pulso da cidade. Landmark e âncora.", Vector3.zero, 3.4f);
            Poi("poi.market", "Mercado", "Bancadas, lona e o cheiro de rota.", new Vector3(0f, 0f, 18.6f), 2.8f);
            Poi("poi.shrine", "Santuário da Lyra", "Pesquisa e energia, não altar de fé vazia.", new Vector3(22.5f, 0f, -2f), 2.6f);
            Poi("poi.arena", "Abordagem da Arena", "O círculo fica além. Ainda não é hoje.", new Vector3(-23f, 0f, 16f), 2.8f);

            var gate = new GameObject("SouthGateExit");
            gate.transform.position = new Vector3(0f, 0f, -42.2f);
            WorldSliceFactory.Interact(gate, "exit.south", "South Gate", "Atravessar para Verdantis", WorldInteractKind.Exit, "A floresta começa logo além do arco.", WorldAreaId.VerdantisGreenRoad, 3.2f);

            InstallSystems(player, companion);
        }

        static void InstallSystems(GameObject player, GameObject companion)
        {
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

            var systems = new GameObject("WorldSystems");
            var areas = systems.AddComponent<WorldAreaManager>();
            areas.areaId = WorldAreaId.HavenGenesisPlaza;
            areas.displayName = WorldAreaManager.Label(WorldAreaId.HavenGenesisPlaza);
            areas.Bind(player.transform, companion != null ? companion.transform : null, rig);
            systems.AddComponent<WorldInteractionSystem>();
            systems.AddComponent<WorldEncounterSystem>();
            systems.AddComponent<WorldTransitionSystem>();
            systems.AddComponent<WorldUIController>();
            systems.AddComponent<AmbientController>().Apply("haven");

            var bridge = systems.AddComponent<WorldBridge>();
            bridge.player = player.GetComponent<PlayerMotor>();
            bridge.companion = companion != null ? companion.GetComponent<CompanionFollower>() : null;
            bridge.companionRoot = companion != null ? companion.transform : null;
            bridge.cameraRig = rig;
        }

        static void Land()
        {
            WorldSliceFactory.Prim("Grass", PrimitiveType.Cube, new Vector3(0f, -0.24f, -8f), new Vector3(140f, 0.28f, 140f), new Color(0.22f, 0.34f, 0.18f), 0.12f, ground: true);
            WorldSliceFactory.Prim("DirtRing", PrimitiveType.Cube, new Vector3(0f, -0.12f, 0f), new Vector3(62f, 0.12f, 58f), new Color(0.36f, 0.3f, 0.22f), 0.18f, ground: true);
        }

        static void Plaza()
        {
            WorldSliceFactory.Prim("PlazaStone", PrimitiveType.Cube, new Vector3(0f, -0.02f, 0f), new Vector3(WorldScale.PlazaWidth, 0.16f, WorldScale.PlazaDepth), new Color(0.52f, 0.5f, 0.46f), 0.34f, ground: true);
            WorldSliceFactory.Prim("PlazaInset", PrimitiveType.Cube, new Vector3(0f, 0.03f, 0f), new Vector3(WorldScale.CoreClearing, 0.08f, WorldScale.CoreClearing), new Color(0.4f, 0.48f, 0.5f), 0.42f, ground: true);
            for (var i = 0; i < 8; i++)
            {
                var a = i * 45f * Mathf.Deg2Rad;
                WorldSliceFactory.Prim($"PlazaWear_{i}", PrimitiveType.Cube, new Vector3(Mathf.Sin(a) * 16f, 0.05f, Mathf.Cos(a) * 13.5f), new Vector3(2.2f, 0.06f, 1.2f), new Color(0.4f, 0.36f, 0.3f), 0.2f, Quaternion.Euler(0f, i * 45f, 0f), ground: true);
            }
        }

        static void RoadToGate()
        {
            for (var i = 0; i < 12; i++)
            {
                var sway = Mathf.Sin(i * 0.38f) * 0.85f;
                WorldSliceFactory.Prim($"Road_{i}", PrimitiveType.Cube, new Vector3(sway, 0.03f, -21.2f - i * 1.85f), new Vector3(WorldScale.StreetMain, 0.1f, 2.05f), i % 2 == 0 ? new Color(0.42f, 0.35f, 0.28f) : new Color(0.48f, 0.4f, 0.32f), 0.16f, Quaternion.Euler(0f, sway * 6f, 0f), ground: true);
            }
        }

        static void GenesisCore(Vector3 pos)
        {
            var root = new GameObject("GenesisCore");
            root.transform.position = pos;
            WorldSliceFactory.Child(root, "CoreBase", PrimitiveType.Cylinder, new Vector3(0f, 0.28f, 0f), new Vector3(6.2f, 0.28f, 6.2f), new Color(0.28f, 0.3f, 0.32f), 0.45f, obstacle: true);
            WorldSliceFactory.Child(root, "CorePlinth", PrimitiveType.Cylinder, new Vector3(0f, 0.7f, 0f), new Vector3(4.4f, 0.22f, 4.4f), new Color(0.34f, 0.4f, 0.42f), 0.4f, obstacle: true);
            WorldSliceFactory.Child(root, "CoreTrunk", PrimitiveType.Cylinder, new Vector3(0f, 4.6f, 0f), new Vector3(2.1f, 4.2f, 2.1f), new Color(0.22f, 0.38f, 0.42f), 0.38f, obstacle: true);
            WorldSliceFactory.Child(root, "CoreRing", PrimitiveType.Cylinder, new Vector3(0f, 8.6f, 0f), new Vector3(3.4f, 0.14f, 3.4f), new Color(0.5f, 0.9f, 0.86f), 0.6f, default, new Color(0.12f, 0.7f, 0.62f));
            WorldSliceFactory.Child(root, "CoreHalo", PrimitiveType.Cylinder, new Vector3(0f, 11.6f, 0f), new Vector3(2.2f, 0.06f, 2.2f), new Color(0.55f, 0.95f, 0.9f), 0.7f, default, new Color(0.18f, 0.85f, 0.78f));
            for (var i = 0; i < 4; i++)
            {
                var a = i * 90f * Mathf.Deg2Rad;
                WorldSliceFactory.Child(root, $"CoreRoot_{i}", PrimitiveType.Cube, new Vector3(Mathf.Cos(a) * 3.4f, 0.22f, Mathf.Sin(a) * 3.4f), new Vector3(3.8f, 0.28f, 0.55f), new Color(0.28f, 0.42f, 0.44f), 0.3f, Quaternion.Euler(0f, i * 90f, 8f), obstacle: true);
            }

            var crystal = WorldSliceFactory.Child(root, "CoreCrystal", PrimitiveType.Cube, new Vector3(0f, 13.2f, 0f), new Vector3(2.2f, 3.4f, 2.2f), new Color(0.42f, 0.95f, 0.9f), 0.72f, Quaternion.Euler(18f, 20f, 12f), new Color(0.25f, 1.6f, 1.3f));
            var shardA = WorldSliceFactory.Child(root, "ShardA", PrimitiveType.Cube, new Vector3(3f, 10.4f, 0f), new Vector3(0.7f, 1.3f, 0.55f), new Color(0.55f, 0.95f, 0.9f), 0.65f, default, new Color(0.15f, 0.9f, 0.8f));
            var shardB = WorldSliceFactory.Child(root, "ShardB", PrimitiveType.Cube, new Vector3(-2.4f, 11f, 2.1f), new Vector3(0.55f, 1.1f, 0.45f), new Color(0.5f, 0.92f, 0.88f), 0.65f, default, new Color(0.15f, 0.85f, 0.75f));
            var shardC = WorldSliceFactory.Child(root, "ShardC", PrimitiveType.Cube, new Vector3(0.6f, 9.8f, -3f), new Vector3(0.5f, 0.95f, 0.4f), new Color(0.48f, 0.9f, 0.86f), 0.65f, default, new Color(0.12f, 0.8f, 0.7f));
            var glow = WorldSliceFactory.NewLight("CoreGlow", LightType.Point, new Color(0.4f, 0.95f, 0.88f), 2.4f, 20f);
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
            WorldSliceFactory.Child(root, "Body", PrimitiveType.Cube, new Vector3(0f, wallH * 0.5f, 0f), new Vector3(WorldScale.HouseWidth, wallH, WorldScale.HouseDepth), wall, 0.22f, obstacle: true);
            WorldSliceFactory.Child(root, "Eave", PrimitiveType.Cube, new Vector3(0f, wallH + 0.12f, 0f), new Vector3(WorldScale.HouseWidth + 1.15f, 0.18f, WorldScale.HouseDepth + 1.0f), new Color(0.32f, 0.18f, 0.16f), 0.2f);
            WorldSliceFactory.Child(root, "Roof", PrimitiveType.Cube, new Vector3(0f, wallH + 0.82f, 0f), new Vector3(WorldScale.HouseWidth + 0.7f, 1.15f, WorldScale.HouseDepth + 0.55f), new Color(0.46f, 0.22f, 0.2f), 0.18f, Quaternion.Euler(0f, 0f, 6f));
            WorldSliceFactory.Child(root, "DoorFrame", PrimitiveType.Cube, new Vector3(0f, WorldScale.DoorHeight * 0.52f, WorldScale.HouseDepth * 0.5f + 0.04f), new Vector3(WorldScale.DoorWidth + 0.28f, WorldScale.DoorHeight + 0.18f, 0.1f), new Color(0.28f, 0.2f, 0.16f), 0.2f);
            WorldSliceFactory.Child(root, "Door", PrimitiveType.Cube, new Vector3(0f, WorldScale.DoorHeight * 0.5f, WorldScale.HouseDepth * 0.5f + 0.08f), new Vector3(WorldScale.DoorWidth, WorldScale.DoorHeight, 0.1f), new Color(0.22f, 0.16f, 0.12f), 0.2f);
            WorldSliceFactory.Child(root, "WindowL", PrimitiveType.Cube, new Vector3(-1.45f, 2.55f, WorldScale.HouseDepth * 0.5f + 0.05f), new Vector3(0.85f, 0.85f, 0.1f), new Color(0.95f, 0.78f, 0.42f), 0.7f, default, new Color(1.1f, 0.7f, 0.2f));
            WorldSliceFactory.Child(root, "WindowR", PrimitiveType.Cube, new Vector3(1.45f, 2.55f, WorldScale.HouseDepth * 0.5f + 0.05f), new Vector3(0.85f, 0.85f, 0.1f), new Color(0.95f, 0.78f, 0.42f), 0.7f, default, new Color(1.1f, 0.7f, 0.2f));
            WorldSliceFactory.Child(root, "SillL", PrimitiveType.Cube, new Vector3(-1.45f, 2.08f, WorldScale.HouseDepth * 0.5f + 0.08f), new Vector3(1.0f, 0.08f, 0.16f), new Color(0.3f, 0.22f, 0.18f), 0.18f);
            WorldSliceFactory.Child(root, "Chimney", PrimitiveType.Cube, new Vector3(1.8f, wallH + 1.45f, -0.5f), new Vector3(0.5f, 1.25f, 0.5f), new Color(0.38f, 0.28f, 0.24f), 0.15f);
            WorldSliceFactory.Child(root, "Planter", PrimitiveType.Cube, new Vector3(-2.3f, 0.22f, 2.35f), new Vector3(0.7f, 0.35f, 0.55f), new Color(0.34f, 0.24f, 0.18f), 0.16f);
            WorldSliceFactory.Child(root, "Crate", PrimitiveType.Cube, new Vector3(2.2f, 0.28f, 2.2f), new Vector3(0.55f, 0.45f, 0.5f), new Color(0.42f, 0.3f, 0.2f), 0.14f);
        }

        static void Market(string name, Vector3 pos, bool fruit = false)
        {
            var root = new GameObject(name);
            root.transform.position = pos;
            WorldSliceFactory.Child(root, "Bench", PrimitiveType.Cube, new Vector3(0f, 0.55f, 0f), new Vector3(2.6f, 0.16f, 1.15f), new Color(0.42f, 0.28f, 0.16f), 0.2f, obstacle: true);
            WorldSliceFactory.Child(root, "Legs", PrimitiveType.Cube, new Vector3(0f, 0.28f, 0f), new Vector3(2.4f, 0.45f, 0.22f), new Color(0.34f, 0.22f, 0.14f), 0.16f, obstacle: true);
            var cloth = WorldSliceFactory.Child(root, "Cloth", PrimitiveType.Cube, new Vector3(0f, 1.42f, 0f), new Vector3(2.9f, 0.08f, 1.7f), fruit ? new Color(0.28f, 0.48f, 0.36f) : new Color(0.82f, 0.62f, 0.18f), 0.32f);
            cloth.AddComponent<WorldClothSway>();
            WorldSliceFactory.Child(root, "Canopy", PrimitiveType.Cube, new Vector3(0f, 2.2f, 0f), new Vector3(3.1f, 0.07f, 1.95f), fruit ? new Color(0.22f, 0.38f, 0.3f) : new Color(0.72f, 0.2f, 0.18f), 0.25f);
            WorldSliceFactory.Child(root, "CrateA", PrimitiveType.Cube, new Vector3(-0.85f, 0.28f, 0.85f), new Vector3(0.55f, 0.4f, 0.45f), new Color(0.4f, 0.28f, 0.16f), 0.14f);
            WorldSliceFactory.Child(root, "Sack", PrimitiveType.Sphere, new Vector3(0.9f, 0.28f, 0.75f), new Vector3(0.5f, 0.38f, 0.5f), new Color(0.55f, 0.48f, 0.3f), 0.12f);
            if (fruit)
            {
                WorldSliceFactory.Child(root, "FruitA", PrimitiveType.Sphere, new Vector3(-0.3f, 0.78f, 0.1f), Vector3.one * 0.22f, new Color(0.82f, 0.28f, 0.2f), 0.35f);
                WorldSliceFactory.Child(root, "FruitB", PrimitiveType.Sphere, new Vector3(0.15f, 0.76f, -0.15f), Vector3.one * 0.2f, new Color(0.9f, 0.72f, 0.22f), 0.35f);
            }
        }

        static void Shrine(string name, Vector3 pos)
        {
            var root = new GameObject(name);
            root.transform.position = pos;
            WorldSliceFactory.Child(root, "Base", PrimitiveType.Cylinder, new Vector3(0f, 0.28f, 0f), new Vector3(3.1f, 0.28f, 3.1f), new Color(0.32f, 0.28f, 0.36f), 0.35f, obstacle: true);
            WorldSliceFactory.Child(root, "Plinth", PrimitiveType.Cylinder, new Vector3(0f, 1.05f, 0f), new Vector3(1.7f, 0.85f, 1.7f), new Color(0.48f, 0.36f, 0.54f), 0.4f, obstacle: true);
            WorldSliceFactory.Child(root, "Crystal", PrimitiveType.Cube, new Vector3(0f, 2.55f, 0f), new Vector3(0.55f, 1.35f, 0.55f), new Color(0.82f, 0.55f, 0.95f), 0.72f, Quaternion.Euler(12f, 20f, 8f), new Color(0.7f, 0.25f, 1.05f));
            WorldSliceFactory.Child(root, "StoneA", PrimitiveType.Cube, new Vector3(-1.15f, 0.22f, 0.7f), new Vector3(0.45f, 0.35f, 0.4f), new Color(0.36f, 0.32f, 0.38f), 0.18f);
            WorldSliceFactory.Child(root, "StoneB", PrimitiveType.Cube, new Vector3(1.05f, 0.18f, -0.55f), new Vector3(0.4f, 0.28f, 0.38f), new Color(0.34f, 0.3f, 0.36f), 0.18f);
            var glow = WorldSliceFactory.NewLight("ShrineGlow", LightType.Point, new Color(0.72f, 0.42f, 0.9f), 1.1f, 8f);
            glow.transform.SetParent(root.transform, false);
            glow.transform.localPosition = new Vector3(0f, 2.4f, 0f);
        }

        static void ArenaApproach(Vector3 pos)
        {
            var root = new GameObject("Arena Approach");
            root.transform.position = pos;
            WorldSliceFactory.Child(root, "Floor", PrimitiveType.Cube, new Vector3(2.1f, 0.04f, 0f), new Vector3(8.2f, 0.08f, 3.4f), new Color(0.4f, 0.34f, 0.28f), 0.2f);
            WorldSliceFactory.Child(root, "ArchL", PrimitiveType.Cube, new Vector3(0f, 2.4f, 0f), new Vector3(0.38f, 4.8f, 0.42f), new Color(0.34f, 0.3f, 0.28f), 0.22f, obstacle: true);
            WorldSliceFactory.Child(root, "ArchR", PrimitiveType.Cube, new Vector3(4.2f, 2.4f, 0f), new Vector3(0.38f, 4.8f, 0.42f), new Color(0.34f, 0.3f, 0.28f), 0.22f, obstacle: true);
            WorldSliceFactory.Child(root, "ArchTop", PrimitiveType.Cube, new Vector3(2.1f, 4.85f, 0f), new Vector3(4.8f, 0.38f, 0.5f), new Color(0.4f, 0.34f, 0.3f), 0.24f);
            for (var i = 0; i < 3; i++)
            {
                WorldSliceFactory.Child(root, $"Pole_{i}", PrimitiveType.Cylinder, new Vector3(i * 2.15f, 2.2f, -1.1f), new Vector3(0.14f, 2.2f, 0.14f), new Color(0.22f, 0.18f, 0.16f), 0.15f);
                WorldSliceFactory.Child(root, $"Banner_{i}", PrimitiveType.Cube, new Vector3(i * 2.15f + 0.4f, 2.55f, -1.1f), new Vector3(0.8f, 1.45f, 0.06f), new Color(0.74f, 0.18f, 0.18f), 0.22f);
            }
        }

        static void SouthGate()
        {
            const float z = -41.5f;
            var root = new GameObject("SouthGate");
            root.transform.position = new Vector3(0f, 0f, z);
            WorldSliceFactory.Child(root, "PillarL", PrimitiveType.Cube, new Vector3(-3.7f, 3.4f, 0f), new Vector3(1.35f, 6.8f, 1.55f), new Color(0.48f, 0.46f, 0.42f), 0.3f, obstacle: true);
            WorldSliceFactory.Child(root, "PillarR", PrimitiveType.Cube, new Vector3(3.7f, 3.4f, 0f), new Vector3(1.35f, 6.8f, 1.55f), new Color(0.48f, 0.46f, 0.42f), 0.3f, obstacle: true);
            WorldSliceFactory.Child(root, "Lintol", PrimitiveType.Cube, new Vector3(0f, 6.7f, 0f), new Vector3(9.2f, 1.15f, 1.4f), new Color(0.54f, 0.5f, 0.44f), 0.32f);
            WorldSliceFactory.Child(root, "Crest", PrimitiveType.Cube, new Vector3(0f, 7.7f, 0.22f), new Vector3(1.35f, 1.15f, 0.32f), new Color(0.45f, 0.9f, 0.86f), 0.6f, default, new Color(0.15f, 0.7f, 0.65f));
            WorldSliceFactory.Child(root, "Threshold", PrimitiveType.Cube, new Vector3(0f, 0.06f, 0.6f), new Vector3(6.4f, 0.12f, 2.2f), new Color(0.36f, 0.32f, 0.26f), 0.18f);
        }

        static void VerdantisEdge()
        {
            for (var i = 0; i < 10; i++)
            {
                WorldSliceFactory.Tree(new Vector3(-22f + i * 4.8f, 0f, -51f - (i % 3) * 2.4f), 1.08f + (i % 3) * 0.1f, new Color(0.12f, 0.3f, 0.16f));
            }

            WorldSliceFactory.Prim("VerdantisRidge", PrimitiveType.Cube, new Vector3(0f, 8.2f, -64f), new Vector3(78f, 18f, 9f), new Color(0.12f, 0.22f, 0.15f), 0.1f);
            WorldSliceFactory.Prim("VerdantisMist", PrimitiveType.Cube, new Vector3(0f, 3.2f, -56f), new Vector3(70f, 5f, 4f), new Color(0.4f, 0.55f, 0.46f), 0.05f, default, new Color(0.08f, 0.16f, 0.12f));
        }

        static void BindNpc(GameObject go, string id, string body)
        {
            var npc = go.GetComponent<NpcActor>();
            WorldSliceFactory.Interact(go, id, npc != null ? npc.displayName : go.name, "Falar", WorldInteractKind.Npc, body, id, 2.3f);
        }

        static void Poi(string id, string name, string body, Vector3 pos, float radius)
        {
            var go = new GameObject(id);
            go.transform.position = pos;
            WorldSliceFactory.Interact(go, id, name, "Observar", WorldInteractKind.Poi, body, id, radius);
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

        static GameObject SpawnCompanion(Transform owner)
        {
            var pos = owner.position + new Vector3(-1.35f, 0f, -1.2f);
            var dna = CreaturePresets.EmberDna();
            dna.growthStage = CreatureGrowthStage.Baby;
            dna.creatureId = "world-companion-pyron";
            var go = CreatureAssembler.Spawn("Companion", pos, dna);
            if (go.GetComponent<CreatureMotor>() == null)
            {
                go.AddComponent<CreatureMotor>();
            }

            var follow = go.AddComponent<CreatureCompanionFollower>();
            follow.Bind(owner);
            follow.idleRadius = 1.45f;
            follow.followRadius = 1.75f;
            follow.catchUpRadius = 4.8f;
            follow.sideOffset = 0.85f;
            follow.teleportRadius = 18f;
            return go;
        }
    }
}
