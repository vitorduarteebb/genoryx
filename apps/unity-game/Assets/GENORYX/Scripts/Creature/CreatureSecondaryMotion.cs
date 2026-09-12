using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Movimento secundario leve, aplicado DEPOIS do Animator.
    /// Cauda com spring, back traits reagindo, Core pulsando. Chifres ficam rigidos.
    /// Fisica de proposito discreta: nunca deve competir com a animacao.
    /// </summary>
    [RequireComponent(typeof(CreatureAssembler))]
    [DefaultExecutionOrder(200)]
    public class CreatureSecondaryMotion : MonoBehaviour
    {
        public float tailSpring = 12f;
        public float tailDamping = 5.5f;
        public float tailGain = 9f;
        public float backGain = 2.4f;
        public float corePulseSpeed = 1.7f;
        public float corePulseDepth = 0.28f;

        CreatureAssembler assembler;
        Transform tailMid;
        Transform tailTip;
        Transform backLeft;
        Transform backRight;
        Renderer coreRenderer;
        MaterialPropertyBlock block;

        Vector3 lastPosition;
        float lastYaw;
        float swayVelocity;
        float sway;
        float baseCoreIntensity = 3.5f;
        Color coreColor = Color.white;

        void Awake()
        {
            assembler = GetComponent<CreatureAssembler>();
            assembler.BuildStructure();
            block = new MaterialPropertyBlock();
            Rebind();
            lastPosition = transform.position;
            lastYaw = transform.eulerAngles.y;
        }

        public void Rebind()
        {
            var bones = assembler.Bones;
            if (bones == null)
            {
                return;
            }

            tailMid = CreatureRig.Find(bones, CreatureSockets.TailMid);
            tailTip = CreatureRig.Find(bones, CreatureSockets.TailTip);
            backLeft = CreatureRig.Find(bones, CreatureSockets.BackL);
            backRight = CreatureRig.Find(bones, CreatureSockets.BackR);

            var coreSlot = assembler.Slot("CoreSlot");
            coreRenderer = coreSlot != null ? coreSlot.Find("CoreMesh")?.GetComponent<Renderer>() : null;

            if (assembler.dna != null)
            {
                coreColor = CreaturePalette.Get(assembler.dna.coreColorId);
                baseCoreIntensity = CreatureCoreDefinition.IntensityFor(assembler.dna.CoreId);
            }
        }

        void LateUpdate()
        {
            var dt = Time.deltaTime;
            if (dt <= 0f)
            {
                return;
            }

            var yaw = transform.eulerAngles.y;
            var yawDelta = Mathf.DeltaAngle(lastYaw, yaw);
            lastYaw = yaw;

            var move = (transform.position - lastPosition) / dt;
            lastPosition = transform.position;

            // Spring de cauda: reage ao giro e ao deslocamento lateral.
            var lateral = Vector3.Dot(move, transform.right);
            var drive = -yawDelta * tailGain - lateral * 1.6f;
            var accel = (drive - sway) * tailSpring - swayVelocity * tailDamping;
            swayVelocity += accel * dt;
            sway += swayVelocity * dt;
            sway = Mathf.Clamp(sway, -26f, 26f);

            if (tailMid != null)
            {
                tailMid.localRotation *= Quaternion.Euler(0f, sway * 0.55f, 0f);
            }

            if (tailTip != null)
            {
                tailTip.localRotation *= Quaternion.Euler(0f, sway * 0.85f, 0f);
            }

            var backReact = Mathf.Clamp(-yawDelta * backGain, -7f, 7f);
            if (backLeft != null)
            {
                backLeft.localRotation *= Quaternion.Euler(0f, 0f, backReact * 0.4f);
            }

            if (backRight != null)
            {
                backRight.localRotation *= Quaternion.Euler(0f, 0f, backReact * 0.4f);
            }

            PulseCore();
        }

        void PulseCore()
        {
            if (coreRenderer == null)
            {
                return;
            }

            var pulse = 1f + Mathf.Sin(Time.time * corePulseSpeed * Mathf.PI) * corePulseDepth;
            coreRenderer.GetPropertyBlock(block);
            block.SetColor("_EmissionColor", coreColor);
            block.SetFloat("_EmissionIntensity", baseCoreIntensity * pulse);
            block.SetFloat("_EmissionMask", 2f);
            coreRenderer.SetPropertyBlock(block);
        }
    }
}
