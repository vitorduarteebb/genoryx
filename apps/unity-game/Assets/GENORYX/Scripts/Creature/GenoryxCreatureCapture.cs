using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Capturas de aceitacao do sistema de criaturas, em PLAY MODE com a camera de jogo.
    /// Ativa com -genoryxCreatureCapture ou com o arquivo Captures/ENABLE_CREATURES.
    /// </summary>
    public class GenoryxCreatureCapture : MonoBehaviour
    {
        public int width = 1280;
        public int height = 800;
        public string folder = "creature-system-v1";

        readonly List<GameObject> temp = new List<GameObject>();
        readonly StringBuilder report = new StringBuilder();
        CreatureAssemblyTestBuilder builder;
        Camera cam;
        string outputPath;

        public static bool Requested()
        {
            var args = System.Environment.GetCommandLineArgs();
            for (var i = 0; i < args.Length; i++)
            {
                if (args[i] == "-genoryxCreatureCapture")
                {
                    return true;
                }
            }

            return File.Exists(Path.Combine(Application.dataPath, "../Captures/ENABLE_CREATURES"));
        }

        void Start()
        {
            if (!Requested())
            {
                enabled = false;
                return;
            }

            Debug.Log("[GENORYX] captura de criaturas iniciada");

            builder = GetComponent<CreatureAssemblyTestBuilder>();
            if (builder == null)
            {
                builder = gameObject.AddComponent<CreatureAssemblyTestBuilder>();
            }

            outputPath = Path.GetFullPath(Path.Combine(Application.dataPath, "../Captures/" + folder));
            Directory.CreateDirectory(outputPath);
            StartCoroutine(Run());
        }

        IEnumerator Run()
        {
            yield return null;
            cam = Camera.main;
            if (cam == null)
            {
                Debug.LogError("[GENORYX] captura sem camera");
                yield break;
            }

            // A cena de teste orbita a camera no Update. Sem tomar o controle, todo Frame()
            // desta captura seria descartado no frame seguinte.
            builder.cameraLocked = true;

            report.AppendLine("GENORYX CREATURE SYSTEM V1 â€” CAPTURAS + TESTES");
            report.AppendLine("data=" + System.DateTime.Now.ToString("s"));
            report.AppendLine("chassi=" + CreatureParts.ChassisV1 + " rig=" + CreatureParts.RigV1 + " bones=" + CreatureSockets.BoneCount);
            report.AppendLine("combinacoes=" + CreatureParts.CombinationCount().ToString("N0"));
            report.AppendLine("shader=" + (CreatureMaterials.UsingCreatureShader() ? CreatureMaterials.ShaderName : "FALLBACK URP/Lit"));

            var subject = builder.subject;
            subject.ApplyDNA(NeutralChassis());
            yield return Settle();

            // 01-04 â€” chassi neutro nas quatro vistas obrigatorias.
            yield return Frame(subject.transform, 0f, 8f, 1.85f);
            yield return Shoot("01_chassis_front");
            yield return Frame(subject.transform, 90f, 8f, 1.95f);
            yield return Shoot("02_chassis_side");
            yield return Frame(subject.transform, 180f, 8f, 1.85f);
            yield return Shoot("03_chassis_back");
            yield return Frame(subject.transform, 90f, 78f, 1.90f);
            yield return Shoot("04_chassis_top");

            // 05 â€” skeleton canonico com geometria real, visivel na camera de jogo.
            var skeletonView = BuildSkeletonView(subject);
            yield return Frame(subject.transform, 38f, 14f, 0.95f);
            yield return Shoot("05_skeleton");
            Destroy(skeletonView);
            yield return Settle();

            // 06-12 â€” fileiras de peca, tudo no mesmo chassi.
            // Cada slot tem o angulo que revela a peca: dorso de cima, cauda por tras,
            // Core pelo flanco +X, olhos quase de frente.
            yield return Row("06_heads", CreatureSlot.Head, CreatureParts.Heads,
                34f, 12f, 0.54f, new Vector3(0f, 0.34f, 0.04f));
            yield return Row("07_eyes", CreatureSlot.Eyes, CreatureParts.Eyes,
                20f, 8f, 0.26f, new Vector3(0f, 0.35f, 0.24f));
            yield return Row("08_horns", CreatureSlot.Horns, CreatureParts.Horns,
                32f, 20f, 0.36f, new Vector3(0f, 0.42f, 0.14f));
            yield return Row("09_limbs", CreatureSlot.Limbs, CreatureParts.Limbs,
                68f, 10f, 0.52f, new Vector3(0f, 0.24f, -0.08f));
            yield return Row("10_tails", CreatureSlot.Tail, CreatureParts.Tails,
                148f, 18f, 0.48f, new Vector3(0f, 0.34f, -0.28f));
            yield return Row("11_back_traits", CreatureSlot.Back, CreatureParts.Backs,
                42f, 34f, 0.48f, new Vector3(0f, 0.44f, -0.12f));
            yield return Row("12_cores", CreatureSlot.Core, CreatureParts.Cores,
                74f, 14f, 0.34f, new Vector3(0f, 0.36f, -0.02f));

            // 13-16 â€” quatro criaturas da referencia, mesmo chassi e mesmo rig.
            var presetShots = new[]
            {
                ("13_ember", CreaturePresets.Ember),
                ("14_frost", CreaturePresets.Frost),
                ("15_nature", CreaturePresets.Nature),
                ("16_void", CreaturePresets.Void)
            };

            foreach (var (file, preset) in presetShots)
            {
                subject.ApplyDNA(CreaturePresets.Get(preset));
                var secondary = subject.GetComponent<CreatureSecondaryMotion>();
                if (secondary != null)
                {
                    secondary.Rebind();
                }

                yield return Settle();
                yield return Frame(subject.transform, 38f, 12f, 1.95f);
                yield return Shoot(file);
            }

            // 17-19 â€” estagios de crescimento no mesmo rig.
            subject.ApplyDNA(CreaturePresets.Get(CreaturePresets.Ember));
            foreach (var (file, stage) in new[]
                     {
                         ("17_baby", CreatureGrowthStage.Baby),
                         ("18_juvenile", CreatureGrowthStage.Juvenile),
                         ("19_adult", CreatureGrowthStage.Adult)
                     })
            {
                subject.SetGrowthStage(stage);
                yield return Settle();
                yield return Frame(subject.transform, 38f, 12f, 1.95f);
                yield return Shoot(file);
            }

            // 20-25 â€” animacoes rodando de verdade.
            subject.SetGrowthStage(CreatureGrowthStage.Adult);
            yield return AnimationShot(subject, "20_idle", CreatureClip.Idle, 0.35f);
            yield return AnimationShot(subject, "21_walk", CreatureClip.Walk, 0.30f);
            yield return AnimationShot(subject, "22_run", CreatureClip.Run, 0.30f);
            yield return AnimationShot(subject, "23_attack", CreatureClip.Attack01Body, 0.42f);
            yield return AnimationShot(subject, "24_hit", CreatureClip.Hit, 0.20f);
            yield return AnimationShot(subject, "25_death", CreatureClip.Death, 0.75f);

            // 26-27 â€” geracao aleatoria em massa.
            builder.GenerateCrowd(10);
            yield return Settle();
            yield return FrameCrowd(10);
            yield return Shoot("26_random_10");

            builder.GenerateCrowd(100);
            yield return Settle();
            yield return FrameCrowd(100);
            yield return Shoot("27_random_100");
            builder.ClearCrowd();
            yield return Settle();

            // Sequencia de frames para video (ffmpeg opcional, fora do Unity).
            yield return AnimationSequence(subject);

            yield return RunTests();

            File.WriteAllText(Path.Combine(outputPath, "creature_report.txt"), report.ToString());
            File.WriteAllText(Path.Combine(Application.dataPath, "../Captures/CREATURES_DONE"), "ok");
            Debug.Log("[GENORYX][CREATURE-REPORT]\n" + report);

            // Quem encerra o processo e GenoryxCreatureRunner.Watch, ao ver CREATURES_DONE.
            // Application.Quit no editor e no-op.
            yield return null;
        }

        static CreatureDNA NeutralChassis()
        {
            // Chassi neutro: sem chifres, sem back trait, sem padrao, sem aura.
            return new CreatureDNA
            {
                creatureId = "chassis-neutral",
                head = new CreatureGene("HEAD_01_SMOOTH"),
                eyes = new CreatureGene("EYES_03_AMBER"),
                horns = new CreatureGene(CreatureParts.HornsNone),
                limbs = new CreatureGene("LIMBS_01_SOFT"),
                tail = new CreatureGene("TAIL_01_SHORT"),
                back = new CreatureGene(CreatureParts.BackNone),
                core = new CreatureGene("CORE_01_EMBER"),
                pattern = new CreatureGene("PATTERN_NONE"),
                aura = new CreatureGene(CreatureParts.AuraNone),
                primaryColorId = "ash",
                secondaryColorId = "steel",
                patternColorId = "bone",
                eyeColorId = "amber",
                coreColorId = "ember",
                growthStage = CreatureGrowthStage.Adult
            };
        }

        /// <summary>
        /// Cada peca e fotografada SOZINHA, em close, e as fotos viram um atlas horizontal.
        /// Enfileirar cinco criaturas em uma unica foto empurrava a camera para longe e as
        /// pecas ficavam pequenas demais para julgar; alem disso um so angulo nao serve para
        /// cauda, dorso e Core ao mesmo tempo. Cada slot escolhe o proprio angulo.
        /// </summary>
        IEnumerator Row(string file, CreatureSlot slot, string[] ids,
            float yaw, float pitch, float radius, Vector3 focus)
        {
            ClearTemp();
            if (builder.subject != null)
            {
                builder.subject.gameObject.SetActive(false);
            }

            const int cellW = 520;
            const int cellH = 620;
            var atlas = new Texture2D(cellW * ids.Length, cellH, TextureFormat.RGB24, false);

            for (var i = 0; i < ids.Length; i++)
            {
                var dna = NeutralChassis();
                dna.SetExpressed(slot, ids[i]);

                // Realce o slot em foco: cores neutras no resto.
                if (slot == CreatureSlot.Core)
                {
                    dna.coreColorId = CreaturePalette.ElementColor(ids[i]);
                }

                if (slot == CreatureSlot.Eyes)
                {
                    dna.eyeColorId = CreaturePalette.EmissiveColorIds[i % CreaturePalette.EmissiveColorIds.Length];
                }

                var go = CreatureAssembler.Spawn("Row_" + slot + "_" + i, Vector3.zero, dna);
                yield return Settle();

                FrameClose(go.transform, yaw, pitch, radius, focus, (float)cellW / cellH);

                var cell = RenderCell(cellW, cellH);
                atlas.SetPixels(i * cellW, 0, cellW, cellH, cell.GetPixels());
                DestroyImmediate(cell);
                DestroyImmediate(go);
                yield return null;
            }

            atlas.Apply();
            File.WriteAllBytes(Path.Combine(outputPath, file + ".png"), atlas.EncodeToPNG());
            DestroyImmediate(atlas);

            report.AppendLine("captura " + file + ".png (" + ids.Length + " closes)");
            Debug.Log("[GENORYX] captura " + file + ".png");

            if (builder.subject != null)
            {
                builder.subject.gameObject.SetActive(true);
            }

            yield return Settle();
        }

        /// <summary>
        /// Enquadra um raio conhecido em vez de um "distanceScale" magico: com celulas em
        /// retrato o limite e a largura, entao a distancia sai do menor semi-angulo.
        /// </summary>
        void FrameClose(Transform target, float yaw, float pitch, float radius, Vector3 focus, float aspect)
        {
            var pivot = target.position + focus;
            cam.fieldOfView = 34f;

            var halfV = Mathf.Tan(cam.fieldOfView * 0.5f * Mathf.Deg2Rad);
            var halfH = halfV * aspect;
            var distance = radius / Mathf.Min(halfV, halfH);

            cam.transform.position = pivot + Orbit(yaw, pitch) * distance;
            cam.transform.LookAt(pivot);
        }


        Texture2D RenderCell(int w, int h)
        {
            var rt = new RenderTexture(w, h, 24, RenderTextureFormat.ARGB32) { antiAliasing = 4 };
            var previousTexture = cam.targetTexture;
            var previousAspect = cam.aspect;

            cam.aspect = (float)w / h;
            cam.targetTexture = rt;
            cam.Render();
            cam.targetTexture = previousTexture;
            cam.aspect = previousAspect;
            cam.ResetAspect();

            var active = RenderTexture.active;
            RenderTexture.active = rt;
            var texture = new Texture2D(w, h, TextureFormat.RGB24, false);
            texture.ReadPixels(new Rect(0, 0, w, h), 0, 0);
            texture.Apply();
            RenderTexture.active = active;

            rt.Release();
            DestroyImmediate(rt);
            return texture;
        }

        IEnumerator AnimationShot(CreatureAssembler subject, string file, CreatureClip clip, float normalized)
        {
            var animator = subject.Animator;
            if (animator == null || animator.runtimeAnimatorController == null)
            {
                report.AppendLine("captura " + file + " sem animator");
                yield break;
            }

            switch (clip)
            {
                case CreatureClip.Idle:
                    animator.SetFloat(CreatureMotor.Param.Speed, 0f);
                    break;
                case CreatureClip.Walk:
                    animator.SetFloat(CreatureMotor.Param.Speed, 0.42f);
                    break;
                case CreatureClip.Run:
                    animator.SetFloat(CreatureMotor.Param.Speed, 1f);
                    break;
                default:
                    animator.Play(CreatureAnimationFactory.ClipName(clip), 0, normalized);
                    break;
            }

            if (clip is CreatureClip.Idle or CreatureClip.Walk or CreatureClip.Run)
            {
                animator.Play(CreatureAnimationFactory.LocomotionState, 0, normalized);
            }

            animator.Update(0f);
            animator.Update(0f);
            yield return EndOfFrame();

            yield return Frame(subject.transform, 46f, 10f, 1.95f);
            yield return Shoot(file);
        }

        IEnumerator AnimationSequence(CreatureAssembler subject)
        {
            var dir = Path.Combine(outputPath, "video-frames");
            Directory.CreateDirectory(dir);

            var order = new[]
            {
                (CreaturePresets.Ember, CreatureClip.Idle), (CreaturePresets.Ember, CreatureClip.Walk),
                (CreaturePresets.Frost, CreatureClip.Run), (CreaturePresets.Frost, CreatureClip.Attack01Body),
                (CreaturePresets.Nature, CreatureClip.Hit), (CreaturePresets.Nature, CreatureClip.Idle),
                (CreaturePresets.Void, CreatureClip.Attack02Core), (CreaturePresets.Void, CreatureClip.Death)
            };

            var frame = 0;
            foreach (var (preset, clip) in order)
            {
                subject.ApplyDNA(CreaturePresets.Get(preset));
                var secondary = subject.GetComponent<CreatureSecondaryMotion>();
                if (secondary != null)
                {
                    secondary.Rebind();
                }

                yield return Settle();
                var animator = subject.Animator;

                for (var i = 0; i < 20; i++)
                {
                    var normalized = i / 20f;
                    if (clip is CreatureClip.Idle or CreatureClip.Walk or CreatureClip.Run)
                    {
                        animator.SetFloat(CreatureMotor.Param.Speed,
                            clip == CreatureClip.Idle ? 0f : clip == CreatureClip.Walk ? 0.42f : 1f);
                        animator.Play(CreatureAnimationFactory.LocomotionState, 0, normalized);
                    }
                    else
                    {
                        animator.Play(CreatureAnimationFactory.ClipName(clip), 0, normalized);
                    }

                    animator.Update(0f);
                    animator.Update(0f);
                    yield return Frame(subject.transform, 40f, 10f, 1.95f);
                    yield return ShootTo(Path.Combine(dir, "frame_" + frame.ToString("D4") + ".png"));
                    frame++;
                }
            }

            report.AppendLine("frames de video=" + frame + " em " + dir);
            report.AppendLine("video: rode deploy/scripts/creature-video.ps1 (precisa de ffmpeg)");
        }

        IEnumerator RunTests()
        {
            report.AppendLine();
            report.AppendLine("=== TESTES AUTOMATICOS ===");

            report.AppendLine(CreatureTestSuite.RunMeshOrientation());
            yield return null;

            report.AppendLine(CreatureTestSuite.RunBakedMeshFreshness());
            yield return null;

            report.AppendLine(CreatureTestSuite.RunGeneration(10, 500, false));
            yield return null;

            report.AppendLine(CreatureTestSuite.RunGeneration(100, 10_000, false));
            yield return null;

            report.AppendLine(CreatureTestSuite.RunRuntimeSwapSequence());
            yield return null;

            report.AppendLine(CreatureTestSuite.RunSwapStress(1000, 77));
            yield return null;

            report.AppendLine(CreatureTestSuite.RunAnimationDeformation(CreaturePresets.EmberDna(),
                CreatureClip.Idle, CreatureClip.Walk, CreatureClip.Run,
                CreatureClip.Attack01Body, CreatureClip.Attack02Core,
                CreatureClip.Hit, CreatureClip.Death, CreatureClip.Victory,
                CreatureClip.Sleep, CreatureClip.Eat, CreatureClip.Happy,
                CreatureClip.CaptureReaction, CreatureClip.Spawn));
            yield return null;

            foreach (var preset in CreaturePresets.All)
            {
                report.AppendLine(CreatureTestSuite.RunAnimationDeformation(CreaturePresets.Get(preset),
                    CreatureClip.Idle, CreatureClip.Walk, CreatureClip.Run));
                yield return null;
            }

            report.AppendLine(PerformanceReport());
        }

        string PerformanceReport()
        {
            var go = CreatureAssembler.Spawn("PerfProbe", Vector3.zero, CreaturePresets.VoidDna());
            var assembler = go.GetComponent<CreatureAssembler>();
            var sb = new StringBuilder();

            var totalVerts = 0;
            var totalTris = 0;
            foreach (var renderer in go.GetComponentsInChildren<Renderer>(true))
            {
                if (!renderer.enabled)
                {
                    continue;
                }

                Mesh mesh = null;
                if (renderer is SkinnedMeshRenderer skinned)
                {
                    mesh = skinned.sharedMesh;
                }
                else
                {
                    var filter = renderer.GetComponent<MeshFilter>();
                    mesh = filter != null ? filter.sharedMesh : null;
                }

                if (mesh != null)
                {
                    totalVerts += mesh.vertexCount;
                    totalTris += mesh.triangles.Length / 3;
                }
            }

            // Dump de geometria: a inspecao visual nao distingue "peca ausente" de
            // "peca em sombra profunda". Os bounds respondem sem ambiguidade.
            sb.Append("GEOMETRY (bounds em espaco autorado)");
            foreach (var renderer in go.GetComponentsInChildren<Renderer>(true))
            {
                if (!renderer.enabled)
                {
                    continue;
                }

                Mesh m = null;
                if (renderer is SkinnedMeshRenderer skinned)
                {
                    m = skinned.sharedMesh;
                }
                else if (renderer.TryGetComponent<MeshFilter>(out var filter))
                {
                    // TryGetComponent e nao GetComponent: o renderer da aura e um
                    // ParticleSystemRenderer e nao tem MeshFilter nenhum.
                    m = filter.sharedMesh;
                }

                if (m == null)
                {
                    continue;
                }

                var world = renderer.bounds;
                sb.Append("\n  ").Append(renderer.name.PadRight(12))
                  .Append(" localMin=").Append(m.bounds.min.ToString("F3"))
                  .Append(" localMax=").Append(m.bounds.max.ToString("F3"))
                  .Append(" worldMin=").Append(world.min.ToString("F3"))
                  .Append(" worldMax=").Append(world.max.ToString("F3"));
            }

            // Protrusao real de cada peca rigida. Sem isto, "nao vejo a gema na foto" e
            // ambiguo entre peca submersa, renderer desligado e peca fora de enquadramento.
            sb.Append("\nPROTRUSAO (metros acima da pele)");
            foreach (var filter in go.GetComponentsInChildren<MeshFilter>(true))
            {
                if (filter.sharedMesh == null || !filter.TryGetComponent<MeshRenderer>(out var mr) || !mr.enabled)
                {
                    continue;
                }

                var onHead = filter.name.StartsWith("Eye") || filter.name.StartsWith("Horn");
                var boneName = onHead ? CreatureSockets.Head : CreatureSockets.Body;
                var bone = assembler.Bone(boneName);
                if (bone == null)
                {
                    continue;
                }

                var headId = assembler.dna.HeadId;
                System.Func<Vector3, float> clearance = onHead
                    ? p => CreatureChassisSurface.HeadClearance(headId, p)
                    : CreatureChassisSurface.BodyClearance;

                var toAuthored = CreatureChassisSurface.ToAuthored(bone, filter.transform, boneName);
                sb.Append("\n  ").Append(filter.name.PadRight(12)).Append(' ')
                  .Append(CreatureChassisSurface.MaxProtrusion(filter.sharedMesh, toAuthored, clearance).ToString("F4"));
            }

            sb.Append('\n');
            sb.Append("PERFORMANCE LOD0 skinned=").Append(assembler.SkinnedRendererCount())
              .Append(" renderers=").Append(assembler.RendererCount())
              .Append(" verts=").Append(totalVerts)
              .Append(" tris=").Append(totalTris)
              .Append(" sharedMaterials=").Append(CreatureMaterials.SharedMaterialCount);

            foreach (var quality in new[] { CreatureQuality.Standard, CreatureQuality.Distant })
            {
                assembler.detail = CreatureLod.DetailFor(quality);
                assembler.ApplyDNA(assembler.dna);
                var verts = 0;
                foreach (var renderer in go.GetComponentsInChildren<SkinnedMeshRenderer>(true))
                {
                    if (renderer.sharedMesh != null)
                    {
                        verts += renderer.sharedMesh.vertexCount;
                    }
                }

                sb.Append("\n  ").Append(quality == CreatureQuality.Standard ? "LOD1" : "LOD2")
                  .Append(" detail=").Append(assembler.detail.ToString("F2"))
                  .Append(" skinnedVerts=").Append(verts);
            }

            sb.Append("\n  meshCacheEntries=").Append(CreatureMeshLab.CachedMeshCount);
            Destroy(go);
            return sb.ToString();
        }

        // ------------------------------------------------------------ HELPERS

        /// <summary>
        /// WaitForEndOfFrame nunca retoma em -batchmode: nao existe fim de frame de render.
        /// A captura nao depende dele porque o RenderTexture e preenchido por cam.Render().
        /// </summary>
        static object EndOfFrame()
        {
            return Application.isBatchMode ? null : new WaitForEndOfFrame();
        }

        GameObject BuildSkeletonView(CreatureAssembler assembler)
        {
            var root = new GameObject("SkeletonView");
            var shader = Shader.Find("Universal Render Pipeline/Unlit") ?? Shader.Find("Unlit/Color");
            var bones = assembler.Bones;

            foreach (var renderer in assembler.VisualRoot.GetComponentsInChildren<Renderer>(true))
            {
                renderer.enabled = false;
            }

            for (var i = 0; i < bones.Length; i++)
            {
                var bone = bones[i];
                if (bone == null)
                {
                    continue;
                }

                var zone = CreatureSocketGizmos.ZoneOf(CreatureSockets.BoneOrder[i]);
                var color = CreatureSocketGizmos.ZoneColor(zone);

                var joint = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                joint.name = "Joint_" + CreatureSockets.BoneOrder[i];
                joint.transform.SetParent(root.transform, false);
                joint.transform.position = bone.position;
                joint.transform.localScale = Vector3.one * 0.030f;
                Paint(joint, shader, color);
                DestroyImmediate(joint.GetComponent<Collider>());

                var parentName = CreatureSockets.ParentOf(CreatureSockets.BoneOrder[i]);
                if (parentName == null)
                {
                    continue;
                }

                var parent = CreatureRig.Find(bones, parentName);
                if (parent == null)
                {
                    continue;
                }

                var delta = bone.position - parent.position;
                if (delta.magnitude < 0.001f)
                {
                    continue;
                }

                var link = GameObject.CreatePrimitive(PrimitiveType.Cube);
                link.name = "Link_" + CreatureSockets.BoneOrder[i];
                link.transform.SetParent(root.transform, false);
                link.transform.position = parent.position + delta * 0.5f;
                link.transform.rotation = Quaternion.LookRotation(delta.normalized, Vector3.up);
                link.transform.localScale = new Vector3(0.010f, 0.010f, delta.magnitude);
                Paint(link, shader, color * 0.65f);
                DestroyImmediate(link.GetComponent<Collider>());
            }

            return root;
        }

        void Paint(GameObject go, Shader shader, Color color)
        {
            var mat = new Material(shader) { hideFlags = HideFlags.DontSave };
            if (mat.HasProperty("_BaseColor"))
            {
                mat.SetColor("_BaseColor", color);
            }

            if (mat.HasProperty("_Color"))
            {
                mat.SetColor("_Color", color);
            }

            go.GetComponent<MeshRenderer>().sharedMaterial = mat;
        }

        /// <summary>
        /// yaw 0 = camera na frente da criatura. A criatura olha para +Z, entao a camera
        /// precisa ficar em +Z; com offset negativo as vistas "frente" mostravam a traseira.
        /// </summary>
        IEnumerator Frame(Transform target, float yaw, float pitch, float distanceScale)
        {
            var pivot = target.position + new Vector3(0f, 0.30f, 0.02f);
            cam.fieldOfView = 34f;
            cam.transform.position = pivot + Orbit(yaw, pitch) * (1.30f * distanceScale);
            cam.transform.LookAt(pivot);
            yield return EndOfFrame();
        }

        /// <summary>
        /// Direcao do olho, com pitch positivo = camera ACIMA do alvo.
        ///
        /// Euler(pitch, yaw, 0) * forward faz o oposto: gira o vetor para BAIXO, e todas as
        /// capturas saiam vistas de baixo, com as patas dianteiras cobrindo o rosto.
        /// </summary>
        static Vector3 Orbit(float yaw, float pitch)
        {
            var p = pitch * Mathf.Deg2Rad;
            var y = yaw * Mathf.Deg2Rad;
            var horizontal = Mathf.Cos(p);
            return new Vector3(horizontal * Mathf.Sin(y), Mathf.Sin(p), horizontal * Mathf.Cos(y));
        }

        IEnumerator FrameCrowd(int count)
        {
            // O grid ocupa `span` em X e em Z, centrado na origem. Com a camera em
            // 0.62/0.92 de span a metade visivel dava 0.40 span contra os 0.50 necessarios,
            // e as duas fileiras da frente saiam cortadas. 0.86/1.46 rende 0.61 span,
            // com margem para a rotacao individual de cada criatura.
            var columns = Mathf.CeilToInt(Mathf.Sqrt(count));
            var span = columns * 1.45f;
            cam.fieldOfView = 40f;
            cam.transform.position = new Vector3(0f, span * 0.86f, span * 1.46f);
            cam.transform.LookAt(new Vector3(0f, 0.25f, 0f));
            yield return EndOfFrame();
        }

        IEnumerator Settle()
        {
            yield return null;
            yield return EndOfFrame();
        }

        IEnumerator Shoot(string name)
        {
            yield return ShootTo(Path.Combine(outputPath, name + ".png"));
            report.AppendLine("captura " + name + ".png");
            Debug.Log("[GENORYX] captura " + name + ".png");
        }

        IEnumerator ShootTo(string path)
        {
            yield return EndOfFrame();

            var rt = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32) { antiAliasing = 4 };
            var previous = cam.targetTexture;
            cam.targetTexture = rt;
            cam.Render();
            cam.targetTexture = previous;

            var active = RenderTexture.active;
            RenderTexture.active = rt;
            var texture = new Texture2D(width, height, TextureFormat.RGB24, false);
            texture.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            texture.Apply();
            RenderTexture.active = active;

            File.WriteAllBytes(path, texture.EncodeToPNG());

            DestroyImmediate(texture);
            rt.Release();
            DestroyImmediate(rt);
        }

        void ClearTemp()
        {
            foreach (var go in temp)
            {
                if (go != null)
                {
                    Destroy(go);
                }
            }

            temp.Clear();
        }
    }
}
