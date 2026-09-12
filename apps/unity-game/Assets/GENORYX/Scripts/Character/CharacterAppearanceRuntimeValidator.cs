using System.Text;
using UnityEngine;

namespace Genoryx
{
    public static class CharacterAppearanceRuntimeValidator
    {
        public static string Compare(CharacterAppearanceData a, CharacterAppearanceData b, string label)
        {
            a ??= CharacterAppearanceData.Phase1();
            b ??= CharacterAppearanceData.Phase1();
            var fail = new StringBuilder();
            void Field(string name, string left, string right)
            {
                if (left != right)
                {
                    fail.AppendLine($"FAIL {label} {name}: {left} != {right}");
                }
            }

            Field("bodyType", a.bodyType, b.bodyType);
            Field("faceId", a.faceId, b.faceId);
            Field("skinTone", a.skinTone, b.skinTone);
            Field("eyeColor", a.eyeColor, b.eyeColor);
            Field("hairId", a.hairId, b.hairId);
            Field("hairColor", a.hairColor, b.hairColor);
            Field("chestId", a.chestId, b.chestId);
            Field("legsId", a.legsId, b.legsId);
            Field("bootsId", a.bootsId, b.bootsId);
            return fail.Length == 0 ? "OK " + label + " " + a.ToJson() : fail.ToString();
        }

        public static string CompareCreatorHaven(CharacterAssembler creatorOrHaven)
        {
            return Compare(creatorOrHaven != null ? creatorOrHaven.appearance : null, CharacterAppearanceStore.Load(), "CreatorAppearance==HavenAppearance");
        }

        public static string Integrity(CharacterAssembler assembler)
        {
            if (assembler == null)
            {
                return "FAIL assembler null";
            }

            var animators = assembler.GetComponentsInChildren<Animator>(true);
            var liveAnimators = 0;
            for (var i = 0; i < animators.Length; i++)
            {
                if (animators[i] != null && animators[i].enabled)
                {
                    liveAnimators += 1;
                }
            }

            var report = new StringBuilder();
            if (liveAnimators > 1)
            {
                report.AppendLine("FAIL animators=" + liveAnimators);
            }

            if (assembler.VisibleHumanoidBodies() > 1)
            {
                report.AppendLine("FAIL duplicate body");
            }

            var col = assembler.GetComponent<CapsuleCollider>();
            if (col == null)
            {
                report.AppendLine("FAIL CapsuleCollider ausente no CharacterRoot");
            }

            var visualCols = assembler.visualRoot != null ? assembler.visualRoot.GetComponentsInChildren<Collider>(true).Length : 0;
            if (visualCols > 0)
            {
                report.AppendLine("FAIL collider na aparência count=" + visualCols);
            }

            return report.Length == 0
                ? "OK integrity animators=" + liveAnimators + " sharedMats=" + CharacterSharedMaterials.UniqueMaterialCount()
                : report.ToString();
        }
    }
}
