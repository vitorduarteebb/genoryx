#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;

namespace Genoryx.Editor
{
    [InitializeOnLoad]
    public static class GenoryxHumanoidAnimatorFactory
    {
        const string Path = "Assets/GENORYX/Characters/GenoryxHumanoidAnimator.controller";

        static GenoryxHumanoidAnimatorFactory()
        {
            EditorApplication.delayCall += Ensure;
        }

        static void Ensure()
        {
            if (AssetDatabase.LoadAssetAtPath<RuntimeAnimatorController>("Assets/GENORYX/Characters/UnityReady/GenoryxHumanoidAnimator.controller") != null)
            {
                return;
            }

            if (AssetDatabase.LoadAssetAtPath<RuntimeAnimatorController>(Path) != null)
            {
                return;
            }

            DirectoryCheck();
            var controller = AnimatorController.CreateAnimatorControllerAtPath(Path);
            controller.AddParameter("Speed", AnimatorControllerParameterType.Float);
            controller.AddParameter("IsMoving", AnimatorControllerParameterType.Bool);
            controller.AddParameter("IsRunning", AnimatorControllerParameterType.Bool);
            controller.AddParameter("Interact", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("Hit", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("Death", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("Victory", AnimatorControllerParameterType.Trigger);

            var root = controller.layers[0].stateMachine;
            var idle = root.AddState("Idle");
            var walk = root.AddState("Walk");
            var run = root.AddState("Run");
            root.AddState("Interact");
            root.AddState("Hit");
            root.AddState("Death");
            root.AddState("Victory");
            root.defaultState = idle;

            var toWalk = idle.AddTransition(walk);
            toWalk.AddCondition(AnimatorConditionMode.If, 0, "IsMoving");
            toWalk.hasExitTime = false;
            var toRun = walk.AddTransition(run);
            toRun.AddCondition(AnimatorConditionMode.If, 0, "IsRunning");
            toRun.hasExitTime = false;
            var backWalk = run.AddTransition(walk);
            backWalk.AddCondition(AnimatorConditionMode.IfNot, 0, "IsRunning");
            backWalk.hasExitTime = false;
            var backIdle = walk.AddTransition(idle);
            backIdle.AddCondition(AnimatorConditionMode.IfNot, 0, "IsMoving");
            backIdle.hasExitTime = false;

            AssetDatabase.SaveAssets();
        }

        static void DirectoryCheck()
        {
            if (!AssetDatabase.IsValidFolder("Assets/GENORYX/Characters"))
            {
                AssetDatabase.CreateFolder("Assets/GENORYX", "Characters");
            }
        }
    }
}
#endif
