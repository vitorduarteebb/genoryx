#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace Genoryx.Editor
{
    public static class GenoryxHumanoidAvatarBuilder
    {
        static readonly (string bone, string human)[] Map =
        {
            ("Hips", "Hips"),
            ("Spine", "Spine"),
            ("Spine1", "Chest"),
            ("Chest", "Chest"),
            ("Spine2", "Upper Chest"),
            ("UpperChest", "Upper Chest"),
            ("Neck", "Neck"),
            ("Head", "Head"),
            ("LeftShoulder", "Left Shoulder"),
            ("RightShoulder", "Right Shoulder"),
            ("LeftArm", "Left Upper Arm"),
            ("RightArm", "Right Upper Arm"),
            ("LeftUpperArm", "Left Upper Arm"),
            ("RightUpperArm", "Right Upper Arm"),
            ("LeftForeArm", "Left Lower Arm"),
            ("RightForeArm", "Right Lower Arm"),
            ("LeftLowerArm", "Left Lower Arm"),
            ("RightLowerArm", "Right Lower Arm"),
            ("LeftHand", "Left Hand"),
            ("RightHand", "Right Hand"),
            ("LeftUpLeg", "Left Upper Leg"),
            ("RightUpLeg", "Right Upper Leg"),
            ("LeftUpperLeg", "Left Upper Leg"),
            ("RightUpperLeg", "Right Upper Leg"),
            ("LeftLeg", "Left Lower Leg"),
            ("RightLeg", "Right Lower Leg"),
            ("LeftLowerLeg", "Left Lower Leg"),
            ("RightLowerLeg", "Right Lower Leg"),
            ("LeftFoot", "Left Foot"),
            ("RightFoot", "Right Foot"),
            ("LeftToeBase", "Left Toes"),
            ("RightToeBase", "Right Toes"),
            ("LeftToes", "Left Toes"),
            ("RightToes", "Right Toes")
        };

        public static Avatar Ensure(string fbxPath, string avatarAssetPath)
        {
            var existing = FindAvatar(fbxPath);
            if (existing != null && existing.isValid && existing.isHuman)
            {
                return existing;
            }

            var model = AssetDatabase.LoadAssetAtPath<GameObject>(fbxPath);
            if (model == null)
            {
                Debug.LogError("[GENORYX] FBX ausente para Avatar: " + fbxPath);
                return existing;
            }

            var instance = Object.Instantiate(model);
            instance.name = "GenoryxCanonicalAvatarSource";
            var desc = BuildDescription(instance);
            var avatar = AvatarBuilder.BuildHumanAvatar(instance, desc);
            Object.DestroyImmediate(instance);
            if (avatar == null)
            {
                Debug.LogError("[GENORYX] AvatarBuilder falhou em " + fbxPath);
                return existing;
            }

            avatar.name = "GenoryxCanonicalAvatar";
            var stored = AssetDatabase.LoadAssetAtPath<Avatar>(avatarAssetPath);
            if (stored != null)
            {
                AssetDatabase.DeleteAsset(avatarAssetPath);
            }

            AssetDatabase.CreateAsset(avatar, avatarAssetPath);
            AssetDatabase.SaveAssets();
            Debug.Log("[GENORYX] GenoryxCanonicalAvatar human=" + avatar.isHuman + " valid=" + avatar.isValid);
            return avatar;
        }

        public static HumanDescription BuildDescription(GameObject model)
        {
            var human = new List<HumanBone>();
            var usedHumans = new HashSet<string>();
            foreach (var (bone, humanName) in Map)
            {
                if (usedHumans.Contains(humanName))
                {
                    continue;
                }

                var t = FindBone(model.transform, bone);
                if (t == null)
                {
                    continue;
                }

                usedHumans.Add(humanName);
                human.Add(new HumanBone
                {
                    humanName = humanName,
                    boneName = t.name,
                    limit = new HumanLimit { useDefaultValues = true }
                });
            }

            var skeleton = new List<SkeletonBone>();
            foreach (var t in model.GetComponentsInChildren<Transform>(true))
            {
                skeleton.Add(new SkeletonBone
                {
                    name = t.name,
                    position = t.localPosition,
                    rotation = t.localRotation,
                    scale = t.localScale
                });
            }

            return new HumanDescription
            {
                human = human.ToArray(),
                skeleton = skeleton.ToArray(),
                armStretch = 0.05f,
                legStretch = 0.05f,
                feetSpacing = 0f,
                hasTranslationDoF = false,
                upperArmTwist = 0.5f,
                lowerArmTwist = 0.5f,
                upperLegTwist = 0.5f,
                lowerLegTwist = 0.5f
            };
        }

        public static Transform FindBone(Transform root, string name)
        {
            var want = Normalize(name);
            foreach (var t in root.GetComponentsInChildren<Transform>(true))
            {
                if (Normalize(t.name) == want)
                {
                    return t;
                }
            }

            return null;
        }

        public static string Normalize(string name)
        {
            return (name ?? "")
                .Replace("mixamorig:", "")
                .Replace("mixamorig_", "")
                .Replace("mixamorig|", "")
                .Replace(" ", "")
                .Trim();
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
    }
}
#endif
