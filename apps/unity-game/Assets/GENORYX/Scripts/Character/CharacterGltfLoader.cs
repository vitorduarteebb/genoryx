using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using GLTFast;
using UnityEngine;

namespace Genoryx
{
    // DEPRECATED_FOR_PLAYER_CHARACTER — gameplay usa prefabs em CharacterPartLibrary.
    // Mantido para assets que ainda entram via StreamingAssets GLB.
    public static class CharacterGltfLoader
    {
        static readonly Dictionary<string, GltfImport> Imports = new();
        static readonly Dictionary<string, AnimationClip[]> Clips = new();

        public static string Phase1File(string fileName)
        {
            return Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "phase1", fileName);
        }

        public static bool Phase1Ready()
        {
            var canonical = Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "Processed", "Bodies", "canonical_body.glb");
            var canonicalRig = Phase1File("canonical.rigged.glb");
            return File.Exists(canonical)
                   || File.Exists(canonicalRig)
                   || (File.Exists(Phase1File("tamer.rigged.glb"))
                       && File.Exists(Phase1File("anim.walk.glb"))
                       && File.Exists(Phase1File("anim.run.glb")));
        }

        public static async Task<GameObject> Instantiate(string absolutePath, Transform parent, string name)
        {
            if (!File.Exists(absolutePath))
            {
                throw new FileNotFoundException("GLB Meshy ausente: " + absolutePath);
            }

            if (!Imports.TryGetValue(absolutePath, out var import) || import == null)
            {
                import = new GltfImport();
                var settings = new ImportSettings
                {
                    AnimationMethod = AnimationMethod.Mecanim
                };
                var uri = new System.Uri(absolutePath).AbsoluteUri;
                var ok = await import.Load(uri, settings);
                if (!ok)
                {
                    throw new System.Exception("glTFast falhou ao ler " + absolutePath);
                }

                Imports[absolutePath] = import;
            }

            var root = new GameObject(name);
            root.transform.SetParent(parent, false);
            await import.InstantiateMainSceneAsync(root.transform);
            return root;
        }

        public static async Task<AnimationClip[]> LoadClips(string absolutePath)
        {
            if (!File.Exists(absolutePath))
            {
                return System.Array.Empty<AnimationClip>();
            }

            if (Clips.TryGetValue(absolutePath, out var cached) && cached != null)
            {
                return cached;
            }

            if (!Imports.TryGetValue(absolutePath, out var import) || import == null)
            {
                import = new GltfImport();
                var settings = new ImportSettings
                {
                    AnimationMethod = AnimationMethod.Mecanim
                };
                var ok = await import.Load(new System.Uri(absolutePath).AbsoluteUri, settings);
                if (!ok)
                {
                    return System.Array.Empty<AnimationClip>();
                }

                Imports[absolutePath] = import;
            }

            var clips = import.GetAnimationClips() ?? System.Array.Empty<AnimationClip>();
            Clips[absolutePath] = clips;
            return clips;
        }
    }
}
