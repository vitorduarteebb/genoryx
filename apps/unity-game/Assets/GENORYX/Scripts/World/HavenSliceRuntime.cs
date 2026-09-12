using UnityEngine;

namespace Genoryx
{
    /// <summary>Reconstrói a vertical slice em Play se a versão mudou ou a cena está vazia.</summary>
    public class HavenSliceRuntime : MonoBehaviour
    {
        public int builtVersion;

        void Start()
        {
            if (!Application.isPlaying)
            {
                return;
            }

            if (builtVersion != HavenSliceBuilder.Version || GameObject.Find("GenesisCore") == null)
            {
                HavenSliceBuilder.Rebuild();
                builtVersion = HavenSliceBuilder.Version;
            }
        }
    }
}
