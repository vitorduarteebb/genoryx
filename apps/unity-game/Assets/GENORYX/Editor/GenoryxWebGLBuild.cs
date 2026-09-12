#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

#pragma warning disable CS0618 // SetIl2CppCompilerConfiguration(BuildTargetGroup) segue valido nesta versao

namespace Genoryx.Editor
{
    /// <summary>
    /// Build WebGL do cliente, para dentro de apps/web/public/unity-game.
    ///
    ///   Unity -batchmode -quit -projectPath . -executeMethod Genoryx.Editor.GenoryxWebGLBuild.Build
    ///
    /// O Unity nomeia os artefatos pela pasta de saida, entao eles saem como
    /// unity-game.{loader.js,data,framework.js,wasm}. O host web usa esses mesmos nomes.
    /// </summary>
    public static class GenoryxWebGLBuild
    {
        // So a cena de criaturas. HavenSlice e CharacterCreation dependem dos GLB do
        // pipeline de personagem, e o Unity copia StreamingAssets INTEIRO para o bundle:
        // o build ia a 330 MB, dos quais 280 MB eram malha de tamer que a cena de
        // criaturas nem toca.
        static readonly string[] Scenes =
        {
            "Assets/GENORYX/Scenes/CreatureAssemblyTest.unity"
        };

        [MenuItem("GENORYX/Build/WebGL → apps/web/public/unity-game")]
        public static void Build()
        {
            var output = Path.GetFullPath(Path.Combine(Application.dataPath, "../../web/public/unity-game"));
            Directory.CreateDirectory(output);

            // Gzip COM decompressionFallback. O Next serve public/ sem devolver
            // Content-Encoding por extensao, e sem fallback o browser receberia o .gz
            // como se fosse wasm cru — o loader morre em "magic word". Com fallback o
            // proprio loader descomprime em JS: nenhuma config de nginx/Next, e o
            // download cai de 51 MB para ~13 MB.
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.WebGL.template = "PROJECT:Genoryx";
            PlayerSettings.WebGL.linkerTarget = WebGLLinkerTarget.Wasm;
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.None;
            PlayerSettings.SetIl2CppCompilerConfiguration(BuildTargetGroup.WebGL, Il2CppCompilerConfiguration.Release);
            PlayerSettings.companyName = "GENORYX";
            PlayerSettings.productName = "GENORYX World";
            PlayerSettings.runInBackground = true;

            EnsureAlwaysIncludedShaders();

            var scenes = ExistingScenes();
            if (scenes.Length == 0)
            {
                Debug.LogError("[GENORYX] nenhuma cena valida para o build WebGL");
                if (Application.isBatchMode)
                {
                    EditorApplication.Exit(2);
                }

                return;
            }

            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = scenes,
                locationPathName = output,
                target = BuildTarget.WebGL,
                targetGroup = BuildTargetGroup.WebGL,
                options = BuildOptions.None
            });

            var summary = report.summary;

            // StreamingAssets sai do bundle publicado. A cena de criaturas e 100%
            // procedural e nao le nada de lá; o que existe na pasta e o acervo GLB do
            // pipeline de personagem, que sozinho multiplicaria por seis o tamanho do
            // deploy. Quando o tamer entrar no WebGL isso volta, sob curadoria.
            var streaming = Path.Combine(output, "StreamingAssets");
            if (summary.result == BuildResult.Succeeded && Directory.Exists(streaming))
            {
                Directory.Delete(streaming, true);
                Debug.Log("[GENORYX] StreamingAssets removido do bundle publicado");
            }

            Debug.Log("[GENORYX] WebGL " + summary.result
                + " bytes=" + summary.totalSize
                + " tempo=" + summary.totalTime
                + " saida=" + output);

            if (Application.isBatchMode)
            {
                EditorApplication.Exit(summary.result == BuildResult.Succeeded ? 0 : 2);
            }
        }

        // Shaders resolvidos so em runtime, via Shader.Find. Nenhum material de cena os
        // referencia, entao o build os descarta e Shader.Find devolve null no player:
        // as auras viravam quadrados brancos porque o material caía num shader sem
        // textura. Always Included Shaders e o unico jeito de garantir a presenca.
        static readonly string[] RuntimeShaders =
        {
            "GENORYX/Aura",
            "Universal Render Pipeline/Particles/Unlit",
            "Universal Render Pipeline/Unlit",
            "Sprites/Default"
        };

        static void EnsureAlwaysIncludedShaders()
        {
            var settings = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/GraphicsSettings.asset");
            if (settings == null || settings.Length == 0)
            {
                Debug.LogWarning("[GENORYX] GraphicsSettings.asset indisponivel; shaders de runtime nao garantidos");
                return;
            }

            var graphics = new SerializedObject(settings[0]);
            var list = graphics.FindProperty("m_AlwaysIncludedShaders");
            if (list == null)
            {
                Debug.LogWarning("[GENORYX] m_AlwaysIncludedShaders ausente; shaders de runtime nao garantidos");
                return;
            }

            var added = 0;
            foreach (var name in RuntimeShaders)
            {
                var shader = Shader.Find(name);
                if (shader == null)
                {
                    continue;
                }

                var present = false;
                for (var i = 0; i < list.arraySize; i++)
                {
                    if (list.GetArrayElementAtIndex(i).objectReferenceValue == shader)
                    {
                        present = true;
                        break;
                    }
                }

                if (present)
                {
                    continue;
                }

                list.InsertArrayElementAtIndex(list.arraySize);
                list.GetArrayElementAtIndex(list.arraySize - 1).objectReferenceValue = shader;
                added++;
            }

            if (added > 0)
            {
                graphics.ApplyModifiedProperties();
                AssetDatabase.SaveAssets();
                Debug.Log("[GENORYX] shaders de runtime incluidos no build: " + added);
            }
        }

        static string[] ExistingScenes()
        {
            var found = new System.Collections.Generic.List<string>();
            foreach (var scene in Scenes)
            {
                if (AssetDatabase.LoadAssetAtPath<SceneAsset>(scene) != null)
                {
                    found.Add(scene);
                }
                else
                {
                    Debug.LogWarning("[GENORYX] cena ausente, fora do build: " + scene);
                }
            }

            return found.ToArray();
        }
    }
}
#endif
