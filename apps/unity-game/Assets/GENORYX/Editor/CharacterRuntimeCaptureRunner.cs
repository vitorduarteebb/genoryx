#if UNITY_EDITOR
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Genoryx.Editor
{
    public static class CharacterRuntimeCaptureRunner
    {
        [MenuItem("GENORYX/Capture Runtime Final")]
        public static void Run()
        {
            Directory.CreateDirectory("Captures/character-runtime-final");
            File.WriteAllText("Captures/ENABLE_RUNTIME", "1");
            EditorPrefs.SetBool("genoryx.runtimeCapture", true);
            EditorPrefs.DeleteKey("genoryx.capture");
            const string creator = "Assets/GENORYX/Scenes/CharacterCreation.unity";
            const string haven = "Assets/GENORYX/Scenes/HavenSlice.unity";
            Directory.CreateDirectory("Assets/GENORYX/Scenes");
            if (!File.Exists(creator))
            {
                var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                EditorSceneManager.SaveScene(scene, creator);
            }

            EnsureBuildScene(creator);
            if (File.Exists(haven))
            {
                EnsureBuildScene(haven);
            }

            EditorSceneManager.OpenScene(creator);
            EditorApplication.isPlaying = true;
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
