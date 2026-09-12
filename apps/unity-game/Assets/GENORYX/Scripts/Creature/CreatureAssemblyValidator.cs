using System.Collections.Generic;
using System.Text;
using UnityEngine;

namespace Genoryx.Creatures
{
    public struct CreatureValidationResult
    {
        public bool ok;
        public List<string> failures;
        public int rendererCount;
        public int skinnedCount;
        public int skeletonCount;
        public int animatorCount;

        public string Summary(string label)
        {
            if (ok)
            {
                return "OK " + label + " renderers=" + rendererCount + " skinned=" + skinnedCount;
            }

            var sb = new StringBuilder();
            sb.Append("FAIL ").Append(label);
            for (var i = 0; i < failures.Count; i++)
            {
                sb.Append(" | ").Append(failures[i]);
            }

            return sb.ToString();
        }
    }

    /// <summary>
    /// Checagens estruturais exigidas pelo criterio de aceite.
    /// Roda sobre a criatura montada, sem depender de inspecao visual.
    /// </summary>
    public static class CreatureAssemblyValidator
    {
        public static CreatureValidationResult Validate(CreatureAssembler assembler)
        {
            var result = new CreatureValidationResult { ok = true, failures = new List<string>() };
            if (assembler == null)
            {
                Fail(ref result, "assembler ausente");
                return result;
            }

            var root = assembler.transform;
            var dna = assembler.dna;

            // --- skeleton unico
            var skeletons = 0;
            foreach (var t in root.GetComponentsInChildren<Transform>(true))
            {
                if (t.name == CreatureSockets.Root)
                {
                    skeletons++;
                }
            }

            result.skeletonCount = skeletons;
            if (skeletons != 1)
            {
                Fail(ref result, "skeleton duplicado: " + skeletons);
            }

            // --- animator unico e valido
            var animators = root.GetComponentsInChildren<Animator>(true);
            result.animatorCount = animators.Length;
            if (animators.Length != 1)
            {
                Fail(ref result, "animator count=" + animators.Length);
            }
            else if (animators[0].runtimeAnimatorController == null)
            {
                Fail(ref result, "animator sem controller");
            }

            var renderers = root.GetComponentsInChildren<Renderer>(true);
            result.rendererCount = renderers.Length;
            result.skinnedCount = root.GetComponentsInChildren<SkinnedMeshRenderer>(true).Length;

            if (result.skinnedCount != 4)
            {
                Fail(ref result, "skinned renderers=" + result.skinnedCount + " (esperado 4)");
            }

            // --- pecas obrigatorias presentes
            var body = Skinned(assembler, "BodySlot", "BodyMesh");
            var head = Skinned(assembler, "HeadSlot", "HeadMesh");
            var limbs = Skinned(assembler, "LimbsSlot", "LimbsMesh");
            var tail = Skinned(assembler, "TailSlot", "TailMesh");

            RequireMesh(ref result, body, "BodyMesh");
            RequireMesh(ref result, head, "HeadMesh");
            RequireMesh(ref result, limbs, "LimbsMesh");
            RequireMesh(ref result, tail, "TailMesh");

            if (body == null || head == null || limbs == null || tail == null)
            {
                return result;
            }

            // Malhas skinadas sao autoradas em espaco do root: bounds de repouso sao exatas.
            var bodyBounds = body.sharedMesh.bounds;
            var headBounds = head.sharedMesh.bounds;
            var tailBounds = tail.sharedMesh.bounds;
            var limbBounds = limbs.sharedMesh.bounds;

            if (!bodyBounds.Intersects(headBounds))
            {
                Fail(ref result, "head flutuando (sem sobreposicao com o corpo)");
            }

            if (!bodyBounds.Intersects(tailBounds))
            {
                Fail(ref result, "tail desconectada do corpo");
            }

            if (!bodyBounds.Intersects(limbBounds))
            {
                Fail(ref result, "membros desconectados do corpo");
            }

            // --- pernas nas quatro extremidades, pes proximos do chao
            if (limbBounds.min.y > 0.06f)
            {
                Fail(ref result, "pes nao alcancam o solo: minY=" + limbBounds.min.y.ToString("F3"));
            }

            var expectedLegs = new[]
            {
                (CreatureSockets.FrontLimbL, -CreatureChassisSpec.FrontLimbX, CreatureChassisSpec.FrontLimbZ),
                (CreatureSockets.FrontLimbR, CreatureChassisSpec.FrontLimbX, CreatureChassisSpec.FrontLimbZ),
                (CreatureSockets.RearLimbL, -CreatureChassisSpec.RearLimbX, CreatureChassisSpec.RearLimbZ),
                (CreatureSockets.RearLimbR, CreatureChassisSpec.RearLimbX, CreatureChassisSpec.RearLimbZ)
            };

            foreach (var (bone, x, z) in expectedLegs)
            {
                var rest = CreatureRig.RestWorld(bone);
                if (Mathf.Abs(rest.x - x) > 0.001f || Mathf.Abs(rest.z - z) > 0.001f)
                {
                    Fail(ref result, "perna deslocada no rig: " + bone);
                }
            }

            // --- head no lugar certo: centro dentro da zona da cabeca
            var headSocket = CreatureRig.RestWorld(CreatureSockets.Head);
            if (Vector3.Distance(headBounds.center, headSocket) > 0.30f)
            {
                Fail(ref result, "head fora da zona: dist=" + Vector3.Distance(headBounds.center, headSocket).ToString("F3"));
            }

            // --- pecas rigidas
            //
            // Todas as medidas abaixo usam a POSICAO REAL do bone e a SUPERFICIE REAL da malha.
            // Comparar contra a pose de repouso canonica quebrava em Baby/Juvenile, porque o
            // growth escala as pecas mas nao o root; e testar contra AABB reprovava chifre
            // que protubera corretamente, porque o AABB do corpo engole a cabeca inteira.
            System.Func<Vector3, float> bodySurface = CreatureChassisSurface.BodyClearance;
            System.Func<Vector3, float> headSurface = p => CreatureChassisSurface.HeadClearance(dna.HeadId, p);

            ValidateRigid(ref result, assembler, "HornSlot_L", "HornMesh_L", dna.HornsId, CreatureParts.HornsNone,
                CreatureSockets.HornL, CreatureSockets.Head, headSurface, 0.005f);
            ValidateRigid(ref result, assembler, "HornSlot_R", "HornMesh_R", dna.HornsId, CreatureParts.HornsNone,
                CreatureSockets.HornR, CreatureSockets.Head, headSurface, 0.005f);

            ValidateRigid(ref result, assembler, "EyeSlot_L", "EyeMesh_L", dna.EyesId, null,
                CreatureSockets.EyeL, CreatureSockets.Head, headSurface, 0.004f);
            ValidateRigid(ref result, assembler, "EyeSlot_R", "EyeMesh_R", dna.EyesId, null,
                CreatureSockets.EyeR, CreatureSockets.Head, headSurface, 0.004f);

            ValidateRigid(ref result, assembler, "BackSlot_L", "BackMesh_L", dna.BackId, CreatureParts.BackNone,
                CreatureSockets.BackL, CreatureSockets.Body, bodySurface, 0.005f);

            // Core precisa estar ANCORADO na carne: gema cravada, nao icone flutuando.
            var coreRenderer = Rigid(assembler, "CoreSlot", "CoreMesh");
            var coreBone = assembler.Bone(CreatureSockets.Core);
            var bodyBone = assembler.Bone(CreatureSockets.Body);

            if (coreRenderer == null || !coreRenderer.enabled)
            {
                Fail(ref result, "Core ausente");
            }
            else if (coreBone == null || bodyBone == null)
            {
                Fail(ref result, "Core sem referencia de corpo");
            }
            else
            {
                var mesh = RigidMesh(coreRenderer);
                var toAuthored = CreatureChassisSurface.ToAuthored(bodyBone, coreRenderer.transform, CreatureSockets.Body);
                var coreCenter = toAuthored.MultiplyPoint3x4(mesh.bounds.center);

                // Cravado: o centro da gema fica DENTRO da carne, so as facetas saem.
                var clearance = CreatureChassisSurface.BodyClearance(coreCenter);
                if (clearance > 0.012f)
                {
                    Fail(ref result, "Core solto fora do corpo: folga=" + clearance.ToString("F3"));
                }

                // Cravado nao pode virar engolido: a ponta ainda precisa emergir.
                var emerges = CreatureChassisSurface.MaxProtrusion(mesh, toAuthored, bodySurface);
                if (emerges < 0.008f)
                {
                    Fail(ref result, "Core engolido pelo corpo: protrusao=" + emerges.ToString("F4"));
                }

                var socket = CreatureRig.RestWorld(CreatureSockets.Core);
                if (Vector3.Distance(coreCenter, socket) > 0.10f)
                {
                    Fail(ref result, "Core fora do socket: dist="
                                     + Vector3.Distance(coreCenter, socket).ToString("F3"));
                }
            }

            // --- aura nunca baked no mesh
            var auraRoot = root.Find("CreatureVisualRoot/AuraRoot");
            if (auraRoot == null)
            {
                Fail(ref result, "AuraRoot ausente");
            }

            return result;
        }

