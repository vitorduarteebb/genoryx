#if UNITY_EDITOR
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Genoryx.Editor
{
    /// <summary>
    /// Entradas de batchmode do sistema de criaturas.
    ///
    ///   Unity -batchmode -quit  -projectPath . -executeMethod Genoryx.Editor.GenoryxCreatureRunner.BuildSystem
    ///   Unity -batchmode        -projectPath . -executeMethod Genoryx.Editor.GenoryxCreatureRunner.RunCaptures
    ///
    /// RunCaptures nao usa -quit: precisa do editor vivo para entrar em play mode.
    /// O proprio watcher encerra o processo quando o marcador CREATURES_DONE aparece.
    /// </summary>
    public static class GenoryxCreatureRunner
    {
        const string Scene = "Assets/GENORYX/Scenes/CreatureAssemblyTest.unity";
        const double TimeoutSeconds = 1200;

        // Ancorado em Application.dataPath: o CWD do batchmode nao e o projeto.
        static string CapturesRoot => Path.GetFullPath(Path.Combine(Application.dataPath, "../Captures"));
        static string DoneMarker => Path.Combine(CapturesRoot, "CREATURES_DONE");
        static string EnableMarker => Path.Combine(CapturesRoot, "ENABLE_CREATURES");

        static double startedAt;
        static bool watching;
        static bool playRequested;

        [MenuItem("GENORYX/Creatures/1 — Build System V1")]
        public static void BuildSystem()
        {
            GenoryxCreatureSystemBuilder.BuildAll();
            Debug.Log("[GENORYX] build do sistema de criaturas concluido");
        }

        [MenuItem("GENORYX/Creatures/2 — Run Captures + Tests")]
        public static void RunCaptures()
        {
            Directory.CreateDirectory(Path.Combine(CapturesRoot, "creature-system-v1"));
            if (File.Exists(DoneMarker))
            {
                File.Delete(DoneMarker);
            }

            File.WriteAllText(EnableMarker, "1");

            if (AssetDatabase.LoadAssetAtPath<SceneAsset>(Scene) == null)
            {
                GenoryxCreatureSystemBuilder.BuildAll();
            }

            EnsureBuildScene(Scene);
            EditorSceneManager.OpenScene(Scene);

            // Sem isto o reload de dominio ao entrar em play mode zera os estaticos
            // e o watcher perde a inscricao em EditorApplication.update: o batchmode
            // ficaria vivo para sempre sem nunca encerrar.
            EditorSettings.enterPlayModeOptionsEnabled = true;
            EditorSettings.enterPlayModeOptions =
                EnterPlayModeOptions.DisableDomainReload | EnterPlayModeOptions.DisableSceneReload;

            startedAt = EditorApplication.timeSinceStartup;
            playRequested = false;
            if (!watching)
            {
                watching = true;
                EditorApplication.update += Watch;
            }

            Debug.Log("[GENORYX] RunCaptures armado; aguardando play mode");
        }

        static void Watch()
        {
            // Entrar em play mode direto do executeMethod e instavel em batchmode.
            // Pedimos no primeiro tick do loop do editor, com o dominio ja estavel.
            if (!playRequested)
            {
                playRequested = true;
                EditorApplication.EnterPlaymode();
                Debug.Log("[GENORYX] EnterPlaymode solicitado");
                return;
            }

            var elapsed = EditorApplication.timeSinceStartup - startedAt;
            var done = File.Exists(DoneMarker);
            var timedOut = elapsed > TimeoutSeconds;

            if (!done && !timedOut)
            {
                return;
            }

            EditorApplication.update -= Watch;
            watching = false;
            EditorApplication.isPlaying = false;

            if (File.Exists(EnableMarker))
            {
                File.Delete(EnableMarker);
            }

            Debug.Log(done
                ? "[GENORYX] capturas de criatura concluidas em " + elapsed.ToString("F1") + "s"
                : "[GENORYX] TIMEOUT nas capturas de criatura apos " + elapsed.ToString("F1") + "s");

            if (Application.isBatchMode)
            {
                EditorApplication.Exit(done ? 0 : 2);
            }
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
