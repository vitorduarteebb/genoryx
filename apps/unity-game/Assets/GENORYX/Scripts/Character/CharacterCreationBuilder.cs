using System.IO;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Genoryx
{
    public static class CharacterCreationBuilder
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void RebuildOnPlay()
        {
            if (!Application.isPlaying)
            {
                return;
            }

            var scene = SceneManager.GetActiveScene();
            var capture = File.Exists(Path.Combine(Application.dataPath, "..", "Captures", "ENABLE"));
            foreach (var arg in System.Environment.GetCommandLineArgs())
            {
                if (arg == "-genoryxCapture")
                {
                    capture = true;
                }
            }

            var creatorScene = scene.name == "CharacterCreation" || (scene.path != null && scene.path.Contains("CharacterCreation"));
            if (!creatorScene)
            {
                return;
            }

            Rebuild();
        }

        public static GameObject Rebuild()
        {
            foreach (var root in SceneManager.GetActiveScene().GetRootGameObjects())
            {
                Object.DestroyImmediate(root);
            }

            var creation = new GameObject("CharacterCreationRoot");
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.55f, 0.6f, 0.68f);
            RenderSettings.ambientEquatorColor = new Color(0.4f, 0.38f, 0.34f);
            RenderSettings.ambientGroundColor = new Color(0.16f, 0.16f, 0.14f);

            var lights = new GameObject("CharacterPreviewLights");
            lights.transform.SetParent(creation.transform, false);
            var key = new GameObject("KeyLight").AddComponent<Light>();
            key.transform.SetParent(lights.transform, false);
            key.type = LightType.Directional;
            key.color = new Color(1f, 0.94f, 0.84f);
            key.intensity = 1.4f;
            key.shadows = LightShadows.Soft;
            key.transform.rotation = Quaternion.Euler(28f, -24f, 0f);
            var fill = new GameObject("FillLight").AddComponent<Light>();
            fill.transform.SetParent(lights.transform, false);
            fill.type = LightType.Directional;
            fill.color = new Color(0.45f, 0.58f, 0.7f);
            fill.intensity = 0.38f;
            fill.transform.rotation = Quaternion.Euler(16f, 140f, 0f);

            var platform = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            platform.name = "CharacterPreviewPlatform";
            platform.transform.SetParent(creation.transform, false);
            platform.transform.position = new Vector3(0f, 0.06f, 0f);
            platform.transform.localScale = new Vector3(3.4f, 0.06f, 3.4f);
            SliceMaterials.Paint(platform, new Color(0.18f, 0.18f, 0.2f), 0.42f);

            var tamer = CharacterAssembler.SpawnPlayer("CharacterRoot", Vector3.zero, CharacterAppearanceStore.Load());
            tamer.transform.SetParent(creation.transform, true);

            var camGo = new GameObject("MainCamera");
            var camera = camGo.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.08f, 0.09f, 0.12f);
            camera.fieldOfView = 28f;
            camera.tag = "MainCamera";
            camGo.AddComponent<AudioListener>();
            var orbit = camGo.AddComponent<CreatorOrbit>();
            var assembler = tamer.GetComponent<CharacterAssembler>();
            orbit.pivot = assembler != null ? assembler.previewPivot : tamer.transform;

            var ui = new GameObject("UIRoot");
            var hud = ui.AddComponent<CharacterCreatorHud>();
            hud.assembler = assembler;
            hud.orbit = orbit;
            var capture = creation.AddComponent<CharacterCreatorCapture>();
            capture.assembler = assembler;
            var runner = new GameObject("GENORYX_RuntimeCapture");
            Object.DontDestroyOnLoad(runner);
            if (CharacterAcceptedCapture.Enabled())
            {
                var accepted = runner.AddComponent<CharacterAcceptedCapture>();
                accepted.assembler = assembler;
            }
            else
            {
                var runtime = runner.AddComponent<CharacterRuntimeCapture>();
                runtime.assembler = assembler;
            }
            return tamer;
        }
    }

    public class CreatorOrbit : MonoBehaviour
    {
        public Transform pivot;
        public float distance = 4.4f;
        public float yaw = 180f;
        public float pitch = 8f;
        public float lookHeight = 0.95f;
        bool dragging;

        public void Frame(string category)
        {
            var head = category == "FACE" || category == "HAIR" || category == "EYES" || category == "HAIR_COLOR";
            var chest = category == "CHEST";
            var legs = category == "LEGS" || category == "BOOTS";
            lookHeight = head ? 1.58f : chest ? 1.22f : legs ? 0.55f : 0.95f;
            distance = head ? 1.65f : chest ? 2.7f : legs ? 3.7f : 4.4f;
            pitch = head ? 8f : chest ? 6f : legs ? 4f : 8f;
            yaw = 180f;
        }

        void Update()
        {
            if (Input.GetMouseButtonDown(0) && Input.mousePosition.x > Screen.width * 0.28f && Input.mousePosition.x < Screen.width * 0.72f)
            {
                dragging = true;
            }

            if (Input.GetMouseButtonUp(0))
            {
                dragging = false;
            }

            if (dragging && pivot != null)
            {
                pivot.Rotate(Vector3.up, -Input.GetAxis("Mouse X") * 140f * Time.deltaTime, Space.World);
            }

            distance = Mathf.Clamp(distance - Input.mouseScrollDelta.y * 0.35f, 2.2f, 6.4f);
            if (Input.GetKeyDown(KeyCode.R))
            {
                yaw = 28f;
                pitch = 10f;
                distance = 4.2f;
                lookHeight = 0.95f;
                if (pivot != null)
                {
                    pivot.rotation = Quaternion.identity;
                }
            }

            var look = pivot != null ? pivot.position + Vector3.up * lookHeight : Vector3.up;
            var rot = Quaternion.Euler(pitch, yaw, 0f);
            transform.position = look + rot * new Vector3(0f, 0f, -distance);
            transform.LookAt(look);
        }
    }

    public class CharacterCreatorHud : MonoBehaviour
    {
        public CharacterAssembler assembler;
        public CreatorOrbit orbit;
        string category = "HAIR";

        static readonly string[] Categories = { "BODY", "FACE", "SKIN", "HAIR", "HAIR_COLOR", "EYES", "CHEST", "LEGS", "BOOTS" };

        void OnGUI()
        {
            if (assembler == null)
            {
                return;
            }

            GUILayout.BeginArea(new Rect(18f, 18f, 250f, Screen.height - 36f), GUI.skin.box);
            GUILayout.Label("GENORYX · Criar Tamer");
            GUILayout.Label("Modelo 3D real · mesmo assembler da Haven");
            foreach (var row in Categories)
            {
                if (GUILayout.Button(row == category ? "▸ " + row : row))
                {
                    category = row;
                    if (orbit != null)
                    {
                        orbit.Frame(row);
                    }
                }
            }

            GUILayout.Space(12);
            if (GUILayout.Button("Randomizar"))
            {
                assembler.Randomize();
            }

            if (GUILayout.Button(assembler.debugModularParts ? "Hide Modular Debug" : "Character Debug > Modular Parts"))
            {
                assembler.debugModularParts = !assembler.debugModularParts;
                assembler.ApplyAppearance(assembler.appearance);
            }

            if (GUILayout.Button(assembler.debugBodyRegions ? "Hide Body Regions" : "Show Body Regions"))
            {
                assembler.debugBodyRegions = !assembler.debugBodyRegions;
                assembler.ApplyAppearance(assembler.appearance);
            }

            if (GUILayout.Button("Resetar câmera") && orbit != null)
            {
                orbit.Frame("BODY");
                if (orbit.pivot != null)
                {
                    orbit.pivot.rotation = Quaternion.identity;
                }
            }

            GUILayout.EndArea();

            GUILayout.BeginArea(new Rect(Screen.width - 268f, 18f, 250f, Screen.height - 36f), GUI.skin.box);
            GUILayout.Label(category);
            DrawOptions();
            GUILayout.FlexibleSpace();
            if (GUILayout.Button("CONFIRMAR TAMER", GUILayout.Height(40)))
            {
                CharacterAppearanceStore.Save(assembler.appearance);
            }

            GUILayout.EndArea();
        }

        void DrawOptions()
        {
            switch (category)
            {
                case "BODY":
                    Choice(assembler.appearance.bodyType, new[] { "canonical_body" }, assembler.SetBody);
                    break;
                case "FACE":
                    Choice(assembler.appearance.faceId, new[] { "face_01", "face_02", "face_03" }, assembler.SetFace);
                    break;
                case "SKIN":
                    Choice(assembler.appearance.skinTone, new[] { "ivory", "sand", "tan", "amber", "bronze", "umber", "ebony" }, assembler.SetSkinTone);
                    break;
                case "HAIR":
                    Choice(assembler.appearance.hairId, new[] { "hair_01", "hair_02" }, assembler.SetHair);
                    break;
                case "HAIR_COLOR":
                    Choice(assembler.appearance.hairColor, new[] { "black", "dark_brown", "brown", "blonde", "red", "white", "blue_black" }, assembler.SetHairColor);
                    break;
                case "EYES":
                    Choice(assembler.appearance.eyeColor, new[] { "brown", "blue", "green", "amber", "gray", "violet", "teal" }, assembler.SetEyeColor);
                    break;
                case "CHEST":
                    Choice(assembler.appearance.chestId, new[] { "chest_01", "chest_02" }, assembler.SetChest);
                    break;
                case "LEGS":
                    Choice(assembler.appearance.legsId, new[] { "pants_01", "pants_02" }, assembler.SetLegs);
                    break;
                case "BOOTS":
                    Choice(assembler.appearance.bootsId, new[] { "boots_01", "boots_02" }, assembler.SetBoots);
                    break;
            }
        }

        static void Choice(string current, string[] options, System.Action<string> apply)
        {
            foreach (var option in options)
            {
                var label = option.Replace("_", " ");
                if (GUILayout.Button(current == option ? "● " + label : label))
                {
                    apply(option);
                }
            }
        }
    }
}