        /// <summary>
        /// Uma peca rigida esta correta quando:
        ///   1. o renderer existe e reflete o ID do DNA (inclusive o caso NONE);
        ///   2. esta ancorada no bone do proprio socket, medido no bone real;
        ///   3. protubera da superficie do chassi pelo menos <paramref name="minProtrusion"/>.
        /// </summary>
        static void ValidateRigid(ref CreatureValidationResult result, CreatureAssembler assembler, string slot,
            string meshName, string partId, string noneId, string socketBone, string surfaceBone,
            System.Func<Vector3, float> surface, float minProtrusion)
        {
            var renderer = Rigid(assembler, slot, meshName);
            var isNone = noneId != null && partId == noneId;

            if (renderer == null)
            {
                Fail(ref result, slot + " sem renderer");
                return;
            }

            if (isNone)
            {
                if (renderer.enabled)
                {
                    Fail(ref result, slot + " deveria estar vazio para " + partId);
                }

                return;
            }

            if (!renderer.enabled)
            {
                Fail(ref result, slot + " peca ausente: " + partId);
                return;
            }

            var mesh = RigidMesh(renderer);
            if (mesh == null)
            {
                Fail(ref result, slot + " sem mesh: " + partId);
                return;
            }

            var bone = assembler.Bone(socketBone);
            var reference = assembler.Bone(surfaceBone);
            if (bone == null || reference == null)
            {
                Fail(ref result, slot + " bone ausente: " + socketBone);
                return;
            }

            // A peca precisa NASCER no socket. Medir isso pelo centro dos bounds pune
            // geometria alongada — um chifre comprido tem centro naturalmente longe do
            // socket sem estar desancorado. O que denuncia peca autorada no espaco errado
            // e nao haver NENHUM vertice perto do socket.
            // Medido em MUNDO e normalizado pela escala da criatura. O espaco local do
            // socket descarta a escala do bone, entao um chifre BABY aparecia deslocado
            // 20cm quando fisicamente estava a 4cm da pele.
            var toWorld = renderer.transform.localToWorldMatrix;
            var socketWorld = bone.position;
            var scale = Mathf.Max(assembler.VisualRoot.lossyScale.x, 0.01f);


            var anchor = float.PositiveInfinity;
            var vertices = mesh.vertices;
            for (var i = 0; i < vertices.Length; i++)
            {
                var d = Vector3.Distance(toWorld.MultiplyPoint3x4(vertices[i]), socketWorld);
                anchor = Mathf.Min(anchor, d / scale);
            }

            // Trait dorsal central monta no socket esquerdo mas nasce na linha do dorso,
            // a BackX de distancia. Isso e design, nao peca solta.
            var allowed = socketBone == CreatureSockets.BackL && CreatureMeshLab.BackIsCentered(partId)
                ? CreatureChassisSpec.BackX + 0.06f
                : 0.08f;

            if (anchor > allowed)
            {
                Fail(ref result, slot + " desancorada do socket: dist=" + anchor.ToString("F3")
                                 + " limite=" + allowed.ToString("F3"));
            }

            if (surface != null)
            {
                var toAuthored = CreatureChassisSurface.ToAuthored(reference, renderer.transform, surfaceBone);
                var protrusion = CreatureChassisSurface.MaxProtrusion(mesh, toAuthored, surface);
                if (protrusion < minProtrusion)
                {
                    Fail(ref result, slot + " submersa no corpo: " + partId
                                     + " protrusao=" + protrusion.ToString("F4"));
                }
            }
        }

