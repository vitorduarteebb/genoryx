using UnityEngine;
using Genoryx.Creatures;

namespace Genoryx
{
    /// <summary>Primeiro mapa externo: trilha, landmark, hollow, 1–2 wilds 3D.</summary>
    public static class VerdantisGreenRoadBuilder
    {
        public static void Rebuild()
        {
            HavenSliceBuilder.Clear();
            Build();
        }

        public static void Build()
        {
            WorldSession.AreaId = WorldAreaId.VerdantisGreenRoad;
            SliceMaterials.ApplySky();
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;

            var sun = WorldSliceFactory.NewLight("KeyLight", LightType.Directional, new Color(0.92f, 0.96f, 0.82f), 1.2f);
            sun.transform.rotation = Quaternion.Euler(42f, -20f, 0f);
            var fill = WorldSliceFactory.NewLight("FillLight", LightType.Directional, new Color(0.35f, 0.48f, 0.42f), 0.24f);
            fill.transform.rotation = Quaternion.Euler(16f, 150f, 0f);

            WorldSliceFactory.Prim("ForestFloor", PrimitiveType.Cube, new Vector3(0f, -0.22f, -6f), new Vector3(86f, 0.28f, 92f), new Color(0.2f, 0.32f, 0.16f), 0.1f, ground: true);
            Path();
            Stream();
            Landmark();
            Hollow();
            Relic();
            GroveHint();
            CampStub();

            for (var i = 0; i < 14; i++)
            {
                var side = i % 2 == 0 ? -1f : 1f;
                WorldSliceFactory.Tree(new Vector3(side * (8.5f + (i % 4) * 1.4f), 0f, 12f - i * 3.4f), 1.05f + (i % 4) * 0.08f, new Color(0.1f, 0.28f + (i % 3) * 0.04f, 0.14f));
            }

            WorldSliceFactory.Prim("CanopyWallN", PrimitiveType.Cube, new Vector3(0f, 7f, 28f), new Vector3(70f, 14f, 6f), new Color(0.1f, 0.2f, 0.12f), 0.08f);
            WorldSliceFactory.Prim("CanopyWallS", PrimitiveType.Cube, new Vector3(0f, 8f, -38f), new Vector3(74f, 16f, 8f), new Color(0.1f, 0.22f, 0.13f), 0.08f);

            var spawn = WorldSession.PendingSpawn ?? new Vector3(0f, 0f, 16f);
            var player = SpawnPlayer(spawn);
            var companion = SpawnCompanion(player.transform);
            var wild = SpawnWild("wild.florune", CreaturePresets.NatureDna(), new Vector3(-6.2f, 0f, -8.4f), "Florune", "CURIOUS", WorldWildBehavior.Curious, "Temperamento curioso. Natureza visível.");
            SpawnWild("wild.terranox", CreaturePresets.EmberDna(), new Vector3(9.4f, 0f, -18.5f), "Criatura desconhecida", "TERRITORIAL", WorldWildBehavior.Territorial, "Não se aproxima. O chão é dela.");

            WorldSliceFactory.Discovery("verdantis.road", "Verdantis · Green Road descoberta", new Vector3(0f, 0f, 10f), 8f);
            WorldSliceFactory.Discovery("verdantis.grove", "Lumina Grove à vista", new Vector3(-11f, 0f, -22f), 6f);

            var back = new GameObject("ExitHaven");
            back.transform.position = new Vector3(0f, 0f, 18.6f);
            WorldSliceFactory.Interact(back, "exit.haven", "Trilha de Haven", "Voltar a Haven", WorldInteractKind.Exit, "O portão sul ainda está perto.", WorldAreaId.HavenGenesisPlaza, 3f);

            var grove = new GameObject("ExitGrove");
            grove.transform.position = new Vector3(-12.5f, 0f, -24f);
            WorldSliceFactory.Interact(grove, "exit.grove", "Lumina Grove", "Entrar na clareira", WorldInteractKind.Poi, "A luz muda entre as árvores. Ainda um recanto, não uma dungeon.", WorldAreaId.VerdantisLuminaGrove, 2.6f);

            InstallSystems(player, companion);
            if (WorldSession.EncounterCleared && wild != null)
            {
                Object.Destroy(wild);
            }
        }

