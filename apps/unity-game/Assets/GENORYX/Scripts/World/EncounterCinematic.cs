using System.Collections;
using UnityEngine;

namespace Genoryx
{
    public class EncounterCinematic : MonoBehaviour
    {
        public Camera worldCamera;
        public Transform focus;
        public float duration = 1.15f;

        public void Play(string json)
        {
            StopAllCoroutines();
            StartCoroutine(Run());
            Debug.Log($"[GENORYX:cinematic] {json}");
        }

        IEnumerator Run()
        {
            AudioHooks.Play(AudioHooks.MobAggro);
            var start = worldCamera != null ? worldCamera.transform.position : transform.position;
            var t = 0f;
            while (t < duration)
            {
                t += Time.deltaTime;
                if (worldCamera != null && focus != null)
                {
                    worldCamera.transform.position = Vector3.Lerp(start, focus.position + new Vector3(0f, 2.4f, -3.2f), t / duration);
                }
                yield return null;
            }
        }
    }
}