        static Mesh RigidMesh(MeshRenderer renderer)
        {
            var filter = renderer.GetComponent<MeshFilter>();
            return filter != null ? filter.sharedMesh : null;
        }

        static SkinnedMeshRenderer Skinned(CreatureAssembler assembler, string slot, string meshName)
        {
            var t = assembler.Slot(slot);
            var child = t != null ? t.Find(meshName) : null;
            return child != null ? child.GetComponent<SkinnedMeshRenderer>() : null;
        }

        static MeshRenderer Rigid(CreatureAssembler assembler, string slot, string meshName)
        {
            var t = assembler.Slot(slot);
            var child = t != null ? t.Find(meshName) : null;
            return child != null ? child.GetComponent<MeshRenderer>() : null;
        }

        static void RequireMesh(ref CreatureValidationResult result, SkinnedMeshRenderer renderer, string label)
        {
            if (renderer == null)
            {
                Fail(ref result, label + " renderer ausente");
                return;
            }

            if (renderer.sharedMesh == null)
            {
                Fail(ref result, label + " sem mesh");
                return;
            }

            if (!renderer.enabled)
            {
                Fail(ref result, label + " desabilitado");
                return;
            }

            if (renderer.bones == null || renderer.bones.Length != CreatureSockets.BoneCount)
            {
                Fail(ref result, label + " bones=" + (renderer.bones?.Length ?? 0));
            }

            if (renderer.sharedMesh.bindposes == null || renderer.sharedMesh.bindposes.Length != CreatureSockets.BoneCount)
            {
                Fail(ref result, label + " bindposes invalidas");
            }
        }

        static Bounds TransformBounds(Bounds local, Transform t)
        {
            var center = t.TransformPoint(local.center);
            var extents = local.extents;
            var axisX = t.TransformVector(extents.x, 0f, 0f);
            var axisY = t.TransformVector(0f, extents.y, 0f);
            var axisZ = t.TransformVector(0f, 0f, extents.z);
            var size = new Vector3(
                Mathf.Abs(axisX.x) + Mathf.Abs(axisY.x) + Mathf.Abs(axisZ.x),
                Mathf.Abs(axisX.y) + Mathf.Abs(axisY.y) + Mathf.Abs(axisZ.y),
                Mathf.Abs(axisX.z) + Mathf.Abs(axisY.z) + Mathf.Abs(axisZ.z));
            return new Bounds(center, size * 2f);
        }

        static void Fail(ref CreatureValidationResult result, string message)
        {
            result.ok = false;
            result.failures.Add(message);
        }
    }
}
