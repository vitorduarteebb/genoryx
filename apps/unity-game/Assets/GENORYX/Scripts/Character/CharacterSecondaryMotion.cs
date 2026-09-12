using UnityEngine;

namespace Genoryx
{
    public class CharacterSecondaryMotion : MonoBehaviour
    {
        public float strength = 0.08f;
        Transform[] springs;

        void Start()
        {
            springs = System.Array.FindAll(
                GetComponentsInChildren<Transform>(true),
                bone =>
                {
                    var n = bone.name.ToLowerInvariant();
                    return n.Contains("cape") || n.Contains("cloak") || n.Contains("hair") || n.Contains("ponytail");
                });
        }

        void LateUpdate()
        {
            if (springs == null)
            {
                return;
            }

            var sway = Mathf.Sin(Time.time * 1.4f) * strength;
            for (var i = 0; i < springs.Length; i++)
            {
                if (springs[i] == null)
                {
                    continue;
                }

                springs[i].localRotation *= Quaternion.Euler(sway * 4f, 0f, sway * 2f);
            }
        }
    }
}
