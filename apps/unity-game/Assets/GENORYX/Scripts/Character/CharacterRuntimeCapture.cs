using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Genoryx
{
    public class CharacterRuntimeCapture : MonoBehaviour
    {
        public CharacterAssembler assembler;
        readonly StringBuilder report = new StringBuilder();
        string dir;
        int goBefore;
        int animBefore;
        int skinBefore;

        IEnumerator Start()
        {
            if (!ShouldRun())
            {
                yield break;
            }

            dir = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "Captures", "character-runtime-final"));
            Directory.CreateDirectory(dir);
            Directory.CreateDirectory(Path.Combine(dir, "locomotion"));
            report.AppendLine("GENORYX Character Runtime Capture");
            report.AppendLine("source=Unity Play Mode Game Camera");
            report.AppendLine("blender=false");

            assembler ??= FindFirstObjectByType<CharacterAssembler>();
            var deadline = Time.realtimeSinceStartup + 45f;
            while ((assembler == null || !assembler.ready) && Time.realtimeSinceStartup < deadline)
            {
                assembler ??= FindFirstObjectByType<CharacterAssembler>();
                yield return null;
            }

            if (assembler == null)
            {
                File.WriteAllText(Path.Combine(dir, "FAIL.txt"), "assembler ausente");
                Quit(1);
                yield break;
            }

            yield return ApplyAndWait(CharacterAppearanceData.VariantA());
            yield return OrbitShot("01_creator_variant_a_front.png", 180f, false);
            yield return OrbitShot("02_creator_variant_a_threequarter.png", 145f, false);
            yield return OrbitShot("03_creator_variant_a_back.png", 0f, false);

            yield return ApplyAndWait(CharacterAppearanceData.VariantB());
            yield return OrbitShot("04_creator_variant_b_front.png", 180f, false);
            yield return OrbitShot("05_creator_variant_b_threequarter.png", 145f, false);
            yield return OrbitShot("06_creator_variant_b_back.png", 0f, false);

            yield return ApplyAndWait(CharacterAppearanceData.VariantA());
            assembler.SetHair("hair_02");
            yield return WaitVisual();
            yield return OrbitShot("07_creator_hair_swap.png", 180f, true);
            assembler.SetChest("chest_02");
            yield return WaitVisual();
            yield return OrbitShot("08_creator_chest_swap.png", 180f, false);
            assembler.SetLegs("pants_02");
            yield return WaitVisual();
            yield return OrbitShot("09_creator_pants_swap.png", 180f, false);
            assembler.SetBoots("boots_02");
            yield return WaitVisual();
            yield return OrbitShot("10_creator_boots_swap.png", 180f, false);
            assembler.SetSkinTone("ebony");
            yield return WaitVisual(0.2f);
            yield return OrbitShot("11_creator_skin_swap.png", 180f, true);
            assembler.SetHairColor("blonde");
            yield return WaitVisual(0.2f);
            yield return OrbitShot("12_creator_hair_color_swap.png", 180f, true);

            yield return RoundTripSwaps();
            yield return SwapLeakTest();
            yield return ApplyAndWait(CharacterAppearanceData.VariantA());
            yield return LocomotionProof();

            CharacterAppearanceStore.Save(CharacterAppearanceData.VariantA());
            report.AppendLine(CharacterAppearanceRuntimeValidator.Compare(CharacterAppearanceData.VariantA(), CharacterAppearanceStore.Load(), "save-variant-a"));

            yield return SceneManager.LoadSceneAsync("HavenSlice");
            yield return null;
            HavenSliceBuilder.Rebuild();
            yield return new WaitForSeconds(1.5f);
            var havenDeadline = Time.realtimeSinceStartup + 90f;
            assembler = null;
            while (Time.realtimeSinceStartup < havenDeadline)
            {
                var player = GameObject.Find("Player");
                assembler = player != null ? player.GetComponent<CharacterAssembler>() : null;
                if (assembler != null && assembler.ready && assembler.HasSkinnedMesh())
                {
                    break;
                }

                yield return null;
            }

            report.AppendLine(CharacterAppearanceRuntimeValidator.CompareCreatorHaven(assembler));
            report.AppendLine(CharacterAppearanceRuntimeValidator.Integrity(assembler));
            FrameHavenCamera(assembler != null ? assembler.transform : null, 0f);
            yield return Shot("13_haven_variant_a.png");

            if (assembler != null)
            {
                yield return ApplyAndWait(CharacterAppearanceData.VariantB());
            }

            CharacterAppearanceStore.Save(CharacterAppearanceData.VariantB());
            var npc = GameObject.Find("Npc_Theo");
            var npcAssembler = npc != null ? npc.GetComponent<CharacterAssembler>() : null;
            npcAssembler?.ApplyAppearance(CharacterAppearanceData.VariantA());
            FrameHavenCamera(assembler != null ? assembler.transform : null, 18f);
            yield return new WaitForSeconds(0.8f);
            yield return Shot("14_haven_variant_b.png");
            report.AppendLine(CharacterAppearanceRuntimeValidator.Compare(CharacterAppearanceData.VariantB(), assembler != null ? assembler.appearance : null, "haven-variant-b"));

            yield return HavenLocomotionShots();
            CrowdMetrics();

            File.WriteAllText(Path.Combine(dir, "runtime_report.txt"), report.ToString());
            File.WriteAllText(Path.Combine(dir, "DONE"), "ok");
            Debug.Log("[GENORYX] Runtime capture done\n" + report);
            Quit(0);
        }

        static bool ShouldRun()
        {
            foreach (var arg in System.Environment.GetCommandLineArgs())
            {
                if (arg == "-genoryxRuntimeCapture")
                {
                    return true;
                }
            }

            if (File.Exists(Path.Combine(Application.dataPath, "..", "Captures", "ENABLE_RUNTIME")))
            {
                return true;
            }
#if UNITY_EDITOR
            return UnityEditor.EditorPrefs.GetBool("genoryx.runtimeCapture");
#else
            return false;
#endif
        }

        IEnumerator ApplyAndWait(CharacterAppearanceData data)
        {
            assembler.ApplyAppearance(data);
            yield return WaitApplied();
        }

        IEnumerator WaitApplied()
        {
            yield return null;
            var deadline = Time.realtimeSinceStartup + 25f;
            while (assembler != null && !assembler.ready && Time.realtimeSinceStartup < deadline)
            {
                yield return null;
            }

            yield return new WaitForSeconds(0.35f);
        }

        IEnumerator WaitVisual(float extra = 0.45f)
        {
            var deadline = Time.realtimeSinceStartup + 12f;
            while (assembler != null && !assembler.HasSkinnedMesh() && Time.realtimeSinceStartup < deadline)
            {
                yield return null;
            }

            yield return new WaitForSeconds(extra);
        }

        IEnumerator OrbitShot(string file, float yaw, bool close)
        {
            if (assembler != null && assembler.previewPivot != null)
            {
                assembler.previewPivot.rotation = Quaternion.identity;
            }

            var orbit = FindFirstObjectByType<CreatorOrbit>();
            if (orbit != null)
            {
                orbit.yaw = yaw;
                orbit.pitch = close ? 6f : 8f;
                orbit.distance = close ? 2.7f : 4.5f;
                orbit.lookHeight = close ? 1.48f : 0.92f;
            }

            yield return new WaitForSeconds(0.25f);
            yield return Shot(file);
        }

        IEnumerator Shot(string file)
        {
            yield return new WaitForEndOfFrame();
            var cam = Camera.main != null ? Camera.main : FindFirstObjectByType<Camera>();
            if (cam == null)
            {
                File.WriteAllText(Path.Combine(dir, file + ".error.txt"), "Camera.main ausente");
                yield break;
            }

            var width = 1280;
            var height = 720;
            var rt = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32);
            var prev = cam.targetTexture;
            cam.targetTexture = rt;
            cam.Render();
            RenderTexture.active = rt;
            var tex = new Texture2D(width, height, TextureFormat.RGB24, false);
            tex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            tex.Apply();
            cam.targetTexture = prev;
            RenderTexture.active = null;
            File.WriteAllBytes(Path.Combine(dir, file), tex.EncodeToPNG());
            Destroy(tex);
            rt.Release();
            Destroy(rt);
            report.AppendLine("shot " + file);
            Debug.Log("[GENORYX] Runtime shot " + file);
        }

        IEnumerator RoundTripSwaps()
        {
            int Animators() => assembler.GetComponentsInChildren<Animator>(true).Length;
            int Skins() => assembler.GetComponentsInChildren<SkinnedMeshRenderer>(true).Length;
            var a0 = Animators();
            var s0 = Skins();
            void Trip(string label, int anim, int skins)
            {
                report.AppendLine(label + " anim=" + anim + " skins=" + skins + (anim > a0 || skins > s0 + 2 ? " FAIL leftover" : " OK"));
            }

            assembler.SetHair("hair_01"); yield return WaitVisual(0.2f);
            assembler.SetHair("hair_02"); yield return WaitVisual(0.2f);
            assembler.SetHair("hair_01"); yield return WaitVisual(0.2f);
            Trip("hair-roundtrip", Animators(), Skins());
            assembler.SetChest("chest_01"); yield return WaitVisual(0.2f);
            assembler.SetChest("chest_02"); yield return WaitVisual(0.2f);
            assembler.SetChest("chest_01"); yield return WaitVisual(0.2f);
            Trip("chest-roundtrip", Animators(), Skins());
            assembler.SetLegs("pants_01"); yield return WaitVisual(0.2f);
            assembler.SetLegs("pants_02"); yield return WaitVisual(0.2f);
            assembler.SetLegs("pants_01"); yield return WaitVisual(0.2f);
            Trip("pants-roundtrip", Animators(), Skins());
            assembler.SetBoots("boots_01"); yield return WaitVisual(0.2f);
            assembler.SetBoots("boots_02"); yield return WaitVisual(0.2f);
            assembler.SetBoots("boots_01"); yield return WaitVisual(0.2f);
            Trip("boots-roundtrip", Animators(), Skins());
            assembler.SetSkinTone("ivory"); yield return WaitVisual(0.1f);
            assembler.SetSkinTone("ebony"); yield return WaitVisual(0.1f);
            assembler.SetSkinTone("ivory"); yield return WaitVisual(0.1f);
            assembler.SetHairColor("black"); yield return WaitVisual(0.1f);
            assembler.SetHairColor("blonde"); yield return WaitVisual(0.1f);
            assembler.SetHairColor("black"); yield return WaitVisual(0.1f);
            assembler.SetEyeColor("brown"); yield return WaitVisual(0.1f);
            assembler.SetEyeColor("blue"); yield return WaitVisual(0.1f);
            assembler.SetEyeColor("brown"); yield return WaitVisual(0.1f);
            Trip("tint-roundtrip", Animators(), Skins());
        }

        IEnumerator SwapLeakTest()
        {
            goBefore = Resources.FindObjectsOfTypeAll<GameObject>().Length;
            animBefore = FindObjectsByType<Animator>(FindObjectsSortMode.None).Length;
            skinBefore = FindObjectsByType<SkinnedMeshRenderer>(FindObjectsSortMode.None).Length;
            for (var i = 0; i < 100; i++)
            {
                var data = CharacterAppearanceData.RandomValid();
                assembler.SetHair(data.hairId);
                assembler.SetChest(data.chestId);
                assembler.SetLegs(data.legsId);
                assembler.SetBoots(data.bootsId);
                assembler.SetFace(data.faceId);
                assembler.SetSkinTone(data.skinTone);
                assembler.SetHairColor(data.hairColor);
                assembler.SetEyeColor(data.eyeColor);
                if (i % 10 == 0)
                {
                    yield return WaitVisual(0.12f);
                }
                else
                {
                    yield return null;
                }
            }

            yield return new WaitForSeconds(0.6f);
            yield return Resources.UnloadUnusedAssets();
            var goAfter = Resources.FindObjectsOfTypeAll<GameObject>().Length;
            var animAfter = FindObjectsByType<Animator>(FindObjectsSortMode.None).Length;
            var skinAfter = FindObjectsByType<SkinnedMeshRenderer>(FindObjectsSortMode.None).Length;
            report.AppendLine($"swap100 go {goBefore}->{goAfter} anim {animBefore}->{animAfter} skins {skinBefore}->{skinAfter} sharedMats={CharacterSharedMaterials.UniqueMaterialCount()}");
            report.AppendLine(CharacterAppearanceRuntimeValidator.Integrity(assembler));
        }

            IEnumerator LocomotionProof()
        {
            FrameCreatorBody();
            var driver = assembler.GetComponent<CharacterLocomotionDriver>();
            var deadline = Time.realtimeSinceStartup + 12f;
            while ((driver == null || !driver.GraphIsReady) && Time.realtimeSinceStartup < deadline)
            {
                driver = assembler.GetComponent<CharacterLocomotionDriver>();
                yield return null;
            }

            if (driver == null || !driver.GraphIsReady)
            {
                report.AppendLine("FAIL locomotion graph not ready");
                yield break;
            }

            Transform bone = null;
            try
            {
                if (assembler.animator != null && assembler.animator.avatar != null)
                {
                    bone = assembler.animator.GetBoneTransform(HumanBodyBones.LeftUpperLeg);
                }
            }
            catch (System.InvalidOperationException)
            {
            }

            bone ??= BoneMapper.FindCanonical(assembler.bodySlot, "LeftUpperLeg")
                       ?? BoneMapper.FindCanonical(assembler.bodySlot, "LeftUpLeg")
                       ?? BoneMapper.FindCanonical(assembler.bodySlot, "LeftLowerLeg")
                       ?? BoneMapper.FindCanonical(assembler.bodySlot, "Hips");
            yield return ForceAndShot(driver, bone, 0f, "15_idle_runtime.png", 1.2f, 0);
            yield return ForceAndShot(driver, bone, 2.2f, "16_walk_runtime.png", 0.62f, 1);
            yield return ForceAndShot(driver, bone, 6.4f, "17_run_runtime.png", 0.33f, 2);
            FrameCreatorBody(110f);
            for (var i = 0; i < 8; i++)
            {
                driver.ForceSpeed(2.2f);
                yield return new WaitForSeconds(0.14f);
                yield return Shot(Path.Combine("locomotion", $"walk_{i:00}.png"));
            }

            for (var i = 0; i < 8; i++)
            {
                driver.ForceSpeed(6.4f);
                yield return new WaitForSeconds(0.09f);
                yield return Shot(Path.Combine("locomotion", $"run_{i:00}.png"));
            }

            driver.ClearForce();
        }

        void FrameCreatorBody(float yaw = 150f)
        {
            if (assembler != null && assembler.previewPivot != null)
            {
                assembler.previewPivot.rotation = Quaternion.identity;
            }

            var orbit = FindFirstObjectByType<CreatorOrbit>();
            if (orbit != null)
            {
                orbit.yaw = yaw;
                orbit.pitch = 8f;
                orbit.distance = 4.6f;
                orbit.lookHeight = 0.88f;
            }
        }

        IEnumerator HavenLocomotionShots()
        {
            if (assembler == null)
            {
                yield break;
            }

            var motor = assembler.GetComponent<PlayerMotor>();
            if (motor != null)
            {
                motor.enabled = false;
            }

            var driver = assembler.GetComponent<CharacterLocomotionDriver>();
            var deadline = Time.realtimeSinceStartup + 10f;
            while ((driver == null || !driver.GraphIsReady) && Time.realtimeSinceStartup < deadline)
            {
                driver = assembler.GetComponent<CharacterLocomotionDriver>();
                yield return null;
            }

            if (driver == null)
            {
                yield break;
            }

            FrameHavenCamera(assembler.transform, 0f);
            var bone = BoneMapper.FindCanonical(assembler.bodySlot, "LeftUpperLeg")
                       ?? BoneMapper.FindCanonical(assembler.bodySlot, "Hips");
            yield return ForceAndShot(driver, bone, 0f, Path.Combine("locomotion", "haven_idle.png"), 0.8f, 0);
            yield return ForceAndShot(driver, bone, 2.2f, Path.Combine("locomotion", "haven_walk.png"), 0.45f, 1);
            yield return ForceAndShot(driver, bone, 6.4f, Path.Combine("locomotion", "haven_run.png"), 0.22f, 2);
            driver.ClearForce();
            if (motor != null)
            {
                motor.enabled = true;
            }
        }

        IEnumerator ForceAndShot(CharacterLocomotionDriver driver, Transform bone, float speed, string file, float wait, int mixer)
        {
            driver.ForceSpeed(speed);
            var start = bone != null ? bone.position : Vector3.zero;
            var t0 = driver.ClipTime(mixer);
            yield return new WaitForSeconds(wait);
            var moved = bone != null && (bone.position - start).sqrMagnitude > 0.0004f;
            var advanced = driver.ClipTime(mixer) > t0 + 0.02d;
            report.AppendLine($"{file} graph={driver.GraphIsReady} mix{mixer}={driver.MixerWeight(mixer):0.00} clipT={driver.ClipTime(mixer):0.00} boneMoved={moved} clipAdvanced={advanced} idle={(driver.IdleClip != null)} walk={(driver.WalkClip != null)} run={(driver.RunClip != null)}");
            yield return Shot(file);
        }

        void FrameHavenCamera(Transform target, float yaw)
        {
            var cam = Camera.main != null ? Camera.main : FindFirstObjectByType<Camera>();
            if (cam == null || target == null)
            {
                return;
            }

            var look = target.position + Vector3.up * 1.05f;
            var rot = Quaternion.Euler(8f, yaw, 0f);
            cam.transform.position = look + rot * new Vector3(0f, 0f, -3.4f);
            cam.transform.LookAt(look);
            var rig = cam.GetComponent<WorldCameraRig>();
            if (rig != null)
            {
                rig.enabled = false;
            }
        }

        void CrowdMetrics()
        {
            var skins = FindObjectsByType<SkinnedMeshRenderer>(FindObjectsSortMode.None).Length;
            var anim = FindObjectsByType<Animator>(FindObjectsSortMode.None).Length;
            var players = 0;
            var npcs = 0;
            var creatures = 0;
            foreach (var assembler in FindObjectsByType<CharacterAssembler>(FindObjectsSortMode.None))
            {
                if (assembler.name.StartsWith("Player") || assembler.name.StartsWith("CrowdTamer") || assembler.name.StartsWith("Remote_"))
                {
                    players += 1;
                }
                else if (assembler.name.StartsWith("Npc_"))
                {
                    npcs += 1;
                }
            }

            creatures = GameObject.FindObjectsByType<CompanionFollower>(FindObjectsSortMode.None).Length;
            var fps = 1f / Mathf.Max(Time.unscaledDeltaTime, 0.0001f);
            report.AppendLine($"crowd players={players} npcs={npcs} creatures={creatures} skins={skins} animators={anim} fps~={fps:0.0} sharedMats={CharacterSharedMaterials.UniqueMaterialCount()}");
#if UNITY_EDITOR
            report.AppendLine($"unityStats tris={UnityEditor.UnityStats.triangles} batches={UnityEditor.UnityStats.batches} setPass={UnityEditor.UnityStats.setPassCalls}");
#endif
        }

        static void Quit(int code)
        {
#if UNITY_EDITOR
            UnityEditor.EditorPrefs.DeleteKey("genoryx.runtimeCapture");
            var enable = Path.Combine(Application.dataPath, "..", "Captures", "ENABLE_RUNTIME");
            if (File.Exists(enable))
            {
                File.Delete(enable);
            }

            UnityEditor.EditorApplication.isPlaying = false;
            UnityEditor.EditorApplication.Exit(code);
#else
            Application.Quit(code);
#endif
        }
    }
}
