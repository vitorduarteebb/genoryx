#if UNITY_EDITOR
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.Animations;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Genoryx.Editor
{
    public static class GenoryxUnityReadyPipeline
    {
        const string Root = "Assets/GENORYX/Characters/UnityReady";
        const string BodyFbx = Root + "/Bodies/GenoryxCanonicalBody.fbx";
        const string IdleFbx = Root + "/Animations/Idle.fbx";
        const string WalkFbx = Root + "/Animations/Walk.fbx";
        const string RunFbx = Root + "/Animations/Run.fbx";
        const string ControllerPath = Root + "/GenoryxHumanoidAnimator.controller";
        const string LibraryPath = Root + "/Resources/CharacterPartLibrary.asset";

        static readonly Dictionary<string, string> HumanMap = new()
        {
            { "Hips", "Hips" },
            { "Spine", "Spine" },
            { "Spine1", "Chest" },
            { "Spine2", "UpperChest" },
            { "Neck", "Neck" },
            { "Head", "Head" },
            { "LeftShoulder", "LeftShoulder" },
            { "RightShoulder", "RightShoulder" },
            { "LeftArm", "LeftUpperArm" },
            { "RightArm", "RightUpperArm" },
            { "LeftForeArm", "LeftLowerArm" },
            { "RightForeArm", "RightLowerArm" },
            { "LeftHand", "LeftHand" },
            { "RightHand", "RightHand" },
            { "LeftUpLeg", "LeftUpperLeg" },
            { "RightUpLeg", "RightUpperLeg" },
            { "LeftLeg", "LeftLowerLeg" },
            { "RightLeg", "RightLowerLeg" },
            { "LeftFoot", "LeftFoot" },
            { "RightFoot", "RightFoot" },
            { "LeftToeBase", "LeftToes" },
            { "RightToeBase", "RightToes" }
        };

        [MenuItem("GENORYX/Build UnityReady Characters")]
        public static void Build()
        {
            EnsureFolders();
            ConfigureHumanoid(BodyFbx, null);
            var avatar = FindAvatar(BodyFbx);
            ConfigureHumanoid(IdleFbx, avatar);
            ConfigureHumanoid(WalkFbx, avatar);
            ConfigureHumanoid(RunFbx, avatar);
            foreach (var part in PartFbxs())
            {
                ConfigurePart(part);
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            avatar = GenoryxHumanoidAvatarBuilder.Ensure(BodyFbx, Root + "/Bodies/GenoryxCanonicalAvatar.asset");
            if (avatar != null && (!avatar.isHuman || !avatar.isValid))
            {
                Debug.LogWarning("[GENORYX] Avatar auto-map falhou, tentando HumanDescription explícito.");
                avatar = GenoryxHumanoidAvatarBuilder.Ensure(BodyFbx, Root + "/Bodies/GenoryxCanonicalAvatar.asset");
            }

            ConfigureHumanoid(IdleFbx, avatar);
            ConfigureHumanoid(WalkFbx, avatar);
            ConfigureHumanoid(RunFbx, avatar);
            CreateController(avatar);
            CreatePrefabsAndLibrary(avatar);
            Debug.Log("[GENORYX] UnityReady build avatar=" + (avatar != null) + " human=" + (avatar != null && avatar.isHuman) + " valid=" + (avatar != null && avatar.isValid));
        }

        [MenuItem("GENORYX/Capture Accepted Play Only")]
        public static void CaptureAcceptedPlayOnly()
        {
            Directory.CreateDirectory("Captures/character-accepted");
            File.WriteAllText("Captures/ENABLE_ACCEPTED", "1");
            EditorPrefs.SetBool("genoryx.acceptedCapture", true);
            const string creator = "Assets/GENORYX/Scenes/CharacterCreation.unity";
            const string haven = "Assets/GENORYX/Scenes/HavenSlice.unity";
            EnsureBuildScene(creator);
            if (File.Exists(haven))
            {
                EnsureBuildScene(haven);
            }

            EditorSceneManager.OpenScene(creator);
            EditorApplication.isPlaying = true;
        }

        [MenuItem("GENORYX/Capture Accepted")]
        public static void CaptureAccepted()
        {
            Build();
            CaptureAcceptedPlayOnly();
        }

        static void EnsureFolders()
        {
            CreateFolder("Assets/GENORYX", "Characters");
            CreateFolder(Root.Replace("/UnityReady", ""), "UnityReady");
            CreateFolder(Root, "Bodies");
            CreateFolder(Root, "Animations");
            CreateFolder(Root, "Hair");
            CreateFolder(Root, "Chest");
            CreateFolder(Root, "Legs");
            CreateFolder(Root, "Boots");
            CreateFolder(Root, "Prefabs");
            CreateFolder(Root, "Resources");
        }

        static void CreateFolder(string parent, string name)
        {
            var path = parent + "/" + name;
            if (!AssetDatabase.IsValidFolder(path))
            {
                AssetDatabase.CreateFolder(parent, name);
            }
        }

        static IEnumerable<string> PartFbxs()
        {
            yield return Root + "/Hair/Hair_01.fbx";
            yield return Root + "/Hair/Hair_02.fbx";
            yield return Root + "/Chest/Chest_01.fbx";
            yield return Root + "/Chest/Chest_02.fbx";
            yield return Root + "/Legs/Pants_01.fbx";
            yield return Root + "/Legs/Pants_02.fbx";
            yield return Root + "/Boots/Boots_01.fbx";
            yield return Root + "/Boots/Boots_02.fbx";
        }

        static void ConfigureHumanoid(string path, Avatar copy)
        {
            var importer = AssetImporter.GetAtPath(path) as ModelImporter;
            if (importer == null)
            {
                Debug.LogWarning("[GENORYX] FBX ausente: " + path);
                return;
            }

            importer.animationType = ModelImporterAnimationType.Human;
            importer.avatarSetup = copy == null ? ModelImporterAvatarSetup.CreateFromThisModel : ModelImporterAvatarSetup.CopyFromOther;
            if (copy != null)
            {
                importer.sourceAvatar = copy;
            }

            importer.optimizeGameObjects = false;
            importer.animationCompression = ModelImporterAnimationCompression.Optimal;
            importer.resampleCurves = true;
            importer.importAnimation = path.Contains("/Animations/");
            importer.materialImportMode = ModelImporterMaterialImportMode.ImportViaMaterialDescription;
            if (importer.importAnimation)
            {
                var clips = importer.defaultClipAnimations;
                if (clips != null && clips.Length > 0)
                {
                    for (var i = 0; i < clips.Length; i++)
                    {
                        clips[i].loopTime = true;
                        clips[i].lockRootRotation = true;
                        clips[i].lockRootHeightY = true;
                        clips[i].lockRootPositionXZ = true;
                        clips[i].keepOriginalOrientation = true;
                        clips[i].keepOriginalPositionY = true;
                        clips[i].keepOriginalPositionXZ = true;
                    }

                    importer.clipAnimations = clips;
                }
            }

            importer.SaveAndReimport();
        }

        static void ConfigurePart(string path)
        {
            var importer = AssetImporter.GetAtPath(path) as ModelImporter;
            if (importer == null)
            {
                Debug.LogWarning("[GENORYX] FBX ausente: " + path);
                return;
            }

            importer.animationType = ModelImporterAnimationType.Generic;
            importer.avatarSetup = ModelImporterAvatarSetup.NoAvatar;
            importer.importAnimation = false;
            importer.optimizeGameObjects = false;
            importer.materialImportMode = ModelImporterMaterialImportMode.ImportViaMaterialDescription;
            importer.SaveAndReimport();
        }

        static Avatar FindAvatar(string fbx)
        {
            foreach (var asset in AssetDatabase.LoadAllAssetsAtPath(fbx))
            {
                if (asset is Avatar avatar)
                {
                    return avatar;
                }
            }

            return null;
        }

        static void CreateController(Avatar avatar)
        {
            if (AssetDatabase.LoadAssetAtPath<RuntimeAnimatorController>(ControllerPath) != null)
            {
                AssetDatabase.DeleteAsset(ControllerPath);
            }

            var idle = FirstClip(IdleFbx);
            var walk = FirstClip(WalkFbx);
            var run = FirstClip(RunFbx);
            var controller = AnimatorController.CreateAnimatorControllerAtPath(ControllerPath);
            controller.AddParameter("Speed", AnimatorControllerParameterType.Float);
            var root = controller.layers[0].stateMachine;
            var locomotion = root.AddState("Locomotion");
            var tree = new BlendTree
            {
                name = "LocomotionTree",
                blendType = BlendTreeType.Simple1D,
                blendParameter = "Speed",
                useAutomaticThresholds = false
            };
            AssetDatabase.AddObjectToAsset(tree, controller);
            if (idle != null)
            {
                tree.AddChild(idle, 0f);
            }

            if (walk != null)
            {
                tree.AddChild(walk, 0.5f);
            }

            if (run != null)
            {
                tree.AddChild(run, 1f);
            }

            locomotion.motion = tree;
            root.defaultState = locomotion;
            EditorUtility.SetDirty(controller);
            AssetDatabase.SaveAssets();
        }

        static AnimationClip FirstClip(string fbx)
        {
            foreach (var asset in AssetDatabase.LoadAllAssetsAtPath(fbx))
            {
                if (asset is AnimationClip clip && !clip.name.StartsWith("__preview__"))
                {
                    return clip;
                }
            }

            return null;
        }

        static void CreatePrefabsAndLibrary(Avatar avatar)
        {
            var body = PrefabFromFbx(BodyFbx, Root + "/Prefabs/CanonicalBody.prefab", true);
            var hair1 = PrefabFromFbx(Root + "/Hair/Hair_01.fbx", Root + "/Prefabs/Hair_01.prefab", false);
            var hair2 = PrefabFromFbx(Root + "/Hair/Hair_02.fbx", Root + "/Prefabs/Hair_02.prefab", false);
            var chest1 = PrefabFromFbx(Root + "/Chest/Chest_01.fbx", Root + "/Prefabs/Chest_01.prefab", false);
            var chest2 = PrefabFromFbx(Root + "/Chest/Chest_02.fbx", Root + "/Prefabs/Chest_02.prefab", false);
            var pants1 = PrefabFromFbx(Root + "/Legs/Pants_01.fbx", Root + "/Prefabs/Pants_01.prefab", false);
            var pants2 = PrefabFromFbx(Root + "/Legs/Pants_02.fbx", Root + "/Prefabs/Pants_02.prefab", false);
            var boots1 = PrefabFromFbx(Root + "/Boots/Boots_01.fbx", Root + "/Prefabs/Boots_01.prefab", false);
            var boots2 = PrefabFromFbx(Root + "/Boots/Boots_02.fbx", Root + "/Prefabs/Boots_02.prefab", false);
            var controller = AssetDatabase.LoadAssetAtPath<RuntimeAnimatorController>(ControllerPath);

            var lib = AssetDatabase.LoadAssetAtPath<CharacterPartLibrary>(LibraryPath);
            if (lib == null)
            {
                lib = ScriptableObject.CreateInstance<CharacterPartLibrary>();
                AssetDatabase.CreateAsset(lib, LibraryPath);
            }

            lib.bodyPrefab = body;
            lib.canonicalAvatar = avatar;
            lib.animator = controller;
            lib.hair01 = hair1;
            lib.hair02 = hair2;
            lib.chest01 = chest1;
            lib.chest02 = chest2;
            lib.pants01 = pants1;
            lib.pants02 = pants2;
            lib.boots01 = boots1;
            lib.boots02 = boots2;
            lib.debugBody = DebugMat("DebugBody", Color.gray);
            lib.debugHair = DebugMat("DebugHair", Color.blue);
            lib.debugChest = DebugMat("DebugChest", Color.red);
            lib.debugPants = DebugMat("DebugPants", Color.green);
            lib.debugBoots = DebugMat("DebugBoots", Color.yellow);
            EditorUtility.SetDirty(lib);
            AssetDatabase.SaveAssets();
            if (body != null)
            {
                var contents = PrefabUtility.LoadPrefabContents(Root + "/Prefabs/CanonicalBody.prefab");
                var bodyAnimator = contents.GetComponentInChildren<Animator>(true);
                if (bodyAnimator != null)
                {
                    bodyAnimator.avatar = avatar;
                    bodyAnimator.runtimeAnimatorController = controller;
                    bodyAnimator.applyRootMotion = false;
                    bodyAnimator.cullingMode = AnimatorCullingMode.AlwaysAnimate;
                }

                PrefabUtility.SaveAsPrefabAsset(contents, Root + "/Prefabs/CanonicalBody.prefab");
                PrefabUtility.UnloadPrefabContents(contents);
            }
        }

        static Material DebugMat(string name, Color color)
        {
            var path = Root + "/Prefabs/" + name + ".mat";
            var mat = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (mat == null)
            {
                var shader = Shader.Find("Universal Render Pipeline/Unlit") ?? Shader.Find("Unlit/Color");
                mat = new Material(shader) { name = name, color = color };
                AssetDatabase.CreateAsset(mat, path);
            }

            mat.color = color;
            return mat;
        }

        static GameObject PrefabFromFbx(string fbx, string prefabPath, bool keepAnimator)
        {
            var model = AssetDatabase.LoadAssetAtPath<GameObject>(fbx);
            if (model == null)
            {
                return null;
            }

            var instance = (GameObject)PrefabUtility.InstantiatePrefab(model);
            instance.name = Path.GetFileNameWithoutExtension(prefabPath);
            if (!keepAnimator)
            {
                foreach (var animator in instance.GetComponentsInChildren<Animator>(true))
                {
                    Object.DestroyImmediate(animator);
                }
            }
            else
            {
                var animator = instance.GetComponentInChildren<Animator>(true);
                if (animator != null)
                {
                    animator.applyRootMotion = false;
                    animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;
                }
            }

            foreach (var col in instance.GetComponentsInChildren<Collider>(true))
            {
                Object.DestroyImmediate(col);
            }

            foreach (var skin in instance.GetComponentsInChildren<SkinnedMeshRenderer>(true))
            {
                skin.updateWhenOffscreen = true;
                skin.localBounds = new Bounds(Vector3.up, Vector3.one * 2.4f);
            }

            var prefab = PrefabUtility.SaveAsPrefabAsset(instance, prefabPath);
            Object.DestroyImmediate(instance);
            return prefab;
        }

        static void EnsureBuildScene(string path)
        {
            var scenes = new List<EditorBuildSettingsScene>(EditorBuildSettings.scenes);
            for (var i = 0; i < scenes.Count; i++)
            {
                if (scenes[i].path == path)
                {
                    scenes[i] = new EditorBuildSettingsScene(path, true);
                    EditorBuildSettings.scenes = scenes.ToArray();
                    return;
                }
            }

            scenes.Add(new EditorBuildSettingsScene(path, true));
            EditorBuildSettings.scenes = scenes.ToArray();
        }
    }
}
#endif
