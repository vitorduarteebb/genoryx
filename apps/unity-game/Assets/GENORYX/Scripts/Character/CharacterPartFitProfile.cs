using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace Genoryx
{
    [Serializable]
    public class CharacterPartFit
    {
        public string id;
        public Vector3 positionOffset = Vector3.zero;
        public Vector3 eulerOffset = Vector3.zero;
        public Vector3 scale = Vector3.one;
        public float width = 1f;
        public float depth = 1f;
    }

    [Serializable]
    class FitFile
    {
        public CharacterPartFit[] profiles;
    }

    public static class CharacterPartFitProfile
    {
        static Dictionary<string, CharacterPartFit> map;

        public static void Ensure()
        {
            if (map != null)
            {
                return;
            }

            map = new Dictionary<string, CharacterPartFit>();
            var path = Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "Processed", "fit_profiles.json");
            if (!File.Exists(path))
            {
                Seed();
                return;
            }

            var file = JsonUtility.FromJson<FitFile>(File.ReadAllText(path));
            if (file?.profiles != null)
            {
                foreach (var row in file.profiles)
                {
                    if (!string.IsNullOrEmpty(row.id))
                    {
                        map[row.id] = row;
                    }
                }
            }

            Seed();
        }

        static void Seed()
        {
            void Add(string id, Vector3 pos, Vector3 scale, float width, float depth)
            {
                if (map.ContainsKey(id))
                {
                    return;
                }

                map[id] = new CharacterPartFit { id = id, positionOffset = pos, scale = scale, width = width, depth = depth };
            }

            Add("chest_01", new Vector3(0f, 0f, 0f), Vector3.one, 1f, 1f);
            Add("chest_02", new Vector3(0f, 0f, 0f), Vector3.one, 1f, 1f);
            Add("pants_01", new Vector3(0f, 0f, 0f), Vector3.one, 1f, 1f);
            Add("pants_02", new Vector3(0f, 0f, 0f), Vector3.one, 1f, 1f);
            Add("boots_01", new Vector3(0f, 0f, 0f), Vector3.one, 1f, 1f);
            Add("boots_02", new Vector3(0f, 0f, 0f), Vector3.one, 1f, 1f);
            Add("hair_01", new Vector3(0f, 0f, 0f), Vector3.one, 1f, 1f);
            Add("hair_02", new Vector3(0f, 0f, 0f), Vector3.one, 1f, 1f);
        }

        public static CharacterPartFit Find(string id)
        {
            Ensure();
            return map.TryGetValue(id, out var fit) ? fit : null;
        }

        public static void Apply(Transform part, string id)
        {
            var fit = Find(id);
            if (part == null || fit == null)
            {
                return;
            }

            part.localPosition += fit.positionOffset;
            part.localRotation *= Quaternion.Euler(fit.eulerOffset);
            var scale = part.localScale;
            scale.x *= fit.scale.x * fit.width;
            scale.y *= fit.scale.y;
            scale.z *= fit.scale.z * fit.depth;
            part.localScale = scale;
        }
    }
}