        static void Path()
        {
            for (var i = 0; i < 16; i++)
            {
                var sway = Mathf.Sin(i * 0.42f) * 1.15f;
                WorldSliceFactory.Prim($"Trail_{i}", PrimitiveType.Cube, new Vector3(sway, 0.04f, 14f - i * 2.15f), new Vector3(4.4f, 0.1f, 2.3f), i % 2 == 0 ? new Color(0.38f, 0.3f, 0.2f) : new Color(0.34f, 0.28f, 0.18f), 0.14f, Quaternion.Euler(0f, sway * 8f, 0f), ground: true);
            }

            for (var i = 0; i < 5; i++)
            {
                WorldSliceFactory.Prim($"Fork_{i}", PrimitiveType.Cube, new Vector3(-3.2f - i * 1.7f, 0.04f, -10f - i * 1.1f), new Vector3(2.6f, 0.08f, 1.8f), new Color(0.32f, 0.26f, 0.16f), 0.12f, Quaternion.Euler(0f, -32f, 0f), ground: true);
            }
        }

        static void Stream()
        {
            WorldSliceFactory.Prim("Stream", PrimitiveType.Cube, new Vector3(5.6f, -0.02f, -4f), new Vector3(1.6f, 0.08f, 22f), new Color(0.28f, 0.48f, 0.52f), 0.55f, default, new Color(0.08f, 0.22f, 0.28f), ground: true);
            WorldSliceFactory.Prim("StoneA", PrimitiveType.Cube, new Vector3(4.6f, 0.18f, -2.2f), new Vector3(0.8f, 0.35f, 0.7f), new Color(0.55f, 0.54f, 0.5f), 0.2f);
            WorldSliceFactory.Prim("StoneB", PrimitiveType.Cube, new Vector3(6.5f, 0.14f, -8.4f), new Vector3(0.7f, 0.28f, 0.6f), new Color(0.5f, 0.5f, 0.46f), 0.2f);
        }

        static void Landmark()
        {
            var root = new GameObject("Waystone");
            root.transform.position = new Vector3(1.2f, 0f, -6.5f);
            WorldSliceFactory.Child(root, "Rock", PrimitiveType.Cube, new Vector3(0f, 1.1f, 0f), new Vector3(2.4f, 2.2f, 1.6f), new Color(0.42f, 0.4f, 0.36f), 0.18f, Quaternion.Euler(8f, 18f, -6f), obstacle: true);
            WorldSliceFactory.Child(root, "Split", PrimitiveType.Cube, new Vector3(0.55f, 1.8f, 0.1f), new Vector3(0.7f, 1.6f, 0.55f), new Color(0.48f, 0.46f, 0.4f), 0.2f, Quaternion.Euler(12f, -10f, 18f));
            WorldSliceFactory.Child(root, "Moss", PrimitiveType.Cube, new Vector3(-0.2f, 0.35f, 0.7f), new Vector3(1.6f, 0.16f, 0.7f), new Color(0.22f, 0.4f, 0.2f), 0.12f);
            WorldSliceFactory.Child(root, "Rune", PrimitiveType.Cube, new Vector3(0f, 1.4f, 0.82f), new Vector3(0.35f, 0.7f, 0.08f), new Color(0.45f, 0.9f, 0.82f), 0.6f, default, new Color(0.12f, 0.7f, 0.6f));
            WorldSliceFactory.Interact(root, "poi.waystone", "Waystone partida", "Observar", WorldInteractKind.Poi, "Pedra antiga, musgo e um traço ciano. Landmark da Green Road.", "waystone", 2.6f);
        }

        static void Hollow()
        {
            var root = new GameObject("Hollow");
            root.transform.position = new Vector3(-11.5f, 0f, -16f);
            WorldSliceFactory.Child(root, "MoundL", PrimitiveType.Sphere, new Vector3(-1.6f, 0.9f, 0.2f), new Vector3(3.4f, 2.2f, 2.8f), new Color(0.22f, 0.3f, 0.18f), 0.1f, obstacle: true);
            WorldSliceFactory.Child(root, "MoundR", PrimitiveType.Sphere, new Vector3(1.7f, 0.85f, -0.3f), new Vector3(3.2f, 2.1f, 2.6f), new Color(0.2f, 0.28f, 0.16f), 0.1f, obstacle: true);
            WorldSliceFactory.Child(root, "Mouth", PrimitiveType.Cube, new Vector3(0f, 0.85f, 1.1f), new Vector3(1.6f, 1.5f, 0.4f), new Color(0.08f, 0.08f, 0.1f), 0.05f);
            WorldSliceFactory.Interact(root, "poi.hollow", "Hollow", "Olhar para dentro", WorldInteractKind.Poi, "Há algo além do caminho. Ainda não é dungeon.", "hollow", 2.8f);
        }

        static void Relic()
        {
            var root = new GameObject("Relic");
            root.transform.position = new Vector3(8.8f, 0f, 2.4f);
            WorldSliceFactory.Child(root, "Crystal", PrimitiveType.Cube, new Vector3(0f, 0.7f, 0f), new Vector3(0.4f, 1.1f, 0.4f), new Color(0.45f, 0.88f, 0.92f), 0.7f, Quaternion.Euler(16f, 12f, 8f), new Color(0.15f, 0.7f, 0.85f));
            WorldSliceFactory.Interact(root, "poi.crystal", "Cristal de borda", "Colher traço", WorldInteractKind.Collectable, "Um traço de energia. Descoberta simples, sem loot inventado no cliente.", "crystal", 2.2f);
        }

