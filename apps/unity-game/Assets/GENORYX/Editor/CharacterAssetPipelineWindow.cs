#if UNITY_EDITOR
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Genoryx.Editor
{
    [InitializeOnLoad]
    public class CharacterAssetPipelineWindow : EditorWindow
    {
        string log = "FASE 1: um Tamer completo. Não gera o catálogo.";

        static CharacterAssetPipelineWindow()
        {
            EditorApplication.update += PumpPlayCapture;
            EditorApplication.playModeStateChanged += OnCapturePlayState;
        }

        [MenuItem("GENORYX/Character Asset Pipeline")]
        public static void Open()
        {
            GetWindow<CharacterAssetPipelineWindow>("Character Pipeline");
        }

        [MenuItem("GENORYX/Capture Character Creator")]
        public static void CaptureCreator()
        {
            Directory.CreateDirectory("Captures");
            File.WriteAllText("Captures/ENABLE", "1");
            const string path = "Assets/GENORYX/Scenes/CharacterCreation.unity";
            Directory.CreateDirectory("Assets/GENORYX/Scenes");
            if (!File.Exists(path))
            {
                var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                EditorSceneManager.SaveScene(scene, path);
            }

            EditorSceneManager.OpenScene(path);
            EditorPrefs.SetBool("genoryx.capture", true);
            EditorPrefs.SetInt("genoryx.capture.step", 0);
            EditorPrefs.SetInt("genoryx.capture.frames", 0);
            EditorApplication.isPlaying = true;
        }

        static void OnCapturePlayState(PlayModeStateChange change)
        {
            if (change == PlayModeStateChange.EnteredPlayMode && EditorPrefs.GetBool("genoryx.capture"))
            {
                CharacterCreationBuilder.Rebuild();
                EditorPrefs.SetInt("genoryx.capture.step", 0);
                EditorPrefs.SetInt("genoryx.capture.frames", 0);
            }
        }

        static void PumpPlayCapture()
        {
            if (!EditorPrefs.GetBool("genoryx.capture"))
            {
                return;
            }

            EditorApplication.QueuePlayerLoopUpdate();
            if (!EditorApplication.isPlaying)
            {
                return;
            }

            var assembler = Object.FindFirstObjectByType<CharacterAssembler>();
            if (assembler == null)
            {
                return;
            }

            var captureStep = EditorPrefs.GetInt("genoryx.capture.step");
            var captureFrames = EditorPrefs.GetInt("genoryx.capture.frames");
            if (captureStep == 0)
            {
                if (!assembler.ready)
                {
                    return;
                }

                AdvanceCapture(assembler, 1, () => assembler.SetHair("hair_01"));
                return;
            }

            captureFrames += 1;
            EditorPrefs.SetInt("genoryx.capture.frames", captureFrames);
            if (captureFrames < 50)
            {
                return;
            }

            var dest = Path.Combine("Captures", "modular-character-final");
            Directory.CreateDirectory(dest);
            switch (captureStep)
            {
                case 1:
                    WritePlayShot("02_hair_01");
                    AdvanceCapture(assembler, 2, () => assembler.SetHair("hair_02"));
                    break;
                case 2:
                    WritePlayShot("03_hair_02");
                    AdvanceCapture(assembler, 3, () => assembler.SetChest("chest_01"));
                    break;
                case 3:
                    WritePlayShot("04_chest_01");
                    AdvanceCapture(assembler, 4, () => assembler.SetChest("chest_02"));
                    break;
                case 4:
                    WritePlayShot("05_chest_02");
                    AdvanceCapture(assembler, 5, () => assembler.SetSkinTone("ivory"));
                    break;
                case 5:
                    WritePlayShot("10_skin_light");
                    AdvanceCapture(assembler, 6, () => assembler.SetSkinTone("ebony"));
                    break;
                case 6:
                    WritePlayShot("11_skin_dark");
                    if (assembler.previewPivot != null)
                    {
                        assembler.previewPivot.rotation = Quaternion.identity;
                    }

                    AdvanceCapture(assembler, 7, null);
                    break;
                case 7:
                    WritePlayShot("12_full_front");
                    if (assembler.previewPivot != null)
                    {
                        assembler.previewPivot.rotation = Quaternion.Euler(0f, 40f, 0f);
                    }

                    AdvanceCapture(assembler, 8, null);
                    break;
                case 8:
                    WritePlayShot("13_full_threequarter");
                    if (assembler.previewPivot != null)
                    {
                        assembler.previewPivot.rotation = Quaternion.Euler(0f, 180f, 0f);
                    }

                    AdvanceCapture(assembler, 9, null);
                    break;
                case 9:
                    WritePlayShot("15_full_back");
                    CharacterAppearanceStore.Save(assembler.appearance);
                    File.WriteAllText(Path.Combine(dest, "validation.txt"), CharacterCreatorValidation.Run(assembler));
                    File.WriteAllText("Captures/DONE", "ok");
                    EditorPrefs.DeleteKey("genoryx.capture");
                    EditorApplication.Exit(0);
                    break;
            }
        }

        static void AdvanceCapture(CharacterAssembler assembler, int next, System.Action apply)
        {
            apply?.Invoke();
            EditorPrefs.SetInt("genoryx.capture.step", next);
            EditorPrefs.SetInt("genoryx.capture.frames", 0);
            UnityEngine.Debug.Log("[GENORYX] Capture step " + next + " ready=" + assembler.ready);
        }

        static void WritePlayShot(string name)
        {
            var dest = Path.Combine("Captures", "modular-character-final");
            Directory.CreateDirectory(dest);
            var cam = Camera.main != null ? Camera.main : Object.FindFirstObjectByType<Camera>();
            if (cam == null)
            {
                File.WriteAllText(Path.Combine(dest, name + ".error.txt"), "Camera ausente");
                return;
            }

            var rt = new RenderTexture(1280, 720, 24);
            var prev = cam.targetTexture;
            cam.targetTexture = rt;
            cam.Render();
            RenderTexture.active = rt;
            var tex = new Texture2D(1280, 720, TextureFormat.RGB24, false);
            tex.ReadPixels(new Rect(0, 0, 1280, 720), 0, 0);
            tex.Apply();
            cam.targetTexture = prev;
            RenderTexture.active = null;
            File.WriteAllBytes(Path.Combine(dest, name + ".png"), tex.EncodeToPNG());
            Object.Destroy(tex);
            rt.Release();
            Object.Destroy(rt);
            UnityEngine.Debug.Log("[GENORYX] Shot " + name);
        }

        [MenuItem("GENORYX/Open Character Creation")]
        public static void OpenCreator()
        {
            const string path = "Assets/GENORYX/Scenes/CharacterCreation.unity";
            Directory.CreateDirectory("Assets/GENORYX/Scenes");
            if (!File.Exists(path))
            {
                var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                EditorSceneManager.SaveScene(scene, path);
            }

            EditorSceneManager.OpenScene(path);
            CharacterCreationBuilder.Rebuild();
            EditorSceneManager.MarkSceneDirty(EditorSceneManager.GetActiveScene());
            EditorSceneManager.SaveScene(EditorSceneManager.GetActiveScene(), path);
        }

        void OnGUI()
        {
            GUILayout.Label("GENORYX Character Asset Pipeline", EditorStyles.boldLabel);
            GUILayout.Label("Usa MESHY_API_KEY do environment. Nunca grava a chave no projeto.");
            if (GUILayout.Button("Generate Character (FASE 1)"))
            {
                RunCli("run character:phase1");
            }

            if (GUILayout.Button("Generate Modular Parts (2 hair / 2 chest / 2 legs / 2 boots)"))
            {
                RunCli("run character:parts");
            }

            if (GUILayout.Button("Download / Import / Validate"))
            {
                AssetDatabase.Refresh();
                ValidatePhase1();
            }

            GUILayout.TextArea(log, GUILayout.MinHeight(180));
        }

        void RunCli(string arguments)
        {
            var repo = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", ".."));
            var npm = Application.platform == RuntimePlatform.WindowsEditor ? "npm.cmd" : "npm";
            var start = new ProcessStartInfo
            {
                FileName = npm,
                Arguments = arguments,
                WorkingDirectory = repo,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };
            var process = Process.Start(start);
            if (process == null)
            {
                log = "Não foi possível iniciar npm run character:phase1";
                return;
            }

            log = process.StandardOutput.ReadToEnd() + process.StandardError.ReadToEnd();
            process.WaitForExit();
            AssetDatabase.Refresh();
            ValidatePhase1();
        }

        void ValidatePhase1()
        {
            var glb = Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "phase1", "tamer.rigged.glb");
            var walk = Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "phase1", "anim.walk.glb");
            var run = Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "phase1", "anim.run.glb");
            log += "\nrigged=" + File.Exists(glb);
            log += "\nwalk=" + File.Exists(walk);
            log += "\nrun=" + File.Exists(run);
            if (File.Exists(glb))
            {
                log += "\nHumanoid: importe o FBX/GLB em Assets/GENORYX/Characters/Phase1 e marque Avatar=Humanoid.";
            }
            else
            {
                log += "\nAUSENTE. Sem substituir por cápsula. Corrija a Meshy e rode de novo.";
            }
        }
    }
}
#endif
