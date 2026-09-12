#if UNITY_EDITOR
using System.IO;
using Genoryx;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Genoryx.Editor
{
    [InitializeOnLoad]
    public static class GenoryxSceneBootstrap
    {
        const string StatusPath = "Temp/genoryx-slice-status.txt";

        static GenoryxSceneBootstrap()
        {
        }

        static void AutoBuildEmptySlice()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
            {
                return;
            }

            if (GameObject.Find("GenesisCore") != null)
            {
                WriteStatus("skip: GenesisCore already in scene");
                return;
            }

            try
            {
                const string slicePath = "Assets/GENORYX/Scenes/HavenSlice.unity";
                HavenSliceBuilder.Build();
                var scene = EditorSceneManager.GetActiveScene();
                EditorSceneManager.MarkSceneDirty(scene);
                Directory.CreateDirectory("Assets/GENORYX/Scenes");
                EditorSceneManager.SaveScene(scene, slicePath);
                AssetDatabase.SaveAssets();
                WriteStatus("ok: slice built and saved");
            }
            catch (System.Exception ex)
            {
                WriteStatus("error: " + ex);
                Debug.LogError("[GENORYX] Falha ao gerar slice: " + ex);
            }
        }

        [MenuItem("GENORYX/Rebuild Visual Slice _F8")]
        public static void BootstrapSlice()
        {
            HavenSliceBuilder.Rebuild();
            var scene = EditorSceneManager.GetActiveScene();
            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene, "Assets/GENORYX/Scenes/HavenSlice.unity");
            AssetDatabase.SaveAssets();
            WriteStatus("ok: menu F8 rebuilt slice");
        }

        [MenuItem("GENORYX/Bootstrap DEV_WORLD Scenes")]
        public static void Bootstrap()
        {
            BuildWorld("Haven", new Color(0.18f, 0.22f, 0.26f), new[]
            {
                "Kael Quest Hub", "Lyra Genesis Lab", "Theo Shop", "Orin Forge", "Arena Gate", "Genesis Chamber"
            });
            BuildWorld("Verdantis", new Color(0.12f, 0.22f, 0.14f), new[]
            {
                "Haven Gate", "Forest Path", "Crystal Clearing", "Ancient Ruin", "River", "Terranox Territory", "Elite Clearing", "Next Biome"
            });
            BuildBattle();
            AssetDatabase.SaveAssets();
        }

        static void WriteStatus(string message)
        {
            try
            {
                Directory.CreateDirectory("Temp");
                File.WriteAllText(StatusPath, System.DateTime.Now.ToString("o") + "\n" + message + "\n");
            }
            catch
            {
                // ignore
            }

            Debug.Log("[GENORYX] " + message);
        }

        static void BuildWorld(string name, Color ground, string[] landmarks)
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.55f, 0.7f, 0.72f);
            RenderSettings.fogDensity = 0.012f;
            var light = new GameObject("KeyLight");
            var sun = light.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = new Color(1f, 0.92f, 0.78f);
            sun.intensity = 1.15f;
            light.transform.rotation = Quaternion.Euler(42f, -30f, 0f);

            var floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
            floor.name = "Ground";
            floor.transform.localScale = new Vector3(8f, 1f, 8f);
            var renderer = floor.GetComponent<Renderer>();
            renderer.sharedMaterial = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"))
            {
                color = ground
            };

            var player = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            player.name = "Player";
            player.AddComponent<PlayerMotor>();
            var companion = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            companion.name = "Companion";
            companion.transform.localScale = Vector3.one * 1.4f;
            var follow = companion.AddComponent<CompanionFollower>();
            follow.owner = player.transform;

            var cam = new GameObject("WorldCamera");
            cam.AddComponent<Camera>();
            var rig = cam.AddComponent<WorldCameraRig>();
            rig.target = player.transform;
            var bridge = new GameObject("WorldBridge").AddComponent<WorldBridge>();
            bridge.player = player.GetComponent<PlayerMotor>();
            bridge.companion = follow;
            bridge.cameraRig = rig;
            new GameObject("WorldHud").AddComponent<WorldHud>();

            for (var i = 0; i < landmarks.Length; i++)
            {
                var mark = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                mark.name = landmarks[i];
                mark.transform.position = new Vector3((i % 4) * 8f - 12f, 1.2f, (i / 4) * 10f - 6f);
                mark.transform.localScale = new Vector3(1.4f, 1.6f, 1.4f);
            }

            if (name == "Verdantis")
            {
                for (var i = 0; i < 6; i++)
                {
                    var mob = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    mob.name = i == 4 ? "Terranox Elite" : "Wild";
                    mob.transform.position = new Vector3(-6f + i * 3.2f, 0.7f, 8f);
                    var actor = mob.AddComponent<MobActor>();
                    actor.speciesKey = i >= 3 ? "terranox" : "florune";
                    actor.family = i == 4 ? MobFamily.ELITE : MobFamily.COMMON;
                    actor.aggro = i == 4 ? MobAggro.AGGRESSIVE : MobAggro.PASSIVE;
                    actor.spawnKey = $"bootstrap_{i}";
                }
            }

            EditorSceneManager.SaveScene(scene, $"Assets/GENORYX/Scenes/{name}.unity");
        }

        static void BuildBattle()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var light = new GameObject("BattleKey");
            var sun = light.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.intensity = 1.3f;
            light.transform.rotation = Quaternion.Euler(28f, 40f, 0f);
            var fill = new GameObject("Fill").AddComponent<Light>();
            fill.type = LightType.Directional;
            fill.intensity = 0.35f;
            fill.transform.rotation = Quaternion.Euler(20f, -80f, 0f);

            var floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
            floor.transform.localScale = new Vector3(3.2f, 1f, 3.6f);
            var root = new GameObject("Formation");
            FormationLayout.ApplyDefault(root.transform);
            new GameObject("BattleBridge").AddComponent<BattleBridge>();
            new GameObject("BattleCamera").AddComponent<BattleCameraDirector>();
            EditorSceneManager.SaveScene(scene, "Assets/GENORYX/Scenes/BattleArena.unity");
        }
    }
}
#endif
