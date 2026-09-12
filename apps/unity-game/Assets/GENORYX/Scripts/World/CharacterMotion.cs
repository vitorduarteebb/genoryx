using UnityEngine;

namespace Genoryx
{
    public class CharacterMotion : MonoBehaviour
    {
        Transform torso;
        Transform armL;
        Transform armR;
        Transform legL;
        Transform legR;
        Vector3 last;
        float phase;

        void Start()
        {
            torso = transform.Find("Torso");
            armL = transform.Find("ArmL");
            armR = transform.Find("ArmR");
            legL = transform.Find("LegL");
            legR = transform.Find("LegR");
            last = transform.position;
        }

        void LateUpdate()
        {
            var delta = transform.position - last;
            delta.y = 0f;
            var speed = delta.magnitude / Mathf.Max(Time.deltaTime, 0.0001f);
            last = transform.position;
            var walk = Mathf.Clamp01(speed / 3.2f);
            phase += Time.deltaTime * (walk > 0.08f ? 8.5f : 1.6f);
            var swing = Mathf.Sin(phase) * (walk > 0.08f ? 28f : 3f);
            var breath = Mathf.Sin(Time.time * 1.8f) * 0.012f;

            if (torso != null)
            {
                torso.localPosition = new Vector3(0f, 1.22f + breath, 0.02f);
            }

            SetX(legL, swing);
            SetX(legR, -swing);
            SetX(armL, -swing * 0.7f);
            SetX(armR, swing * 0.7f);
        }

        static void SetX(Transform bone, float x)
        {
            if (bone == null)
            {
                return;
            }

            bone.localRotation = Quaternion.Euler(x, 0f, 0f);
        }
    }
}
