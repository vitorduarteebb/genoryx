using UnityEngine;

namespace Genoryx
{
    /// <summary>HUD legado. A exploração V1 usa WorldUIController (sem hotbar).</summary>
    public class WorldHud : MonoBehaviour
    {
        public string characterName = "Tamer";
        public int level = 1;
        public float hp01 = 0.86f;
        public string companionName = "Pyron";
        public string companionStage = "Baby";
        public int companionLevel = 7;
        public float growth01 = 0.61f;
        public string region = "Haven · Genesis Plaza";

        void OnEnable()
        {
            if (GetComponent<WorldUIController>() == null && FindFirstObjectByType<WorldUIController>() != null)
            {
                enabled = false;
            }
        }
    }
}
