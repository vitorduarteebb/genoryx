using UnityEngine;

namespace Genoryx
{
    public class CanonicalSkeletonMirror : MonoBehaviour
    {
        Transform[] sources = System.Array.Empty<Transform>();
        Transform[] dests = System.Array.Empty<Transform>();

        public int PairCount => sources.Length;

        public void Bind(Transform bodyRoot, Transform clothingRoot)
        {
            if (bodyRoot == null || clothingRoot == null)
            {
                return;
            }

            var src = new System.Collections.Generic.List<Transform>();
            var dst = new System.Collections.Generic.List<Transform>();
            foreach (var bone in clothingRoot.GetComponentsInChildren<Transform>(true))
            {
                if (bone == clothingRoot)
                {
                    continue;
                }

                var match = BoneMapper.FindCanonical(bodyRoot, bone.name);
                if (match == null || match == bone)
                {
                    continue;
                }

                src.Add(match);
                dst.Add(bone);
            }

            sources = src.ToArray();
            dests = dst.ToArray();
        }

        void LateUpdate()
        {
            var n = Mathf.Min(sources.Length, dests.Length);
            for (var i = 0; i < n; i++)
            {
                if (sources[i] == null || dests[i] == null)
                {
                    continue;
                }

                dests[i].SetPositionAndRotation(sources[i].position, sources[i].rotation);
            }
        }
    }
}
