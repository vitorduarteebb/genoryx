using System.Collections.Generic;
using System.Text;
using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Suite automatica exigida pelo criterio de aceite:
    /// montagem em massa, deformacao real de animacao e ausencia de vazamento em swaps.
    /// </summary>
    public static class CreatureTestSuite
    {
        public struct CountSnapshot
        {
            public int gameObjects;
            public int animators;
            public int skeletons;
            public int renderers;
            public int skinned;
            public int materials;
            public int meshesCached;

            public override string ToString()
            {
                return "go=" + gameObjects + " anim=" + animators + " skel=" + skeletons +
                       " rend=" + renderers + " skin=" + skinned + " mat=" + materials + " meshCache=" + meshesCached;
            }

            public bool SameAs(CountSnapshot other)
            {
                return gameObjects == other.gameObjects
                       && animators == other.animators
                       && skeletons == other.skeletons
                       && renderers == other.renderers
                       && skinned == other.skinned
                       && materials == other.materials;
            }
        }

        public static CountSnapshot Snapshot(GameObject root)
        {
            var snapshot = new CountSnapshot();
            var all = root.GetComponentsInChildren<Transform>(true);
            snapshot.gameObjects = all.Length;
            snapshot.animators = root.GetComponentsInChildren<Animator>(true).Length;
            snapshot.renderers = root.GetComponentsInChildren<Renderer>(true).Length;
            snapshot.skinned = root.GetComponentsInChildren<SkinnedMeshRenderer>(true).Length;
            snapshot.materials = CreatureMaterials.SharedMaterialCount;
            snapshot.meshesCached = CreatureMeshLab.CachedMeshCount;

            for (var i = 0; i < all.Length; i++)
            {
                if (all[i].name == CreatureSockets.Root)
                {
                    snapshot.skeletons++;
                }
            }

            return snapshot;
        }

        /// <summary>Gera N criaturas aleatorias, valida cada uma e destroi.</summary>
        /// <summary>
        /// Toda malha fechada precisa ter as normais para FORA.
        ///
        /// Uma peca com winding invertido some inteira no backface culling: o renderer fica
        /// ligado, o mesh tem vertices, a protrusao mede certo e mesmo assim nao ha nada na
        /// tela. Foi o que aconteceu com a gema do Genesis Core, e inspecao visual nao
        /// distingue esse caso de "peca escondida atras do corpo".
        ///
        /// O volume assinado (soma de dot(a, cross(b,c))/6) e negativo exatamente quando a
        /// orientacao esta invertida. Peca aberta, como barbatana, da volume perto de zero
        /// e por isso so um volume claramente negativo reprova.
        /// </summary>
        public static string RunMeshOrientation()
        {
            var failures = new List<string>();

            void Check(string label, Mesh mesh)
            {
                if (mesh == null)
                {
                    return;
                }

                var vertices = mesh.vertices;
                var triangles = mesh.triangles;
                var volume = 0.0;

                for (var i = 0; i < triangles.Length; i += 3)
                {
                    var a = vertices[triangles[i]];
                    var b = vertices[triangles[i + 1]];
                    var c = vertices[triangles[i + 2]];
                    volume += Vector3.Dot(a, Vector3.Cross(b, c)) / 6.0;
                }

                // O limiar escala com o tamanho da peca: uma gema de 7 cm tem volume da
                // ordem de 1e-4 m3, entao um corte fixo em 1e-6 nao serviria para o corpo.
                var size = mesh.bounds.size;
                var scale = Mathf.Max(size.x * size.y * size.z, 1e-9f);
                if (volume < -scale * 0.05f)
                {
                    failures.Add(label + " winding invertido (vol=" + volume.ToString("E2") + ")");
                }
            }

            foreach (var id in CreatureParts.Cores)
            {
                Check("core " + id, CreatureMeshLab.Core(id));
            }

            foreach (var id in CreatureParts.Horns)
            {
                Check("horn " + id, CreatureMeshLab.Horn(id));
            }

            foreach (var id in CreatureParts.Eyes)
            {
                Check("eye " + id, CreatureMeshLab.Eye(id));
            }

            foreach (var id in CreatureParts.Backs)
            {
                Check("back " + id, CreatureMeshLab.BackTrait(id));
            }

            foreach (var id in CreatureParts.Heads)
            {
                Check("head " + id, CreatureMeshLab.Head(id));
            }

            foreach (var id in CreatureParts.Tails)
            {
                Check("tail " + id, CreatureMeshLab.Tail(id));
            }

            foreach (var id in CreatureParts.Limbs)
            {
                Check("limbs " + id, CreatureMeshLab.Limbs(id));
            }

            foreach (var id in CreatureParts.Bodies)
            {
                Check("body " + id, CreatureMeshLab.Body(id));
            }

            return failures.Count == 0
                ? "PASS MESH_ORIENTATION todas as malhas com normais para fora"
                : "FAIL MESH_ORIENTATION " + string.Join(" | ", failures);
        }

        /// <summary>
        /// A malha que entra em cena precisa ser a que o CreatureMeshLab gera AGORA.
        ///
        /// As pecas sao baked em .asset e o assembler prefere o asset, o que e correto para
        /// o pipeline de arte. O risco e o asset congelar numa versao antiga: a cena mostra
        /// um corpo, o codigo raciocina sobre outro, e as pecas rigidas afundam sem que
        /// nenhum teste de montagem reclame, porque todos leem o perfil e nao a malha.
        /// </summary>
        public static string RunBakedMeshFreshness()
        {
            var dna = CreaturePresets.EmberDna();
            var go = CreatureAssembler.Spawn("FreshnessCheck", Vector3.zero, dna);
            var failures = new List<string>();

            var expected = new Dictionary<string, Mesh>
            {
                { "BodyMesh", CreatureMeshLab.Body(dna.BodyId) },
                { "HeadMesh", CreatureMeshLab.Head(dna.HeadId) },
                { "LimbsMesh", CreatureMeshLab.Limbs(dna.LimbsId) },
                { "TailMesh", CreatureMeshLab.Tail(dna.TailId) },
                { "EyeMesh_L", CreatureMeshLab.Eye(dna.EyesId) },
                { "HornMesh_L", CreatureMeshLab.Horn(dna.HornsId) },
                { "BackMesh_L", CreatureMeshLab.BackTrait(dna.BackId) },
                { "CoreMesh", CreatureMeshLab.Core(dna.CoreId) }
            };

            foreach (var renderer in go.GetComponentsInChildren<Renderer>(true))
            {
                if (!expected.TryGetValue(renderer.name, out var reference) || reference == null)
                {
                    continue;
                }

                Mesh actual = null;
                if (renderer is SkinnedMeshRenderer skinned)
                {
                    actual = skinned.sharedMesh;
                }
                else if (renderer.TryGetComponent<MeshFilter>(out var filter))
                {
                    actual = filter.sharedMesh;
                }

                if (actual == null)
                {
                    failures.Add(renderer.name + " sem malha");
                    continue;
                }

                if (actual.vertexCount != reference.vertexCount)
                {
                    failures.Add(renderer.name + " verts=" + actual.vertexCount + " esperado=" + reference.vertexCount);
                    continue;
                }

                var drift = Vector3.Distance(actual.bounds.size, reference.bounds.size);
                if (drift > 0.004f)
                {
                    failures.Add(renderer.name + " bounds=" + actual.bounds.size.ToString("F3")
                                 + " esperado=" + reference.bounds.size.ToString("F3"));
                }
            }

            Destroy(go);

            return failures.Count == 0
                ? "PASS BAKED_MESH_FRESHNESS assets batem com o gerador"
                : "FAIL BAKED_MESH_FRESHNESS " + string.Join(" | ", failures);
        }

        public static string RunGeneration(int count, int seedBase, bool keepAlive, List<GameObject> spawned = null)
        {
            var failures = new List<string>();
            var maxRenderers = 0;
            var maxSkinned = 0;

            for (var i = 0; i < count; i++)
            {
                var dna = CreatureRandom.Generate(seedBase + i);
                var go = CreatureAssembler.Spawn("TestCreature_" + i, Vector3.zero, dna);
                var assembler = go.GetComponent<CreatureAssembler>();

                var result = CreatureAssemblyValidator.Validate(assembler);
                maxRenderers = Mathf.Max(maxRenderers, result.rendererCount);
                maxSkinned = Mathf.Max(maxSkinned, result.skinnedCount);

                if (!result.ok)
                {
                    failures.Add("#" + i + " " + dna.VisualSignature() + " -> " + result.Summary("creature"));
                }

                if (keepAlive && spawned != null)
                {
                    spawned.Add(go);
                }
                else
                {
                    Destroy(go);
                }
            }

            var sb = new StringBuilder();
            sb.Append("GENERATION count=").Append(count)
              .Append(" pass=").Append(count - failures.Count)
              .Append(" fail=").Append(failures.Count)
              .Append(" maxRenderers=").Append(maxRenderers)
              .Append(" skinnedPerCreature=").Append(maxSkinned);

            for (var i = 0; i < failures.Count && i < 12; i++)
            {
                sb.Append('\n').Append("  ").Append(failures[i]);
            }

            return sb.ToString();
        }

        /// <summary>
        /// Troca todos os slots N vezes na MESMA criatura e compara contagens.
        /// Detecta duplicacao de renderer, skeleton, Animator, Material ou GameObject.
        /// </summary>
        public static string RunSwapStress(int swaps, int seed)
        {
            var go = CreatureAssembler.Spawn("StressCreature", Vector3.zero, CreaturePresets.EmberDna());
            var assembler = go.GetComponent<CreatureAssembler>();
            var before = Snapshot(go);

            var rng = new System.Random(seed);
            var signatures = new HashSet<string>();

            for (var i = 0; i < swaps; i++)
            {
                assembler.SetHead(Pick(rng, CreatureParts.Heads));
                assembler.SetEyes(Pick(rng, CreatureParts.Eyes));
                assembler.SetHorns(Pick(rng, CreatureParts.Horns));
                assembler.SetLimbs(Pick(rng, CreatureParts.Limbs));
                assembler.SetTail(Pick(rng, CreatureParts.Tails));
                assembler.SetBack(Pick(rng, CreatureParts.Backs));
                assembler.SetCore(Pick(rng, CreatureParts.Cores));
                assembler.SetPattern(Pick(rng, CreatureParts.Patterns));
                assembler.SetAura(Pick(rng, CreatureParts.Auras));
                assembler.SetPrimaryColor(Pick(rng, CreaturePalette.BodyColorIds));
                assembler.SetSecondaryColor(Pick(rng, CreaturePalette.AccentColorIds));
                assembler.SetPatternColor(Pick(rng, CreaturePalette.EmissiveColorIds));
                assembler.SetEyeColor(Pick(rng, CreaturePalette.EmissiveColorIds));
                assembler.SetGrowthStage((CreatureGrowthStage)rng.Next(0, 3));
                signatures.Add(assembler.dna.VisualSignature());
            }

            var after = Snapshot(go);
            var validation = CreatureAssemblyValidator.Validate(assembler);
            Destroy(go);

            var leaked = !before.SameAs(after);
            var sb = new StringBuilder();
            sb.Append(leaked || !validation.ok ? "FAIL" : "OK")
              .Append(" SWAP_STRESS swaps=").Append(swaps)
              .Append(" distinctVisuals=").Append(signatures.Count)
              .Append("\n  before: ").Append(before)
              .Append("\n  after : ").Append(after);

            if (leaked)
            {
                sb.Append("\n  LEAK detectado: contagens divergiram");
            }

            if (!validation.ok)
            {
                sb.Append("\n  ").Append(validation.Summary("post-stress"));
            }

            return sb.ToString();
        }

        /// <summary>
        /// Prova que a animacao DEFORMA a malha, nao apenas existe no arquivo.
        /// Compara vertices bakeados em dois instantes do clipe.
        /// </summary>
        public static string RunAnimationDeformation(CreatureDNA dna, params CreatureClip[] clips)
        {
            var go = CreatureAssembler.Spawn("AnimCheck", Vector3.zero, dna);
            var assembler = go.GetComponent<CreatureAssembler>();
            var animator = assembler.Animator;
            var sb = new StringBuilder();

            if (animator == null || animator.runtimeAnimatorController == null)
            {
                Destroy(go);
                return "FAIL ANIMATION sem AnimatorController";
            }

            var bodySlot = assembler.Slot("BodySlot");
            var limbsSlot = assembler.Slot("LimbsSlot");
            var tailSlot = assembler.Slot("TailSlot");
            var body = bodySlot != null ? bodySlot.Find("BodyMesh")?.GetComponent<SkinnedMeshRenderer>() : null;
            var limbs = limbsSlot != null ? limbsSlot.Find("LimbsMesh")?.GetComponent<SkinnedMeshRenderer>() : null;
            var tail = tailSlot != null ? tailSlot.Find("TailMesh")?.GetComponent<SkinnedMeshRenderer>() : null;

            var failures = 0;
            foreach (var clip in clips)
            {
                // Idle/Walk/Run nao sao estados: vivem dentro da Blend Tree "Locomotion",
                // selecionados pelo parametro Speed. Procurar por nome falharia sempre.
                var state = StateFor(clip, out var speed);
                if (!animator.HasState(0, Animator.StringToHash(state)))
                {
                    sb.Append("\n  FAIL estado ausente: ").Append(state);
                    failures++;
                    continue;
                }

                animator.SetFloat(CreatureMotor.Param.Speed, speed);

                // Cinco fases, nao duas. Com dois instantes qualquer movimento senoidal
                // puro pode ser amostrado em pontos de mesma altura e parecer estatico
                // (era o caso de SLEEP em 0.05 e 0.45).
                var phases = new[] { 0f, 0.2f, 0.4f, 0.6f, 0.8f };
                var samples = new List<Vector3>[phases.Length];
                for (var i = 0; i < phases.Length; i++)
                {
                    samples[i] = SampleBake(animator, state, phases[i], body, limbs, tail);
                }

                var delta = 0f;
                for (var i = 0; i < samples.Length; i++)
                {
                    for (var j = i + 1; j < samples.Length; j++)
                    {
                        delta = Mathf.Max(delta, MaxDelta(samples[i], samples[j]));
                    }
                }

                var moved = delta > 0.0015f;
                sb.Append("\n  ").Append(moved ? "OK  " : "FAIL").Append(' ')
                  .Append(CreatureAnimationFactory.ClipName(clip))
                  .Append(" maxVertexDelta=").Append(delta.ToString("F4"));

                if (!moved)
                {
                    failures++;
                }
            }

            Destroy(go);
            return (failures == 0 ? "OK" : "FAIL") + " ANIMATION_DEFORMATION clips=" + clips.Length +
                   " fail=" + failures + sb;
        }

        /// <summary>Estado do Animator e Speed necessarios para avaliar um clipe.</summary>
        static string StateFor(CreatureClip clip, out float speed)
        {
            switch (clip)
            {
                case CreatureClip.Idle:
                    speed = 0f;
                    return CreatureAnimationFactory.LocomotionState;
                case CreatureClip.Walk:
                    speed = 0.42f;
                    return CreatureAnimationFactory.LocomotionState;
                case CreatureClip.Run:
                    speed = 1f;
                    return CreatureAnimationFactory.LocomotionState;
                default:
                    speed = 0f;
                    return CreatureAnimationFactory.ClipName(clip);
            }
        }

        static List<Vector3> SampleBake(Animator animator, string state, float normalizedTime,
            params SkinnedMeshRenderer[] renderers)
        {
            animator.Play(state, 0, normalizedTime);
            animator.Update(0f);
            animator.Update(0f);

            var points = new List<Vector3>();
            var temp = new Mesh();
            foreach (var renderer in renderers)
            {
                if (renderer == null || renderer.sharedMesh == null)
                {
                    continue;
                }

                renderer.BakeMesh(temp, true);
                var verts = temp.vertices;
                var step = Mathf.Max(1, verts.Length / 48);
                for (var i = 0; i < verts.Length; i += step)
                {
                    points.Add(verts[i]);
                }
            }

            Object.DestroyImmediate(temp);
            return points;
        }

        static float MaxDelta(List<Vector3> a, List<Vector3> b)
        {
            var max = 0f;
            var count = Mathf.Min(a.Count, b.Count);
            for (var i = 0; i < count; i++)
            {
                max = Mathf.Max(max, Vector3.Distance(a[i], b[i]));
            }

            return max;
        }

        /// <summary>Sequencia de troca em runtime exigida pelo item 46 da spec.</summary>
        public static string RunRuntimeSwapSequence()
        {
            var go = CreatureAssembler.Spawn("SwapSequence", Vector3.zero, CreaturePresets.NatureDna());
            var assembler = go.GetComponent<CreatureAssembler>();
            var before = Snapshot(go);
            var failures = new List<string>();

            void Step(string label, System.Action action)
            {
                action();
                var result = CreatureAssemblyValidator.Validate(assembler);
                if (!result.ok)
                {
                    failures.Add(label + " -> " + result.Summary(label));
                }
            }

            Step("head 01", () => assembler.SetHead("HEAD_01_SMOOTH"));
            Step("head 04", () => assembler.SetHead("HEAD_04_ARCANE"));
            Step("head 02", () => assembler.SetHead("HEAD_02_PREDATOR"));
            Step("eyes 01", () => assembler.SetEyes("EYES_01_PREDATOR"));
            Step("eyes 05", () => assembler.SetEyes("EYES_05_VOID"));
            Step("horns 01", () => assembler.SetHorns("HORNS_01_BONE"));
            Step("horns 05", () => assembler.SetHorns("HORNS_05_VOID_CRYSTAL"));
            Step("horns none", () => assembler.SetHorns(CreatureParts.HornsNone));
            Step("limbs 01", () => assembler.SetLimbs("LIMBS_01_SOFT"));
            Step("limbs 05", () => assembler.SetLimbs("LIMBS_05_HEAVY"));
            Step("tail 01", () => assembler.SetTail("TAIL_01_SHORT"));
            Step("tail 05", () => assembler.SetTail("TAIL_05_ELEMENTAL"));
            Step("back 01", () => assembler.SetBack("BACK_01_PLATES"));
            Step("back 05", () => assembler.SetBack("BACK_05_ARMORED_SPINES"));
            Step("back none", () => assembler.SetBack(CreatureParts.BackNone));
            Step("core 01", () => assembler.SetCore("CORE_01_EMBER"));
            Step("core 05", () => assembler.SetCore("CORE_05_VOID"));
            Step("pattern", () => assembler.SetPattern("PATTERN_GENESIS"));
            Step("colors", () =>
            {
                assembler.SetPrimaryColor("void_black");
                assembler.SetSecondaryColor("void_purple");
                assembler.SetPatternColor("violet");
            });
            Step("aura", () => assembler.SetAura("AURA_VOID"));

            var after = Snapshot(go);
            Destroy(go);

            var leaked = !before.SameAs(after);
            var sb = new StringBuilder();
            sb.Append(leaked || failures.Count > 0 ? "FAIL" : "OK").Append(" RUNTIME_SWAP_SEQUENCE")
              .Append("\n  before: ").Append(before)
              .Append("\n  after : ").Append(after);

            foreach (var failure in failures)
            {
                sb.Append("\n  ").Append(failure);
            }

            return sb.ToString();
        }

        static string Pick(System.Random rng, string[] values)
        {
            return values[rng.Next(values.Length)];
        }

        static void Destroy(GameObject go)
        {
            if (go == null)
            {
                return;
            }

            if (Application.isPlaying)
            {
                Object.Destroy(go);
            }
            else
            {
                Object.DestroyImmediate(go);
            }
        }
    }
}
