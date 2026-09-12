using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Ponte JS → Unity do retrato 3D. O host web manda o DNA em JSON;
    /// daqui para frente o assembler monta. Sem HUD de laboratório.
    ///
    ///   SendMessage("CreaturePreview", "ApplyDnaJson", json)
    ///   SendMessage("CreaturePreview", "EnterPreview", "")
    /// </summary>
    public class CreatureWebPreview : MonoBehaviour
    {
        public const string ObjectName = "CreaturePreview";

        CreatureAssemblyTestBuilder lab;

        void Awake()
        {
            gameObject.name = ObjectName;
            lab = FindFirstObjectByType<CreatureAssemblyTestBuilder>();
        }

        public void EnterPreview(string _unused)
        {
            if (lab == null)
            {
                lab = FindFirstObjectByType<CreatureAssemblyTestBuilder>();
            }

            if (lab != null)
            {
                lab.EnterEmbeddedPreview();
            }
        }

        public void ApplyDnaJson(string json)
        {
            if (lab == null)
            {
                lab = FindFirstObjectByType<CreatureAssemblyTestBuilder>();
            }

            if (lab == null)
            {
                Debug.LogWarning("[GENORYX] CreaturePreview sem lab na cena");
                return;
            }

            lab.EnterEmbeddedPreview();
            lab.ApplyDnaJson(json);
        }
    }
}
