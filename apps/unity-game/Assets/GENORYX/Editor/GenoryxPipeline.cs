#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace Genoryx.Editor
{
    [InitializeOnLoad]
    public static class GenoryxPipeline
    {
        static GenoryxPipeline()
        {
            EditorApplication.delayCall += Ensure;
        }

        static void Ensure()
        {
            var urp = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>("Assets/Settings/GenoryxURP.asset");
            if (urp == null)
            {
                return;
            }

            if (GraphicsSettings.defaultRenderPipeline != urp)
            {
                GraphicsSettings.defaultRenderPipeline = urp;
            }

            if (QualitySettings.renderPipeline != urp)
            {
                QualitySettings.renderPipeline = urp;
            }
        }
    }
}
#endif
