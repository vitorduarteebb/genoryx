using System.Collections.Generic;
using UnityEngine;

namespace Genoryx
{
    public static class BoneMapper
    {
        static readonly Dictionary<string, string> Aliases = new Dictionary<string, string>
        {
            { "hips", "Hips" },
            { "pelvis", "Hips" },
            { "spine", "Spine" },
            { "spine01", "Chest" },
            { "spine02", "UpperChest" },
            { "spine1", "Chest" },
            { "spine2", "UpperChest" },
            { "chest", "Chest" },
            { "upperchest", "UpperChest" },
            { "neck", "Neck" },
            { "head", "Head" },
            { "leftshoulder", "LeftShoulder" },
            { "rightshoulder", "RightShoulder" },
            { "leftarm", "LeftUpperArm" },
            { "rightarm", "RightUpperArm" },
            { "leftforearm", "LeftLowerArm" },
            { "rightforearm", "RightLowerArm" },
            { "lefthand", "LeftHand" },
            { "righthand", "RightHand" },
            { "leftupleg", "LeftUpperLeg" },
            { "leftupperleg", "LeftUpperLeg" },
            { "rightupleg", "RightUpperLeg" },
            { "rightupperleg", "RightUpperLeg" },
            { "leftleg", "LeftLowerLeg" },
            { "rightleg", "RightLowerLeg" },
            { "leftfoot", "LeftFoot" },
            { "rightfoot", "RightFoot" },
            { "lefttoe", "LeftToes" },
            { "righttoe", "RightToes" },
            { "lefttoebase", "LeftToes" },
            { "righttoebase", "RightToes" }
        };

        public static string Canonical(string boneName)
        {
            if (string.IsNullOrEmpty(boneName))
            {
                return boneName;
            }

            var key = boneName.Replace("mixamorig:", "", System.StringComparison.OrdinalIgnoreCase)
                .Replace("mixamorig|", "", System.StringComparison.OrdinalIgnoreCase)
                .Replace(" ", "")
                .Replace("_", "")
                .Replace(".", "")
                .ToLowerInvariant();
            return Aliases.TryGetValue(key, out var mapped) ? mapped : boneName;
        }

        public static Transform[] RemapBones(Transform[] source, Transform canonicalRoot)
        {
            if (source == null || canonicalRoot == null)
            {
                return source;
            }

            var mapped = new Transform[source.Length];
            for (var i = 0; i < source.Length; i++)
            {
                if (source[i] == null)
                {
                    continue;
                }

                mapped[i] = FindCanonical(canonicalRoot, Canonical(source[i].name)) ?? source[i];
            }

            return mapped;
        }

        public static Transform FindCanonical(Transform root, string canonical)
        {
            var want = Canonical(canonical);
            foreach (var t in root.GetComponentsInChildren<Transform>(true))
            {
                var mapped = Canonical(t.name);
                if (mapped == want || t.name == canonical || t.name == want || Canonical(canonical) == mapped)
                {
                    return t;
                }
            }

            return null;
        }
    }
}