        static void GroveHint()
        {
            WorldSliceFactory.Tree(new Vector3(-12f, 0f, -26f), 1.55f, new Color(0.18f, 0.42f, 0.28f));
            WorldSliceFactory.Prim("GroveGlow", PrimitiveType.Sphere, new Vector3(-12.2f, 2.2f, -25.4f), Vector3.one * 1.4f, new Color(0.4f, 0.85f, 0.7f), 0.4f, default, new Color(0.1f, 0.45f, 0.35f));
        }

        static void CampStub()
        {
            WorldSliceFactory.Prim("CampStone", PrimitiveType.Cylinder, new Vector3(-2.4f, 0.12f, 6.5f), new Vector3(1.4f, 0.12f, 1.4f), new Color(0.3f, 0.26f, 0.2f), 0.16f, ground: true);
            WorldSliceFactory.Prim("CampAsh", PrimitiveType.Cylinder, new Vector3(-2.4f, 0.2f, 6.5f), new Vector3(0.55f, 0.08f, 0.55f), new Color(0.16f, 0.14f, 0.12f), 0.1f);
        }

        static GameObject SpawnWild(string id, CreatureDNA dna, Vector3 pos, string name, string temperament, WorldWildBehavior behavior, string body)
        {
            dna.growthStage = CreatureGrowthStage.Young;
            dna.creatureId = id;
            var go = CreatureAssembler.Spawn(id, pos, dna);
            if (go.GetComponent<CreatureMotor>() == null)
            {
                go.AddComponent<CreatureMotor>();
            }

            var actor = go.AddComponent<WorldWildActor>();
            actor.behavior = behavior;
            actor.roamRadius = 2.6f;
            actor.detectRadius = 5.2f;
            WorldSliceFactory.Interact(go, id, name, "Aproximar", WorldInteractKind.Wild, body, temperament, 2.5f);
            return go;
        }

        static void InstallSystems(GameObject player, GameObject companion)
        {
            var cam = new GameObject("WorldCamera");
            var camera = cam.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.Skybox;
            camera.backgroundColor = new Color(0.32f, 0.46f, 0.38f);
            camera.fieldOfView = HavenSliceBuilder.CameraFov;
            camera.nearClipPlane = 0.15f;
            camera.farClipPlane = 160f;
            camera.tag = "MainCamera";
            cam.AddComponent<AudioListener>();
            var rig = cam.AddComponent<WorldCameraRig>();
            rig.target = player.transform;
            rig.pitch = HavenSliceBuilder.CameraPitch;
            rig.yaw = HavenSliceBuilder.CameraYaw;
            rig.distance = 19f;
            rig.lookHeight = 1.45f;
            rig.minDistance = 16f;
            rig.maxDistance = 26f;

            var systems = new GameObject("WorldSystems");
            var areas = systems.AddComponent<WorldAreaManager>();
            areas.areaId = WorldAreaId.VerdantisGreenRoad;
            areas.displayName = WorldAreaManager.Label(WorldAreaId.VerdantisGreenRoad);
            areas.Bind(player.transform, companion != null ? companion.transform : null, rig);
            systems.AddComponent<WorldInteractionSystem>();
            systems.AddComponent<WorldEncounterSystem>();
            systems.AddComponent<WorldTransitionSystem>();
            systems.AddComponent<WorldUIController>();
            systems.AddComponent<AmbientController>().Apply("verdantis");

            var bridge = systems.AddComponent<WorldBridge>();
            bridge.player = player.GetComponent<PlayerMotor>();
            bridge.companionRoot = companion != null ? companion.transform : null;
            bridge.cameraRig = rig;
        }

        static GameObject SpawnPlayer(Vector3 pos)
        {
            if (!CharacterAssets.PlayerCharacterReady())
            {
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
            var dna = CreaturePresets.EmberDna();
            dna.growthStage = CreatureGrowthStage.Baby;
            var go = CreatureAssembler.Spawn("Companion", owner.position + new Vector3(-1.3f, 0f, -1.1f), dna);
            if (go.GetComponent<CreatureMotor>() == null)
            {
                go.AddComponent<CreatureMotor>();
            }

            var follow = go.AddComponent<CreatureCompanionFollower>();
            follow.Bind(owner);
            follow.idleRadius = 1.45f;
            follow.followRadius = 1.75f;
            follow.sideOffset = 0.85f;
            return go;
        }
    }
}
