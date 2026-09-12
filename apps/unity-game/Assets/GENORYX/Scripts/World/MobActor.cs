using UnityEngine;

namespace Genoryx
{
    public enum MobFamily
    {
        COMMON,
        UNCOMMON,
        ELITE,
        BOSS
    }

    public enum MobAggro
    {
        PASSIVE,
        DEFENSIVE,
        AGGRESSIVE
    }

    public class MobActor : MonoBehaviour
    {
        public string spawnKey;
        public string speciesKey;
        public MobFamily family = MobFamily.COMMON;
        public MobAggro aggro = MobAggro.PASSIVE;
        public Vector3 home;
        float phase;

        void Start()
        {
            home = transform.position;
            phase = Random.Range(0f, Mathf.PI * 2f);
            transform.localScale = family == MobFamily.BOSS ? Vector3.one * 2.4f : family == MobFamily.ELITE ? Vector3.one * 1.7f : Vector3.one * 1.25f;
        }

        void Update()
        {
            var wander = new Vector3(Mathf.Sin(Time.time * 0.4f + phase), 0f, Mathf.Cos(Time.time * 0.33f + phase)) * 1.6f;
            transform.position = Vector3.Lerp(transform.position, home + wander, Time.deltaTime * 0.8f);
        }

        void OnMouseDown()
        {
            if (WorldBridge.Instance != null)
            {
                WorldBridge.Instance.SendInteract(spawnKey, "");
            }
        }
    }
}
