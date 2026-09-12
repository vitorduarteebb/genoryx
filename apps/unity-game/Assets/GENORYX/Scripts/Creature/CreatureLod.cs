using UnityEngine;

namespace Genoryx.Creatures
{
    public enum CreatureQuality
    {
        Hero,
        Standard,
        Distant
    }

    /// <summary>
    /// LOD0/LOD1/LOD2 sem trocar prefab: reduz densidade de malha, desliga adornos
    /// pequenos e alivia o Animator quando a criatura esta longe.
    /// Precisamos de muitos mobs no World; um mob distante nao merece o mesmo custo.
    /// </summary>
    [RequireComponent(typeof(CreatureAssembler))]
    public class CreatureLod : MonoBehaviour
    {
        public Transform viewer;
        public float standardDistance = 14f;
        public float distantDistance = 32f;
        public float evaluateInterval = 0.5f;

        public CreatureQuality quality = CreatureQuality.Hero;

        CreatureAssembler assembler;
        float timer;
        CreatureQuality applied = (CreatureQuality)(-1);

        public static float DetailFor(CreatureQuality quality)
        {
            return quality switch
            {
                CreatureQuality.Standard => 0.6f,
                CreatureQuality.Distant => 0.35f,
                _ => 1f
            };
        }

        void Awake()
        {
            assembler = GetComponent<CreatureAssembler>();
        }

        void Start()
        {
            if (viewer == null && Camera.main != null)
            {
                viewer = Camera.main.transform;
            }

            Apply(quality, true);
        }

        void Update()
        {
            if (viewer == null)
            {
                return;
            }

            timer -= Time.deltaTime;
            if (timer > 0f)
            {
                return;
            }

            timer = evaluateInterval;
            var distance = Vector3.Distance(transform.position, viewer.position);
            var target = distance > distantDistance
                ? CreatureQuality.Distant
                : distance > standardDistance
                    ? CreatureQuality.Standard
                    : CreatureQuality.Hero;

            Apply(target, false);
        }

        public void Apply(CreatureQuality target, bool force)
        {
            if (!force && target == applied)
            {
                return;
            }

            applied = target;
            quality = target;

            var detail = DetailFor(target);
            if (!Mathf.Approximately(assembler.detail, detail))
            {
                assembler.detail = detail;
                assembler.ApplyDNA(assembler.dna);
            }

            var animator = assembler.Animator;
            if (animator != null)
            {
                animator.cullingMode = target == CreatureQuality.Hero
                    ? AnimatorCullingMode.AlwaysAnimate
                    : AnimatorCullingMode.CullUpdateTransforms;
            }

            // Adornos pequenos somem antes do corpo: sao os que menos leem a distancia.
            SetSlotVisible("EyeSlot_L", target != CreatureQuality.Distant);
            SetSlotVisible("EyeSlot_R", target != CreatureQuality.Distant);
            SetSlotVisible("CoreSlot", true);

            var secondary = GetComponent<CreatureSecondaryMotion>();
            if (secondary != null)
            {
                secondary.enabled = target == CreatureQuality.Hero;
            }

            var aura = assembler.Aura;
            if (aura != null && target == CreatureQuality.Distant)
            {
                aura.Apply(CreatureParts.AuraNone, Color.white);
            }
            else if (aura != null && assembler.dna != null)
            {
                aura.Apply(assembler.dna.AuraId, CreaturePalette.Get(assembler.dna.coreColorId));
            }

            foreach (var renderer in GetComponentsInChildren<Renderer>(true))
            {
                renderer.shadowCastingMode = target == CreatureQuality.Distant
                    ? UnityEngine.Rendering.ShadowCastingMode.Off
                    : UnityEngine.Rendering.ShadowCastingMode.On;
            }
        }

        void SetSlotVisible(string slot, bool visible)
        {
            var t = assembler.Slot(slot);
            if (t == null)
            {
                return;
            }

            foreach (var renderer in t.GetComponentsInChildren<Renderer>(true))
            {
                if (renderer.GetComponent<MeshFilter>()?.sharedMesh != null)
                {
                    renderer.enabled = visible;
                }
            }
        }
    }
}
