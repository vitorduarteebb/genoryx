using System.Collections.Generic;
using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Monta uma criatura GENORYX a partir de um CreatureDNA.
    ///
    /// Regra de arquitetura: DNA -> IDs de peca -> assembler -> criatura pronta.
    /// Nenhum caminho deste componente chama Meshy, rede ou disco em runtime.
    ///
    /// Renderers sao PERSISTENTES: trocar peca so troca sharedMesh/material.
    /// Por isso 1000 swaps nao criam nem destroem GameObjects.
    /// </summary>
    [DisallowMultipleComponent]
    public class CreatureAssembler : MonoBehaviour
    {
        public CreatureDNA dna = new CreatureDNA();
        public bool debugSockets;
        public float detail = 1f;
        public bool ready;

        [SerializeField] Transform visualRoot;
        [SerializeField] Transform skeletonRoot;
        [SerializeField] Transform auraRoot;

        Transform[] bones;
        Animator animator;

        SkinnedMeshRenderer bodyRenderer;
        SkinnedMeshRenderer headRenderer;
        SkinnedMeshRenderer limbsRenderer;
        SkinnedMeshRenderer tailRenderer;
        MeshRenderer eyeLeft;
        MeshRenderer eyeRight;
        MeshRenderer hornLeft;
        MeshRenderer hornRight;
        MeshRenderer backLeft;
        MeshRenderer backRight;
        MeshRenderer coreRenderer;
        MeshRenderer coreRim;

        readonly Dictionary<string, Transform> slots = new Dictionary<string, Transform>();
        MaterialPropertyBlock block;
        CreaturePartDatabase database;
        CreatureAuraController aura;

        public Transform VisualRoot => visualRoot;
        public Transform SkeletonRoot => skeletonRoot;
        public Transform[] Bones => bones;
        public Animator Animator => animator;
        public CreatureAuraController Aura => aura;

        // ------------------------------------------------------------- SPAWN

        public static GameObject Spawn(string name, Vector3 position, CreatureDNA dna = null)
        {
            var root = new GameObject(string.IsNullOrEmpty(name) ? "GenoryxCreature" : name);
            root.transform.position = position;
            var assembler = root.AddComponent<CreatureAssembler>();
            assembler.BuildStructure();
            assembler.ApplyDNA(dna ?? new CreatureDNA());
            return root;
        }

        void Awake()
        {
            BuildStructure();
        }

        void Start()
        {
            if (!ready)
            {
                ApplyDNA(dna ?? new CreatureDNA());
            }
        }

        /// <summary>Cria a hierarquia canonica uma unica vez. Idempotente.</summary>
        public void BuildStructure()
        {
            if (skeletonRoot != null && bones != null)
            {
                return;
            }

            database = CreaturePartDatabase.Load();
            block ??= new MaterialPropertyBlock();

            if (visualRoot == null)
            {
                visualRoot = Child(transform, "CreatureVisualRoot");
            }

            if (skeletonRoot == null)
            {
                skeletonRoot = Child(visualRoot, "SkeletonRoot");
            }

            bones = CreatureRig.Build(skeletonRoot);

            // Slots de peca skinada: filhos diretos do visual root, nunca de bones.
            var bodySlot = Child(visualRoot, "BodySlot");
            var headSlot = Child(visualRoot, "HeadSlot");
            var limbsSlot = Child(visualRoot, "LimbsSlot");
            var tailSlot = Child(visualRoot, "TailSlot");
            slots["BodySlot"] = bodySlot;
            slots["HeadSlot"] = headSlot;
            slots["LimbsSlot"] = limbsSlot;
            slots["TailSlot"] = tailSlot;

            // Slots de peca rigida: filhos do bone correspondente, senao a peca flutua.
            slots["EyeSlot_L"] = Child(Bone(CreatureSockets.EyeL), "EyeSlot_L");
            slots["EyeSlot_R"] = Child(Bone(CreatureSockets.EyeR), "EyeSlot_R");
            slots["HornSlot_L"] = Child(Bone(CreatureSockets.HornL), "HornSlot_L");
            slots["HornSlot_R"] = Child(Bone(CreatureSockets.HornR), "HornSlot_R");
            slots["BackSlot_L"] = Child(Bone(CreatureSockets.BackL), "BackSlot_L");
            slots["BackSlot_R"] = Child(Bone(CreatureSockets.BackR), "BackSlot_R");
            slots["CoreSlot"] = Child(Bone(CreatureSockets.Core), "CoreSlot");

            // Ancoras de contrato reservadas para pecas por membro (V2).
            slots["FrontLimbSlot_L"] = Child(Bone(CreatureSockets.FrontLimbL), "FrontLimbSlot_L");
            slots["FrontLimbSlot_R"] = Child(Bone(CreatureSockets.FrontLimbR), "FrontLimbSlot_R");
            slots["RearLimbSlot_L"] = Child(Bone(CreatureSockets.RearLimbL), "RearLimbSlot_L");
            slots["RearLimbSlot_R"] = Child(Bone(CreatureSockets.RearLimbR), "RearLimbSlot_R");

            if (auraRoot == null)
            {
                auraRoot = Child(visualRoot, "AuraRoot");
            }

            bodyRenderer = EnsureSkinned(bodySlot, "BodyMesh");
            headRenderer = EnsureSkinned(headSlot, "HeadMesh");
            limbsRenderer = EnsureSkinned(limbsSlot, "LimbsMesh");
            tailRenderer = EnsureSkinned(tailSlot, "TailMesh");

            eyeLeft = EnsureRigid(slots["EyeSlot_L"], "EyeMesh_L");
            eyeRight = EnsureRigid(slots["EyeSlot_R"], "EyeMesh_R");
            hornLeft = EnsureRigid(slots["HornSlot_L"], "HornMesh_L");
            hornRight = EnsureRigid(slots["HornSlot_R"], "HornMesh_R");
            backLeft = EnsureRigid(slots["BackSlot_L"], "BackMesh_L");
            backRight = EnsureRigid(slots["BackSlot_R"], "BackMesh_R");
            coreRenderer = EnsureRigid(slots["CoreSlot"], "CoreMesh");
            coreRim = EnsureRigid(slots["CoreSlot"], "CoreRim");

            eyeRight.transform.localScale = new Vector3(-1f, 1f, 1f);
            hornRight.transform.localScale = new Vector3(-1f, 1f, 1f);
            backRight.transform.localScale = new Vector3(-1f, 1f, 1f);

            EnsureAnimator();
            EnsureCollider();

            if (aura == null)
            {
                aura = auraRoot.gameObject.GetComponent<CreatureAuraController>();
                if (aura == null)
                {
                    aura = auraRoot.gameObject.AddComponent<CreatureAuraController>();
                }

                aura.Initialise(Bone(CreatureSockets.Core));
            }
        }

        /// <summary>Bone real do rig montado. O validador mede contra ele, nao contra a pose canonica.</summary>
        public Transform Bone(string name)
        {
            return CreatureRig.Find(bones, name);
        }

        public Transform Slot(string name)
        {
            return slots.TryGetValue(name, out var t) ? t : null;
        }

        static Transform Child(Transform parent, string name)
        {
            var existing = parent.Find(name);
            if (existing != null)
            {
                return existing;
            }

            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            return go.transform;
        }

        SkinnedMeshRenderer EnsureSkinned(Transform slot, string name)
        {
            var existing = slot.Find(name);
            GameObject go;
            if (existing != null)
            {
                go = existing.gameObject;
            }
            else
            {
                go = new GameObject(name);
                go.transform.SetParent(slot, false);
            }

            var renderer = go.GetComponent<SkinnedMeshRenderer>();
            if (renderer == null)
            {
                renderer = go.AddComponent<SkinnedMeshRenderer>();
            }

            renderer.bones = bones;
            renderer.rootBone = Bone(CreatureSockets.Body);
            renderer.updateWhenOffscreen = false;
            renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On;
            renderer.receiveShadows = true;
            renderer.sharedMaterial = CreatureMaterials.Get(CreatureMaterialProfile.Skin);
            return renderer;
        }

        MeshRenderer EnsureRigid(Transform slot, string name)
        {
            var existing = slot.Find(name);
            GameObject go;
            if (existing != null)
            {
                go = existing.gameObject;
            }
            else
            {
                go = new GameObject(name);
                go.transform.SetParent(slot, false);
            }

            var filter = go.GetComponent<MeshFilter>();
            if (filter == null)
            {
                filter = go.AddComponent<MeshFilter>();
            }

            var renderer = go.GetComponent<MeshRenderer>();
            if (renderer == null)
            {
                renderer = go.AddComponent<MeshRenderer>();
            }

            renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On;
            renderer.receiveShadows = true;
            renderer.sharedMaterial = CreatureMaterials.Get(CreatureMaterialProfile.Skin);
            return renderer;
        }

        void EnsureAnimator()
        {
            animator = gameObject.GetComponent<Animator>();
            if (animator == null)
            {
                animator = gameObject.AddComponent<Animator>();
            }

            // Movimento continua sendo do gameplay/rede, nunca da animacao.
            animator.applyRootMotion = false;
            // CreatureLod baixa isto para CullUpdateTransforms em mobs distantes.
            animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;

            var controller = database != null ? database.animatorController : null;
            controller ??= Resources.Load<RuntimeAnimatorController>("GENORYX/GenoryxCreatureAnimator");
            if (controller != null && animator.runtimeAnimatorController != controller)
            {
                animator.runtimeAnimatorController = controller;
            }
        }

        void EnsureCollider()
        {
            // Hitbox de gameplay: nunca derivada de genes visuais.
            var col = gameObject.GetComponent<CapsuleCollider>();
            if (col == null)
            {
                col = gameObject.AddComponent<CapsuleCollider>();
            }

            col.direction = 2;
            col.center = new Vector3(0f, 0.30f, -0.10f);
            col.height = 0.78f;
            col.radius = 0.26f;
        }

        // --------------------------------------------------------- APPLY DNA

        public void ApplyDNA(CreatureDNA source)
        {
            BuildStructure();
            dna = source ?? new CreatureDNA();

            SetBody(dna.BodyId);
            SetHead(dna.HeadId);
            SetLimbs(dna.LimbsId);
            SetTail(dna.TailId);
            SetEyes(dna.EyesId);
            SetHorns(dna.HornsId);
            SetBack(dna.BackId);
            SetCore(dna.CoreId);
            SetPattern(dna.PatternId);
            SetGrowthStage(dna.growthStage);
            RefreshColors();
            SetAura(dna.AuraId);
            ready = true;
        }

        /// <summary>
        /// Reassenta as pecas rigidas na pele do chassi atual.
        ///
        /// Os sockets sao contrato e ficam na pele do chassi NEUTRO. Uma cabeca de cranio
        /// alto levanta a pele acima do socket do chifre; uma de cranio baixo a abaixa. Como
        /// mover socket e proibido e alongar a peca deformaria o design, a peca desliza ao
        /// longo do proprio eixo ate pousar na pele da cabeca escolhida.
        /// </summary>
        void ReseatRigidParts()
        {
            var headId = dna.HeadId;
            System.Func<Vector3, float> head = p => CreatureChassisSurface.HeadClearance(headId, p);
            System.Func<Vector3, float> body = CreatureChassisSurface.BodyClearance;

            // Chifre desliza ao longo do proprio eixo de crescimento (+Y do socket), com a
            // base levemente cravada para nao aparecer costura na pele.
            Reseat("HornSlot_L", CreatureSockets.HornL, Vector3.up, head, -0.010f);
            Reseat("HornSlot_R", CreatureSockets.HornR, Vector3.up, head, -0.010f);

            // Olho e uma lente: fica com a maior parte submersa, so a cupula aparece.
            //
            // Cresce a partir do CENTRO DA CABECA, nao do eixo longitudinal do chassi. Com a
            // normal radial pura o olho escorregava para o flanco e a criatura ficava sem
            // cara em vista frontal; saindo do centro do cranio ele emerge na face.
            var skull = new Vector3(0f, CreatureChassisSpec.HeadY, CreatureChassisSpec.EyeZ - 0.120f);
            Reseat("EyeSlot_L", CreatureSockets.EyeL, Vector3.zero, head, -0.016f, false, skull);
            Reseat("EyeSlot_R", CreatureSockets.EyeR, Vector3.zero, head, -0.016f, false, skull);

            // Trait central (barbatana) monta so no socket esquerdo e vai para a linha do
            // dorso; os laterais ficam sobre cada flanco.
            var spine = CreatureMeshLab.BackIsCentered(dna.BackId);
            Reseat("BackSlot_L", CreatureSockets.BackL, spine ? Vector3.up : Vector3.zero, body, -0.010f, spine);
            Reseat("BackSlot_R", CreatureSockets.BackR, Vector3.zero, body, -0.010f);

            // A gema cresce em +X local do socket. Reassentar a origem na pele deixa a base
            // enterrada e a ponta de fora, que e a leitura de "cristal cravado na carne".
            Reseat("CoreSlot", CreatureSockets.Core, Vector3.right, body, 0f);
        }

        /// <summary>
        /// Desliza o slot ate a pele. <paramref name="localAxis"/> e o eixo de crescimento
        /// da peca no espaco do socket; Vector3.zero usa a normal radial da pele, que
        /// resolve o sinal sozinha e por isso serve para os dois lados do corpo.
        /// Com <paramref name="onSpine"/> a peca ainda vai para a linha central do dorso.
        /// </summary>
        void Reseat(string slotName, string bone, Vector3 localAxis,
            System.Func<Vector3, float> surface, float bias, bool onSpine = false,
            Vector3? radialCenter = null)
        {
            if (!slots.TryGetValue(slotName, out var slot) || slot == null)
            {
                return;
            }

            var socket = CreatureRig.RestWorld(bone);
            var rotation = CreatureRig.RestWorldRotation(bone);

            var origin = onSpine ? new Vector3(0f, socket.y, socket.z) : socket;
            Vector3 direction;
            if (localAxis != Vector3.zero)
            {
                direction = rotation * localAxis;
            }
            else if (radialCenter.HasValue)
            {
                direction = origin - radialCenter.Value;
            }
            else
            {
                direction = RadialOut(origin);
            }

            direction = direction.normalized;

            var target = origin + direction * CreatureChassisSurface.SurfaceLift(origin, direction, surface);

            // O deslocamento e uma distancia em escala ADULTA, e o slot herda a escala do
            // bone do socket (hornScale, backTraitScale...). Sem dividir, um chifre BABY
            // recebia um quarto do deslocamento e nascia enterrado. O bias fica fora da
            // divisao de proposito: ele deve encolher junto com a peca.
            var socketBone = Bone(bone);
            var socketScale = socketBone != null ? Mathf.Max(socketBone.localScale.x, 0.01f) : 1f;

            var inverse = Quaternion.Inverse(rotation);
            slot.localPosition = inverse * ((target - socket) / socketScale + direction * bias);
        }

        /// <summary>Normal aproximada da pele: radial a partir do eixo longitudinal do chassi.</summary>
        static Vector3 RadialOut(Vector3 authored)
        {
            CreatureMeshLab.BodySection(authored.z, out var center, out _, out _, out _);
            var radial = new Vector3(authored.x, authored.y - center.y, 0f);
            return radial.sqrMagnitude < 1e-8f ? Vector3.up : radial.normalized;
        }

        /// <summary>
        /// Resolve a malha de um slot. Asset autorado ganha da geracao procedural.
        /// Em LOD reduzido o procedural volta a valer, porque o asset fixo nao tem variantes.
        /// </summary>
        Mesh Resolve(CreatureSlot slot, string id, Mesh procedural)
        {
            if (detail < 0.999f)
            {
                return procedural;
            }

            var definition = database != null ? database.Find(id) : null;
            if (definition != null && definition.mesh != null && definition.slot == slot)
            {
                return definition.mesh;
            }

            return procedural;
        }

        public void SetBody(string id)
        {
            dna.SetExpressed(CreatureSlot.Body, id);
            var mesh = Resolve(CreatureSlot.Body, id, CreatureMeshLab.Body(id, detail));
            AssignSkinned(bodyRenderer, mesh, CreatureMaterials.Get(CreatureMaterialProfile.Skin));
            RefreshColors();
        }

        public void SetHead(string id)
        {
            dna.SetExpressed(CreatureSlot.Head, id);
            AssignSkinned(headRenderer, Resolve(CreatureSlot.Head, id, CreatureMeshLab.Head(id, detail)), CreatureMaterials.Get(CreatureMaterialProfile.Skin));

            // Trocar a cabeca muda a pele onde olhos e chifres pousam.
            ReseatRigidParts();
            RefreshColors();
        }

        public void SetLimbs(string id)
        {
            dna.SetExpressed(CreatureSlot.Limbs, id);
            AssignSkinned(limbsRenderer, Resolve(CreatureSlot.Limbs, id, CreatureMeshLab.Limbs(id, detail)), CreatureMaterials.Get(CreatureMaterials.ProfileFor(CreatureSlot.Limbs, id)));
            RefreshColors();
        }

        public void SetTail(string id)
        {
            dna.SetExpressed(CreatureSlot.Tail, id);
            AssignSkinned(tailRenderer, Resolve(CreatureSlot.Tail, id, CreatureMeshLab.Tail(id, detail)), CreatureMaterials.Get(CreatureMaterials.ProfileFor(CreatureSlot.Tail, id)));
            RefreshColors();
        }

        public void SetEyes(string id)
        {
            dna.SetExpressed(CreatureSlot.Eyes, id);
            var mesh = Resolve(CreatureSlot.Eyes, id, CreatureMeshLab.Eye(id, detail));
            var mat = CreatureMaterials.Get(CreatureMaterialProfile.Eye);
            AssignRigid(eyeLeft, mesh, mat);
            AssignRigid(eyeRight, mesh, mat);
            RefreshColors();
        }

        public void SetHorns(string id)
        {
            dna.SetExpressed(CreatureSlot.Horns, id);
            var mesh = Resolve(CreatureSlot.Horns, id, CreatureMeshLab.Horn(id, detail));
            var mat = CreatureMaterials.Get(CreatureMaterials.ProfileFor(CreatureSlot.Horns, id));
            AssignRigid(hornLeft, mesh, mat);
            AssignRigid(hornRight, mesh, mat);
            RefreshColors();
        }

        public void SetBack(string id)
        {
            dna.SetExpressed(CreatureSlot.Back, id);
            var mesh = Resolve(CreatureSlot.Back, id, CreatureMeshLab.BackTrait(id, detail));
            var mat = CreatureMaterials.Get(CreatureMaterials.ProfileFor(CreatureSlot.Back, id));
            AssignRigid(backLeft, mesh, mat);
            // Traits centrais renderizam so no socket esquerdo, com offset ja embutido no mesh.
            AssignRigid(backRight, CreatureMeshLab.BackIsCentered(id) ? null : mesh, mat);
            RefreshColors();
        }

        public void SetCore(string id)
        {
            dna.SetExpressed(CreatureSlot.Core, id);
            AssignRigid(coreRenderer, Resolve(CreatureSlot.Core, id, CreatureMeshLab.Core(id, detail)), CreatureMaterials.Get(CreatureMaterialProfile.CoreGem));
            AssignRigid(coreRim, CreatureMeshLab.CoreSocketRim(detail), CreatureMaterials.Get(CreatureMaterialProfile.Skin));
            dna.coreColorId = CreaturePalette.ElementColor(id);
            RefreshColors();
        }

        public void SetPattern(string id)
        {
            dna.SetExpressed(CreatureSlot.Pattern, id);
            RefreshColors();
        }

        public void SetAura(string id)
        {
            dna.SetExpressed(CreatureSlot.Aura, id);
            if (aura != null)
            {
                aura.Apply(id, CreaturePalette.Get(dna.coreColorId));
            }
        }

        public void SetPrimaryColor(string id)
        {
            dna.primaryColorId = id;
            RefreshColors();
        }

        public void SetSecondaryColor(string id)
        {
            dna.secondaryColorId = id;
            RefreshColors();
        }

        public void SetPatternColor(string id)
        {
            dna.patternColorId = id;
            RefreshColors();
        }

        public void SetEyeColor(string id)
        {
            dna.eyeColorId = id;
            RefreshColors();
        }

        public void SetCoreColor(string id)
        {
            dna.coreColorId = id;
            RefreshColors();
            if (aura != null)
            {
                aura.Apply(dna.AuraId, CreaturePalette.Get(id));
            }
        }

        public void SetGrowthStage(CreatureGrowthStage stage)
        {
            dna.growthStage = stage;
            var profile = CreatureGrowthProfile.For(stage);

            visualRoot.localScale = Vector3.one * profile.overallScale;

            SetBoneScale(CreatureSockets.Head, profile.headScale);
            SetBoneScale(CreatureSockets.EyeL, profile.eyeScale / Mathf.Max(profile.headScale, 0.01f));
            SetBoneScale(CreatureSockets.EyeR, profile.eyeScale / Mathf.Max(profile.headScale, 0.01f));
            SetBoneScale(CreatureSockets.HornL, profile.hornScale / Mathf.Max(profile.headScale, 0.01f));
            SetBoneScale(CreatureSockets.HornR, profile.hornScale / Mathf.Max(profile.headScale, 0.01f));
            SetBoneScale(CreatureSockets.TailRoot, profile.tailScale);
            SetBoneScale(CreatureSockets.BackL, profile.backTraitScale);
            SetBoneScale(CreatureSockets.BackR, profile.backTraitScale);
            SetBoneScale(CreatureSockets.Core, profile.coreScale);
            SetBoneScale(CreatureSockets.FrontLimbL, profile.limbScale);
            SetBoneScale(CreatureSockets.FrontLimbR, profile.limbScale);
            SetBoneScale(CreatureSockets.RearLimbL, profile.limbScale);
            SetBoneScale(CreatureSockets.RearLimbR, profile.limbScale);

            // O reassentamento depende da escala dos sockets, que acabou de mudar.
            ReseatRigidParts();

            var col = gameObject.GetComponent<CapsuleCollider>();
            if (col != null)
            {
                col.height = 0.78f * profile.overallScale;
                col.radius = 0.26f * profile.overallScale;
                col.center = new Vector3(0f, 0.30f * profile.overallScale, -0.10f * profile.overallScale);
            }
        }

        void SetBoneScale(string bone, float scale)
        {
            var t = Bone(bone);
            if (t != null)
            {
                t.localScale = Vector3.one * scale;
            }
        }

        /// <summary>
        /// Bounds de repouso + folga para deformacao. Mantem renderer.bounds util
        /// tanto para culling quanto para as validacoes estruturais.
        /// </summary>
        static void AssignSkinned(SkinnedMeshRenderer renderer, Mesh mesh, Material material)
        {
            renderer.sharedMesh = mesh;
            renderer.sharedMaterial = material;
            renderer.enabled = mesh != null;
            if (mesh != null)
            {
                var bounds = mesh.bounds;
                bounds.Expand(0.22f);
                renderer.localBounds = bounds;
            }
        }

        void AssignRigid(MeshRenderer renderer, Mesh mesh, Material material)
        {
            if (renderer == null)
            {
                return;
            }

            var filter = renderer.GetComponent<MeshFilter>();
            filter.sharedMesh = mesh;
            renderer.sharedMaterial = material;
            renderer.enabled = mesh != null;
        }

        // ---------------------------------------------------------- COLORING

        public void RefreshColors()
        {
            if (bodyRenderer == null)
            {
                return;
            }

            block ??= new MaterialPropertyBlock();

            var primary = CreaturePalette.Get(dna.primaryColorId);
            var secondary = CreaturePalette.Get(dna.secondaryColorId);
            var patternColor = CreaturePalette.Get(dna.patternColorId);
            var coreColor = CreaturePalette.Get(dna.coreColorId);
            var eyeColor = CreaturePalette.Get(dna.eyeColorId);
            var patternMode = CreatureMaterials.PatternIndex(dna.PatternId);
            var glowingPattern = dna.PatternId is "PATTERN_CRACKS" or "PATTERN_GENESIS" or "PATTERN_VEINS";

            ApplySkin(bodyRenderer, primary, secondary, patternColor, patternMode, glowingPattern, coreColor);
            ApplySkin(headRenderer, primary, secondary, patternColor, patternMode, glowingPattern, coreColor);
            ApplySkin(limbsRenderer, primary, secondary, patternColor, patternMode, glowingPattern, coreColor);
            ApplySkin(tailRenderer, primary, secondary, patternColor, patternMode, glowingPattern, coreColor);

            var hornCrystal = CreatureMaterials.ProfileFor(CreatureSlot.Horns, dna.HornsId) == CreatureMaterialProfile.Crystal;
            var hornBase = HornColor(dna.HornsId, secondary);
            ApplyRigidColor(hornLeft, hornBase, hornBase, hornCrystal ? coreColor : Color.black, hornCrystal ? 1.6f : 0f, hornCrystal ? 2 : 0);
            ApplyRigidColor(hornRight, hornBase, hornBase, hornCrystal ? coreColor : Color.black, hornCrystal ? 1.6f : 0f, hornCrystal ? 2 : 0);

            var backCrystal = CreatureMaterials.ProfileFor(CreatureSlot.Back, dna.BackId) == CreatureMaterialProfile.Crystal;
            var backBase = BackColor(dna.BackId, secondary, primary);
            ApplyRigidColor(backLeft, backBase, backBase, backCrystal ? coreColor : Color.black, backCrystal ? 1.8f : 0f, backCrystal ? 2 : 0);
            ApplyRigidColor(backRight, backBase, backBase, backCrystal ? coreColor : Color.black, backCrystal ? 1.8f : 0f, backCrystal ? 2 : 0);

            ApplyRigidColor(eyeLeft, eyeColor * 0.35f, Color.black, eyeColor, 2.6f, 2);
            ApplyRigidColor(eyeRight, eyeColor * 0.35f, Color.black, eyeColor, 2.6f, 2);

            var coreIntensity = CreatureCoreDefinition.IntensityFor(dna.CoreId);
            if (dna.HasMutation(CreatureMutations.EmberCoreOvercharge))
            {
                coreIntensity *= 1.8f;
            }

            ApplyRigidColor(coreRenderer, coreColor * 0.4f, coreColor * 0.2f, coreColor, coreIntensity, 2);
            var rimColor = Color.Lerp(primary, Color.black, 0.55f);
            ApplyRigidColor(coreRim, rimColor, rimColor, Color.black, 0f, 0);
        }

        void ApplySkin(Renderer renderer, Color primary, Color secondary, Color pattern, int mode, bool glow, Color glowColor)
        {
            if (renderer == null)
            {
                return;
            }

            renderer.GetPropertyBlock(block);
            block.SetColor("_PrimaryColor", primary);
            block.SetColor("_SecondaryColor", secondary);
            block.SetColor("_PatternColor", pattern);
            block.SetFloat("_PatternMode", mode);
            block.SetFloat("_PatternScale", 1f);
            block.SetFloat("_PatternStrength", mode == 0 ? 0f : 1f);
            block.SetColor("_EmissionColor", glow ? glowColor : Color.black);

            // 1.35 e o teto para a pele: acima disso as rachaduras estouram em bloom
            // e a cor primaria desaparece. O brilho forte fica reservado ao Core e aos olhos.
            block.SetFloat("_EmissionIntensity", glow ? 1.35f : 0f);
            block.SetFloat("_EmissionMask", glow ? 1f : 0f);
            renderer.SetPropertyBlock(block);
        }

        void ApplyRigidColor(Renderer renderer, Color primary, Color secondary, Color emission, float intensity, int emissionMode)
        {
            if (renderer == null)
            {
                return;
            }

            renderer.GetPropertyBlock(block);
            block.SetColor("_PrimaryColor", primary);
            block.SetColor("_SecondaryColor", secondary);
            block.SetColor("_PatternColor", primary);
            block.SetFloat("_PatternMode", 0f);
            block.SetFloat("_PatternStrength", 0f);
            block.SetColor("_EmissionColor", emission);
            block.SetFloat("_EmissionIntensity", intensity);
            block.SetFloat("_EmissionMask", emissionMode);
            renderer.SetPropertyBlock(block);
        }

        static Color HornColor(string hornsId, Color fallback)
        {
            return hornsId switch
            {
                "HORNS_01_BONE" => CreaturePalette.Get("bone"),
                "HORNS_02_DARK" => CreaturePalette.Get("charcoal"),
                "HORNS_03_CRYSTAL" => CreaturePalette.Get("pale_ice"),
                "HORNS_04_INFERNAL" => CreaturePalette.Get("magma"),
                "HORNS_05_VOID_CRYSTAL" => CreaturePalette.Get("void_purple"),
                _ => fallback
            };
        }

        static Color BackColor(string backId, Color secondary, Color primary)
        {
            return backId switch
            {
                "BACK_04_CRYSTAL_SPINES" => CreaturePalette.Get("pale_ice"),

                // Armadura puxa a cor secundaria da criatura. Steel fixo dava uma peca
                // cinza-clara berrante em cima de um corpo charcoal no preset Ember.
                "BACK_05_ARMORED_SPINES" => Color.Lerp(CreaturePalette.Get("steel"), secondary, 0.62f),
                "BACK_03_FIN" => Color.Lerp(primary, secondary, 0.5f),
                _ => secondary
            };
        }

        // ------------------------------------------------------------ DEBUG

        void OnDrawGizmos()
        {
            if (!debugSockets || bones == null)
            {
                return;
            }

            CreatureSocketGizmos.Draw(bones);
        }

        public int RendererCount()
        {
            return visualRoot == null ? 0 : visualRoot.GetComponentsInChildren<Renderer>(true).Length;
        }

        public int SkinnedRendererCount()
        {
            return visualRoot == null ? 0 : visualRoot.GetComponentsInChildren<SkinnedMeshRenderer>(true).Length;
        }
    }
}
