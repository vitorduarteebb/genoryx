using System.Collections.Generic;
using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// GENORYX_CORE_RIG — o unico skeleton do sistema.
    /// Toda combinacao de pecas usa exatamente estes bones, nesta ordem.
    /// </summary>
    public static class CreatureRig
    {
        static Matrix4x4[] cachedBindposes;
        static Vector3[] cachedRestWorld;
        static Quaternion[] cachedRestRotation;

        /// <summary>Posicao de repouso em espaco do CreatureRoot.</summary>
        public static Vector3 RestWorld(string bone)
        {
            EnsureRest();
            var index = CreatureSockets.Index(bone);
            return index >= 0 ? cachedRestWorld[index] : Vector3.zero;
        }

        public static Vector3 RestWorld(int boneIndex)
        {
            EnsureRest();
            return boneIndex >= 0 && boneIndex < cachedRestWorld.Length ? cachedRestWorld[boneIndex] : Vector3.zero;
        }

        /// <summary>
        /// Rotacao de repouso acumulada do bone. Junto com <see cref="RestWorld(string)"/>
        /// reconstroi a matriz de repouso, que e o que leva uma peca rigida de volta ao
        /// espaco autorado sem carregar escala de growth nem pose de animacao.
        /// </summary>
        public static Quaternion RestWorldRotation(string bone)
        {
            EnsureRest();
            var index = CreatureSockets.Index(bone);
            return index >= 0 ? cachedRestRotation[index] : Quaternion.identity;
        }

        /// <summary>Bindposes canonicas. Identicas para toda peca, permitindo skeleton unico.</summary>
        public static Matrix4x4[] Bindposes()
        {
            EnsureRest();
            return cachedBindposes;
        }

        static void EnsureRest()
        {
            if (cachedRestWorld != null)
            {
                return;
            }

            var count = CreatureSockets.BoneOrder.Length;
            var world = new Vector3[count];
            var rotation = new Quaternion[count];
            var resolved = new bool[count];

            for (var pass = 0; pass < count; pass++)
            {
                for (var i = 0; i < count; i++)
                {
                    if (resolved[i])
                    {
                        continue;
                    }

                    var bone = CreatureSockets.BoneOrder[i];
                    var parent = CreatureSockets.ParentOf(bone);
                    if (parent == null)
                    {
                        world[i] = CreatureSockets.RestLocalPosition(bone);
                        rotation[i] = CreatureSockets.RestLocalRotation(bone);
                        resolved[i] = true;
                        continue;
                    }

                    var parentIndex = CreatureSockets.Index(parent);
                    if (parentIndex < 0 || !resolved[parentIndex])
                    {
                        continue;
                    }

                    world[i] = world[parentIndex] + rotation[parentIndex] * CreatureSockets.RestLocalPosition(bone);
                    rotation[i] = rotation[parentIndex] * CreatureSockets.RestLocalRotation(bone);
                    resolved[i] = true;
                }
            }

            var poses = new Matrix4x4[count];
            for (var i = 0; i < count; i++)
            {
                poses[i] = Matrix4x4.TRS(world[i], rotation[i], Vector3.one).inverse;
            }

            cachedRestWorld = world;
            cachedRestRotation = rotation;
            cachedBindposes = poses;
        }

        /// <summary>
        /// Instancia a hierarquia canonica de bones sob o root informado.
        /// Retorna o array de Transforms na ordem de CreatureSockets.BoneOrder.
        /// </summary>
        public static Transform[] Build(Transform parent)
        {
            var count = CreatureSockets.BoneOrder.Length;
            var bones = new Transform[count];
            var lookup = new Dictionary<string, Transform>(count);

            for (var pass = 0; pass < count; pass++)
            {
                for (var i = 0; i < count; i++)
                {
                    if (bones[i] != null)
                    {
                        continue;
                    }

                    var name = CreatureSockets.BoneOrder[i];
                    var parentName = CreatureSockets.ParentOf(name);
                    Transform parentTransform;
                    if (parentName == null)
                    {
                        parentTransform = parent;
                    }
                    else if (!lookup.TryGetValue(parentName, out parentTransform))
                    {
                        continue;
                    }

                    var go = new GameObject(name);
                    var t = go.transform;
                    t.SetParent(parentTransform, false);
                    t.localPosition = CreatureSockets.RestLocalPosition(name);
                    t.localRotation = CreatureSockets.RestLocalRotation(name);
                    t.localScale = Vector3.one;
                    bones[i] = t;
                    lookup[name] = t;
                }
            }

            return bones;
        }

        public static Transform Find(Transform[] bones, string name)
        {
            var index = CreatureSockets.Index(name);
            return index >= 0 && index < bones.Length ? bones[index] : null;
        }

        public static void ResetPose(Transform[] bones)
        {
            if (bones == null)
            {
                return;
            }

            for (var i = 0; i < bones.Length && i < CreatureSockets.BoneOrder.Length; i++)
            {
                if (bones[i] == null)
                {
                    continue;
                }

                var name = CreatureSockets.BoneOrder[i];
                bones[i].localPosition = CreatureSockets.RestLocalPosition(name);
                bones[i].localRotation = CreatureSockets.RestLocalRotation(name);
                bones[i].localScale = Vector3.one;
            }
        }

        /// <summary>Caminho relativo do bone a partir do CreatureRoot. Usado nos AnimationClips.</summary>
        public static string Path(string bone)
        {
            var parts = new List<string>();
            var cursor = bone;
            while (cursor != null)
            {
                parts.Insert(0, cursor);
                cursor = CreatureSockets.ParentOf(cursor);
            }

            return string.Join("/", parts);
        }
    }
}
