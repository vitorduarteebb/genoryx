using UnityEngine;

namespace Genoryx
{
    public static class BoneMovementValidator
    {
        public struct Snapshot
        {
            public Vector3 head;
            public Vector3 leftHand;
            public Vector3 rightHand;
            public Vector3 leftFoot;
            public Vector3 rightFoot;
        }

        public static Snapshot Capture(Animator animator)
        {
            var snap = new Snapshot();
            if (animator == null)
            {
                return snap;
            }

            snap.head = Pos(animator, HumanBodyBones.Head);
            snap.leftHand = Pos(animator, HumanBodyBones.LeftHand);
            snap.rightHand = Pos(animator, HumanBodyBones.RightHand);
            snap.leftFoot = Pos(animator, HumanBodyBones.LeftFoot);
            snap.rightFoot = Pos(animator, HumanBodyBones.RightFoot);
            return snap;
        }

        public static bool Moved(Snapshot before, Snapshot after, float min = 0.004f)
        {
            return Dist(before.head, after.head) > min
                   || Dist(before.leftHand, after.leftHand) > min
                   || Dist(before.rightHand, after.rightHand) > min
                   || Dist(before.leftFoot, after.leftFoot) > min
                   || Dist(before.rightFoot, after.rightFoot) > min;
        }

        static Vector3 Pos(Animator animator, HumanBodyBones bone)
        {
            if (animator.avatar == null || !animator.avatar.isHuman)
            {
                return Vector3.zero;
            }

            var t = animator.GetBoneTransform(bone);
            return t != null ? t.position : Vector3.zero;
        }

        static float Dist(Vector3 a, Vector3 b)
        {
            return Vector3.Distance(a, b);
        }
    }
}
