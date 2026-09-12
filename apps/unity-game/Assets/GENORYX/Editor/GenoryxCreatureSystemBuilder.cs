using System.Collections.Generic;
using System.IO;
using System.Text;
using Genoryx.Creatures;
using UnityEditor;
using UnityEditor.Animations;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Genoryx.Editor
{
    /// <summary>
    /// Materializa o GENORYX CREATURE SYSTEM V1 como assets Unity reais:
    /// malhas, materiais, clipes, Animator, part definitions, prefabs e cena de teste.
    ///
    /// Nenhuma etapa aqui chama Meshy. Este builder e o consumidor final do pipeline;
    /// quando um asset autorado chegar em Creatures/CoreV1/&lt;slot&gt;, ele apenas substitui
    /// a malha procedural na CreaturePartDefinition correspondente.
    /// </summary>
    public static class GenoryxCreatureSystemBuilder
    {
        const string Root = "Assets/GENORYX/Creatures/CoreV1";
        const string ResourcesRoot = "Assets/GENORYX/Resources/GENORYX";
        const string ScenePath = "Assets/GENORYX/Scenes/CreatureAssemblyTest.unity";

        static readonly string[] Folders =
        {
            "Bodies", "Heads", "Eyes", "Horns", "Limbs", "Tails", "Back", "Cores",
            "Animations", "Materials", "VFX", "Prefabs", "Parts"
        };

        [MenuItem("GENORYX/Creatures/Build Creature System V1")]
        public static void BuildAll()
        {
            var report = new StringBuilder();
            report.AppendLine("GENORYX CREATURE SYSTEM V1 — BUILD");

            EnsureFolders();
            var meshes = BakeMeshes(report);
            var materials = BuildMaterials(report);
            var clips = BuildClips(report);
            var controller = BuildAnimator(clips, report);
            var database = BuildDatabase(meshes, controller, report);

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            CreaturePartDatabase.InvalidateCache();

            BuildPrefabs(report);
            BuildTestScene(report);

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            report.AppendLine("bones=" + CreatureSockets.BoneCount);
            report.AppendLine("combinacoes=" + CreatureParts.CombinationCount().ToString("N0"));
            report.AppendLine("materiais=" + materials);
            report.AppendLine("database=" + (database != null ? AssetDatabase.GetAssetPath(database) : "FALHOU"));

            var logPath = Path.Combine(Application.dataPath, "../Captures/creature-system-v1/build_report.txt");
            Directory.CreateDirectory(Path.GetDirectoryName(logPath));
            File.WriteAllText(logPath, report.ToString());
            Debug.Log("[GENORYX]\n" + report);
        }

        static void EnsureFolders()
        {
            EnsureFolder("Assets/GENORYX/Creatures");
            EnsureFolder(Root);
            foreach (var folder in Folders)
            {
                EnsureFolder(Root + "/" + folder);
            }

            EnsureFolder("Assets/GENORYX/Resources");
            EnsureFolder(ResourcesRoot);
            EnsureFolder(ResourcesRoot + "/Materials");
        }

        static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path))
            {
                return;
            }

            var parent = Path.GetDirectoryName(path).Replace('\\', '/');
            var name = Path.GetFileName(path);
            EnsureFolder(parent);
            AssetDatabase.CreateFolder(parent, name);
        }

        // ------------------------------------------------------------- MESHES

        struct MeshEntry
        {
            public string id;
            public CreatureSlot slot;
            public Mesh mesh;
            public string folder;
        }

        static List<MeshEntry> BakeMeshes(StringBuilder report)
        {
            var entries = new List<MeshEntry>();

            foreach (var id in CreatureParts.Bodies)
            {
                entries.Add(new MeshEntry { id = id, slot = CreatureSlot.Body, mesh = CreatureMeshLab.Body(id), folder = "Bodies" });
            }

            foreach (var id in CreatureParts.Heads)
            {
                entries.Add(new MeshEntry { id = id, slot = CreatureSlot.Head, mesh = CreatureMeshLab.Head(id), folder = "Heads" });
            }

            foreach (var id in CreatureParts.Eyes)
            {
                entries.Add(new MeshEntry { id = id, slot = CreatureSlot.Eyes, mesh = CreatureMeshLab.Eye(id), folder = "Eyes" });
            }

            foreach (var id in CreatureParts.Horns)
            {
                entries.Add(new MeshEntry { id = id, slot = CreatureSlot.Horns, mesh = CreatureMeshLab.Horn(id), folder = "Horns" });
            }

            foreach (var id in CreatureParts.Limbs)
            {
                entries.Add(new MeshEntry { id = id, slot = CreatureSlot.Limbs, mesh = CreatureMeshLab.Limbs(id), folder = "Limbs" });
            }

            foreach (var id in CreatureParts.Tails)
            {
                entries.Add(new MeshEntry { id = id, slot = CreatureSlot.Tail, mesh = CreatureMeshLab.Tail(id), folder = "Tails" });
            }

            foreach (var id in CreatureParts.Backs)
            {
                entries.Add(new MeshEntry { id = id, slot = CreatureSlot.Back, mesh = CreatureMeshLab.BackTrait(id), folder = "Back" });
            }

            foreach (var id in CreatureParts.Cores)
            {
                entries.Add(new MeshEntry { id = id, slot = CreatureSlot.Core, mesh = CreatureMeshLab.Core(id), folder = "Cores" });
            }

            var saved = new List<MeshEntry>();
            var totalVerts = 0;

            foreach (var entry in entries)
            {
                if (entry.mesh == null)
                {
                    // HORNS_NONE / BACK_NONE nao tem geometria por definicao.
                    saved.Add(entry);
                    continue;
                }

                var path = Root + "/" + entry.folder + "/" + entry.id + ".asset";
                var existing = AssetDatabase.LoadAssetAtPath<Mesh>(path);
                Mesh copy;

                if (existing != null)
                {
                    OverwriteMesh(existing, entry.mesh);
                    copy = existing;
                    EditorUtility.SetDirty(copy);
                }
                else
                {
                    copy = Object.Instantiate(entry.mesh);
                    copy.name = entry.id;
                    AssetDatabase.CreateAsset(copy, path);
                }

                totalVerts += copy.vertexCount;
                saved.Add(new MeshEntry { id = entry.id, slot = entry.slot, mesh = copy, folder = entry.folder });
            }

            report.AppendLine("malhas geradas=" + saved.Count + " vertices totais=" + totalVerts);
            return saved;
        }

        /// <summary>
        /// Substitui a geometria de um Mesh ja versionado, preservando o GUID do asset.
        ///
        /// EditorUtility.CopySerialized NAO troca os buffers de vertice de um Mesh: o arquivo
        /// era reescrito a cada build, o timestamp mudava e a geometria continuava a da
        /// primeira geracao. Todo ajuste de silhueta, perna e cabeca ficou invisivel por isso,
        /// e as pecas rigidas afundavam porque o corpo em cena era 18% mais largo que o
        /// perfil que as assentava. Copiar canal a canal e o que de fato atualiza o asset.
        /// </summary>
        static void OverwriteMesh(Mesh target, Mesh source)
        {
            target.Clear(false);
            target.indexFormat = source.indexFormat;
            target.vertices = source.vertices;
            target.normals = source.normals;
            target.tangents = source.tangents;
            target.uv = source.uv;
            target.colors = source.colors;
            target.boneWeights = source.boneWeights;
            target.bindposes = source.bindposes;
            target.subMeshCount = source.subMeshCount;

            for (var i = 0; i < source.subMeshCount; i++)
            {
                target.SetTriangles(source.GetTriangles(i), i, false);
            }

            target.RecalculateBounds();
        }

        // ---------------------------------------------------------- MATERIALS

        static int BuildMaterials(StringBuilder report)
        {
            var shader = Shader.Find(CreatureMaterials.ShaderName);
            if (shader == null)
            {
                report.AppendLine("AVISO shader GENORYX/Creature nao encontrado — usando URP/Lit");
                shader = Shader.Find("Universal Render Pipeline/Lit");
            }

            var profiles = (CreatureMaterialProfile[])System.Enum.GetValues(typeof(CreatureMaterialProfile));
            CreatureMaterials.ReleaseShared();

            foreach (var profile in profiles)
            {
                var path = ResourcesRoot + "/Materials/GENORYX_Creature_" + profile + ".mat";
                var template = CreatureMaterials.Get(profile);
                var mat = AssetDatabase.LoadAssetAtPath<Material>(path);

                if (mat == null)
                {
                    mat = new Material(shader) { name = "GENORYX_Creature_" + profile };
                    AssetDatabase.CreateAsset(mat, path);
                }

                mat.shader = shader;
                CopyFloats(template, mat);
                mat.enableInstancing = true;
                EditorUtility.SetDirty(mat);
            }

            CreatureMaterials.ReleaseShared();
            report.AppendLine("materiais compartilhados=" + profiles.Length + " shader=" + shader.name);
            return profiles.Length;
        }

        static void CopyFloats(Material from, Material to)
        {
            string[] keys = { "_Smoothness", "_Metallic", "_RimStrength", "_BellyLift", "_RimPower", "_Occlusion" };
            foreach (var key in keys)
            {
                if (from.HasProperty(key) && to.HasProperty(key))
                {
                    to.SetFloat(key, from.GetFloat(key));
                }
            }
        }

        // --------------------------------------------------------------- CLIPS

        static Dictionary<CreatureClip, AnimationClip> BuildClips(StringBuilder report)
        {
            var result = new Dictionary<CreatureClip, AnimationClip>();
            var clips = (CreatureClip[])System.Enum.GetValues(typeof(CreatureClip));

            foreach (var clip in clips)
            {
                var generated = CreatureAnimationFactory.Build(clip);
                var path = Root + "/Animations/" + CreatureAnimationFactory.ClipName(clip) + ".anim";
                var existing = AssetDatabase.LoadAssetAtPath<AnimationClip>(path);

                if (existing != null)
                {
                    EditorUtility.CopySerialized(generated, existing);
                    Object.DestroyImmediate(generated);
                    generated = existing;
                    EditorUtility.SetDirty(generated);
                }
                else
                {
                    AssetDatabase.CreateAsset(generated, path);
                }

                result[clip] = generated;
            }

            report.AppendLine("clipes=" + result.Count + " (" + string.Join(", ", System.Array.ConvertAll(clips, CreatureAnimationFactory.ClipName)) + ")");
            return result;
        }

        // ------------------------------------------------------------ ANIMATOR

        static RuntimeAnimatorController BuildAnimator(Dictionary<CreatureClip, AnimationClip> clips, StringBuilder report)
        {
            var path = ResourcesRoot + "/GenoryxCreatureAnimator.controller";
            AssetDatabase.DeleteAsset(path);
            var controller = AnimatorController.CreateAnimatorControllerAtPath(path);

            controller.AddParameter(CreatureMotor.Param.Speed, AnimatorControllerParameterType.Float);
            foreach (var trigger in new[]
                     {
                         CreatureMotor.Param.Attack01, CreatureMotor.Param.Attack02, CreatureMotor.Param.Hit,
                         CreatureMotor.Param.Death, CreatureMotor.Param.Victory, CreatureMotor.Param.Spawn,
                         CreatureMotor.Param.Capture
                     })
            {
                controller.AddParameter(trigger, AnimatorControllerParameterType.Trigger);
            }

            foreach (var flag in new[] { CreatureMotor.Param.Sleep, CreatureMotor.Param.Eat, CreatureMotor.Param.Happy })
            {
                controller.AddParameter(flag, AnimatorControllerParameterType.Bool);
            }

            var machine = controller.layers[0].stateMachine;

            // Blend tree de locomocao: Speed 0 -> Idle, medio -> Walk, alto -> Run.
            var locomotion = controller.CreateBlendTreeInController(CreatureAnimationFactory.LocomotionState, out var tree, 0);
            tree.name = CreatureAnimationFactory.LocomotionState;
            tree.blendType = BlendTreeType.Simple1D;
            tree.blendParameter = CreatureMotor.Param.Speed;
            tree.useAutomaticThresholds = false;
            tree.AddChild(clips[CreatureClip.Idle], 0f);
            tree.AddChild(clips[CreatureClip.Walk], 0.42f);
            tree.AddChild(clips[CreatureClip.Run], 1f);
            machine.defaultState = locomotion;

            OneShot(controller, machine, locomotion, clips[CreatureClip.Attack01Body], "ATTACK_01_BODY", CreatureMotor.Param.Attack01);
            OneShot(controller, machine, locomotion, clips[CreatureClip.Attack02Core], "ATTACK_02_CORE", CreatureMotor.Param.Attack02);
            OneShot(controller, machine, locomotion, clips[CreatureClip.Hit], "HIT", CreatureMotor.Param.Hit);
            OneShot(controller, machine, locomotion, clips[CreatureClip.Victory], "VICTORY", CreatureMotor.Param.Victory);
            OneShot(controller, machine, locomotion, clips[CreatureClip.Spawn], "SPAWN", CreatureMotor.Param.Spawn);
            OneShot(controller, machine, locomotion, clips[CreatureClip.CaptureReaction], "CAPTURE_REACTION", CreatureMotor.Param.Capture);

            // Death nao volta sozinho: so um Spawn/Revive tira a criatura desse estado.
            var death = machine.AddState("DEATH", new Vector3(420f, 240f, 0f));
            death.motion = clips[CreatureClip.Death];
            var toDeath = machine.AddAnyStateTransition(death);
            toDeath.AddCondition(AnimatorConditionMode.If, 0f, CreatureMotor.Param.Death);
            toDeath.duration = 0.06f;
            toDeath.canTransitionToSelf = false;
            var reviveTransition = death.AddTransition(locomotion);
            reviveTransition.AddCondition(AnimatorConditionMode.If, 0f, CreatureMotor.Param.Spawn);
            reviveTransition.duration = 0.2f;
            reviveTransition.hasExitTime = false;

            Flag(machine, locomotion, clips[CreatureClip.Sleep], "SLEEP", CreatureMotor.Param.Sleep, new Vector3(420f, 320f, 0f));
            Flag(machine, locomotion, clips[CreatureClip.Eat], "EAT", CreatureMotor.Param.Eat, new Vector3(420f, 380f, 0f));
            Flag(machine, locomotion, clips[CreatureClip.Happy], "HAPPY", CreatureMotor.Param.Happy, new Vector3(420f, 440f, 0f));

            EditorUtility.SetDirty(controller);
            report.AppendLine("animator=" + path + " estados=" + machine.states.Length + " parametros=" + controller.parameters.Length);
            return controller;
        }

        static void OneShot(AnimatorController controller, AnimatorStateMachine machine, AnimatorState back,
            AnimationClip clip, string name, string trigger)
        {
            var state = machine.AddState(name, new Vector3(420f, machine.states.Length * 60f, 0f));
            state.motion = clip;

            var enter = machine.AddAnyStateTransition(state);
            enter.AddCondition(AnimatorConditionMode.If, 0f, trigger);
            enter.duration = 0.06f;
            enter.canTransitionToSelf = false;

            var exit = state.AddTransition(back);
            exit.hasExitTime = true;
            exit.exitTime = 0.88f;
            exit.duration = 0.14f;
        }

        static void Flag(AnimatorStateMachine machine, AnimatorState back, AnimationClip clip,
            string name, string param, Vector3 position)
        {
            var state = machine.AddState(name, position);
            state.motion = clip;

            var enter = machine.AddAnyStateTransition(state);
            enter.AddCondition(AnimatorConditionMode.If, 0f, param);
            enter.duration = 0.20f;
            enter.canTransitionToSelf = false;

            var exit = state.AddTransition(back);
            exit.AddCondition(AnimatorConditionMode.IfNot, 0f, param);
            exit.duration = 0.20f;
            exit.hasExitTime = false;
        }

        // ------------------------------------------------------------ DATABASE

        static CreaturePartDatabase BuildDatabase(List<MeshEntry> meshes, RuntimeAnimatorController controller, StringBuilder report)
        {
            var dbPath = ResourcesRoot + "/CreaturePartDatabase.asset";
            var database = AssetDatabase.LoadAssetAtPath<CreaturePartDatabase>(dbPath);
            if (database == null)
            {
                database = ScriptableObject.CreateInstance<CreaturePartDatabase>();
                AssetDatabase.CreateAsset(database, dbPath);
            }

            database.chassisId = CreatureParts.ChassisV1;
            database.rigId = CreatureParts.RigV1;
            database.animatorController = controller;
            database.parts.Clear();
            database.cores.Clear();

            foreach (var entry in meshes)
            {
                var partPath = Root + "/Parts/" + entry.id + ".asset";
                var part = AssetDatabase.LoadAssetAtPath<CreaturePartDefinition>(partPath);
                if (part == null)
                {
                    part = ScriptableObject.CreateInstance<CreaturePartDefinition>();
                    AssetDatabase.CreateAsset(part, partPath);
                }

                part.id = entry.id;
                part.displayName = Prettify(entry.id);
                part.slot = entry.slot;
                part.mesh = entry.mesh;
                part.prefab = null;
                part.compatibleChassis = CreatureParts.ChassisV1;
                part.rarity = RarityFor(entry.id);
                part.socket = SocketFor(entry.slot);
                part.boundsSize = entry.mesh != null ? entry.mesh.bounds.size : Vector3.zero;
                part.fitProfile = CreatureFitProfile.Default;
                part.materialProfile = CreatureMaterials.ProfileFor(entry.slot, entry.id);
                part.mirrored = entry.slot is CreatureSlot.Eyes or CreatureSlot.Horns or CreatureSlot.Back;
                part.centered = entry.slot == CreatureSlot.Back && CreatureMeshLab.BackIsCentered(entry.id);
                part.mutationCompatibility = MutationsFor(entry.id);
                EditorUtility.SetDirty(part);
                database.parts.Add(part);
            }

            foreach (var id in CreatureParts.Cores)
            {
                var corePath = Root + "/Cores/DEF_" + id + ".asset";
                var core = AssetDatabase.LoadAssetAtPath<CreatureCoreDefinition>(corePath);
                if (core == null)
                {
                    core = ScriptableObject.CreateInstance<CreatureCoreDefinition>();
                    AssetDatabase.CreateAsset(core, corePath);
                }

                core.id = id;
                core.element = CreatureCoreDefinition.ElementFor(id);
                core.mesh = AssetDatabase.LoadAssetAtPath<Mesh>(Root + "/Cores/" + id + ".asset");
                core.emissionColor = CreaturePalette.Get(CreaturePalette.ElementColor(id));
                core.emissionIntensity = CreatureCoreDefinition.IntensityFor(id);
                core.combatTag = CreatureCoreDefinition.CombatTagFor(id);
                core.vfxPrefab = null;
                EditorUtility.SetDirty(core);
                database.cores.Add(core);
            }

            EditorUtility.SetDirty(database);
            report.AppendLine("part definitions=" + database.parts.Count + " core definitions=" + database.cores.Count);
            return database;
        }

        static string Prettify(string id)
        {
            var parts = id.Split('_');
            var sb = new StringBuilder();
            for (var i = 1; i < parts.Length; i++)
            {
                if (parts[i].Length == 2 && int.TryParse(parts[i], out _))
                {
                    continue;
                }

                if (sb.Length > 0)
                {
                    sb.Append(' ');
                }

                sb.Append(parts[i].Substring(0, 1)).Append(parts[i].Substring(1).ToLowerInvariant());
            }

            return sb.Length > 0 ? sb.ToString() : id;
        }

        static CreatureRarity RarityFor(string id)
        {
            if (id.Contains("VOID")) return CreatureRarity.Legendary;
            if (id.Contains("CRYSTAL") || id.Contains("INFERNAL") || id.Contains("ELEMENTAL")) return CreatureRarity.Epic;
            if (id.Contains("ARCANE") || id.Contains("DRACONIC") || id.Contains("ARMORED")) return CreatureRarity.Rare;
            if (id.Contains("_02") || id.Contains("_04")) return CreatureRarity.Uncommon;
            return CreatureRarity.Common;
        }

        static string SocketFor(CreatureSlot slot)
        {
            return slot switch
            {
                CreatureSlot.Head => "HEAD_SOCKET",
                CreatureSlot.Eyes => "EYE_L,EYE_R",
                CreatureSlot.Horns => "HORN_L,HORN_R",
                CreatureSlot.Limbs => "FRONT_L,FRONT_R,REAR_L,REAR_R",
                CreatureSlot.Tail => "TAIL",
                CreatureSlot.Back => "BACK_L,BACK_R",
                CreatureSlot.Core => "CORE",
                _ => "BODY"
            };
        }

        static string[] MutationsFor(string id)
        {
            var list = new List<string>();
            if (id.Contains("CRYSTAL") && id.StartsWith("HORNS")) list.Add(CreatureMutations.CrystalHorns);
            if (id.StartsWith("TAIL") && id.Contains("SERPENT")) list.Add(CreatureMutations.VoidTail);
            if (id.StartsWith("EYES")) list.Add(CreatureMutations.GenesisEyes);
            if (id == "CORE_01_EMBER") list.Add(CreatureMutations.EmberCoreOvercharge);
            return list.ToArray();
        }

        // ------------------------------------------------------------- PREFABS

        static void BuildPrefabs(StringBuilder report)
        {
            var basePrefab = SavePrefab(new CreatureDNA(), "GenoryxCreature", true);
            report.AppendLine("prefab base=" + basePrefab);

            foreach (var preset in CreaturePresets.All)
            {
                var path = SavePrefab(CreaturePresets.Get(preset), "GenoryxCreature_" + preset.Replace("PRESET_", ""), false);
                report.AppendLine("prefab preset=" + path);
            }
        }

        static string SavePrefab(CreatureDNA dna, string name, bool withGameplay)
        {
            var go = CreatureAssembler.Spawn(name, Vector3.zero, dna);
            go.AddComponent<CreatureMotor>();
            go.AddComponent<CreatureSecondaryMotion>();
            if (withGameplay)
            {
                go.AddComponent<CreatureLod>();
            }

            var path = Root + "/Prefabs/" + name + ".prefab";
            PrefabUtility.SaveAsPrefabAsset(go, path);
            Object.DestroyImmediate(go);
            return path;
        }

        // --------------------------------------------------------------- SCENE

        static void BuildTestScene(StringBuilder report)
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var camera = new GameObject("Main Camera");
            camera.tag = "MainCamera";
            camera.AddComponent<Camera>();

            var builder = new GameObject("CreatureAssemblyTest");
            builder.AddComponent<CreatureAssemblyTestBuilder>();
            builder.AddComponent<GenoryxCreatureCapture>();

            EnsureFolder("Assets/GENORYX/Scenes");
            EditorSceneManager.SaveScene(scene, ScenePath);
            report.AppendLine("cena=" + ScenePath);
        }
    }
}
