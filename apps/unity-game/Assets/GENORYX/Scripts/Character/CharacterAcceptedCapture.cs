using System.Collections;
using System.Diagnostics;
using System.IO;
using System.Text;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Genoryx
{
    public class CharacterAcceptedCapture : MonoBehaviour
    {
        public CharacterAssembler assembler;
        readonly StringBuilder report = new StringBuilder();
        string dir;

        public static bool Enabled()
        {
            foreach (var arg in System.Environment.GetCommandLineArgs())
            {
                if (arg == "-genoryxAcceptedCapture")
                {
                    return true;
                }
            }

            if (File.Exists(Path.Combine(Application.dataPath, "..", "Captures", "ENABLE_ACCEPTED")))
            {
                return true;
            }
#if UNITY_EDITOR
            return UnityEditor.EditorPrefs.GetBool("genoryx.acceptedCapture");
#else
            return false;
#endif
        }

        IEnumerator Start()
        {
            if (!Enabled())
            {
                yield break;
            }

            dir = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "Captures", "character-accepted"));
            Directory.CreateDirectory(dir);
            Directory.CreateDirectory(Path.Combine(dir, "locomotion"));
            report.AppendLine("GENORYX Character Accepted Capture");
            report.AppendLine("source=Unity Play Mode Game Camera");
            report.AppendLine("meshy=0");

            assembler ??= FindFirstObjectByType<CharacterAssembler>();
            var deadline = Time.realtimeSinceStartup + 60f;
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

            LogAvatar();
            var bodyOnly = CharacterAppearanceData.Phase1();
            bodyOnly.hairId = "hair_none";
            bodyOnly.chestId = "chest_none";
            bodyOnly.legsId = "pants_none";
            bodyOnly.bootsId = "boots_none";
            yield return ApplyAndWait(bodyOnly);
            yield return Full("01_body.png");

            yield return ApplyAndWait(With(bodyOnly, hair: "hair_01"));
            yield return CloseHair("02_hair01.png");
            yield return ApplyAndWait(With(bodyOnly, hair: "hair_02"));
            yield return CloseHair("03_hair02.png");

            yield return ApplyAndWait(With(bodyOnly, chest: "chest_01"));
            yield return ChestShot("04_chest01.png");
            yield return ApplyAndWait(With(bodyOnly, chest: "chest_02"));
            yield return ChestShot("05_chest02.png");

            yield return ApplyAndWait(With(bodyOnly, legs: "pants_01"));
            yield return LegsShot("06_pants01.png");
            yield return ApplyAndWait(With(bodyOnly, legs: "pants_02"));
            yield return LegsShot("07_pants02.png");

            yield return ApplyAndWait(With(bodyOnly, boots: "boots_01"));
            yield return LegsShot("08_boots01.png");
            yield return ApplyAndWait(With(bodyOnly, boots: "boots_02"));
            yield return LegsShot("09_boots02.png");

            var faceBase = CharacterAppearanceData.VariantA();
            faceBase.hairId = "hair_none";
            yield return ApplyAndWait(With(faceBase, face: "face_01"));
            yield return FaceShot("10_face01_close.png");
            yield return ApplyAndWait(With(faceBase, face: "face_02"));
            yield return FaceShot("11_face02_close.png");
            yield return ApplyAndWait(With(faceBase, face: "face_03"));
            yield return FaceShot("12_face03_close.png");

            yield return ApplyAndWait(With(CharacterAppearanceData.VariantA(), hair: "hair_none", eyes: "brown"));
            yield return FaceShot("13_eye_brown_close.png");
            assembler.SetEyeColor("blue");
            yield return WaitVisual(0.25f);
            yield return FaceShot("14_eye_blue_close.png");

            yield return ApplyAndWait(With(CharacterAppearanceData.VariantA(), skin: "ivory"));
            yield return Full("15_skin_ivory.png");
            yield return ApplyAndWait(With(CharacterAppearanceData.VariantA(), skin: "ebony"));
            yield return Full("16_skin_ebony.png");

            yield return ApplyAndWait(CharacterAppearanceData.VariantA());
            yield return Full("17_full_variant_a_front.png");
            yield return Orbit("18_full_variant_a_back.png", 0f, false);
            yield return ApplyAndWait(CharacterAppearanceData.VariantB());
            yield return Full("19_full_variant_b_front.png");
            yield return Orbit("20_full_variant_b_back.png", 0f, false);

            yield return ApplyAndWait(CharacterAppearanceData.VariantA());
            yield return Locomotion();

            CharacterAppearanceStore.Save(CharacterAppearanceData.VariantA());
            yield return SceneManager.LoadSceneAsync("HavenSlice");
            yield return null;
            HavenSliceBuilder.Rebuild();
            yield return new WaitForSeconds(1.6f);
            assembler = WaitPlayer();
            var havenDeadline = Time.realtimeSinceStartup + 90f;
            while ((assembler == null || !assembler.ready) && Time.realtimeSinceStartup < havenDeadline)
            {
                assembler = WaitPlayer();
                yield return null;
            }

            FrameHaven(assembler != null ? assembler.transform : null, 0f);
            yield return Shot("24_haven_variant_a.png");
            if (assembler != null)
            {
                yield return ApplyAndWait(CharacterAppearanceData.VariantB());
            }

            CharacterAppearanceStore.Save(CharacterAppearanceData.VariantB());
            FrameHaven(assembler != null ? assembler.transform : null, 18f);
            yield return new WaitForSeconds(0.6f);
            yield return Shot("25_haven_variant_b.png");
            LogPyron();
            LogPerformance();
            TryFfmpeg();
            File.WriteAllText(Path.Combine(dir, "accepted_report.txt"), report.ToString());
            File.WriteAllText(Path.Combine(dir, "DONE"), "ok");
            UnityEngine.Debug.Log("[GENORYX] Accepted capture done\n" + report);
            Quit(0);
        }

        static CharacterAppearanceData With(
            CharacterAppearanceData src,
            string hair = null,
            string chest = null,
            string legs = null,
            string boots = null,
            string face = null,
            string skin = null,
            string eyes = null)
        {
            var data = CharacterAppearanceData.FromJson(src.ToJson());
            if (hair != null)
            {
                data.hairId = hair;
            }

            if (chest != null)
            {
                data.chestId = chest;
            }

            if (legs != null)
            {
                data.legsId = legs;
            }

            if (boots != null)
            {
                data.bootsId = boots;
            }

            if (face != null)
            {
                data.faceId = face;
            }

            if (skin != null)
            {
                data.skinTone = skin;
            }

            if (eyes != null)
            {
                data.eyeColor = eyes;
            }

            return data;
        }

        void LogAvatar()
        {
            var avatar = assembler != null && assembler.animator != null ? assembler.animator.avatar : null;
            report.AppendLine("avatarNull=" + (avatar == null));
            report.AppendLine("isValid=" + (avatar != null && avatar.isValid));
            report.AppendLine("isHuman=" + (avatar != null && avatar.isHuman));
            report.AppendLine("animators=" + assembler.GetComponentsInChildren<Animator>(true).Length);
        }

        IEnumerator Locomotion()
        {
            FrameBody();
            var driver = assembler.GetComponent<CharacterLocomotionDriver>();
            var deadline = Time.realtimeSinceStartup + 8f;
            while ((driver == null || !driver.GraphIsReady) && Time.realtimeSinceStartup < deadline)
            {
                driver = assembler.GetComponent<CharacterLocomotionDriver>();
                yield return null;
            }

            yield return ForceBones(driver, 0f, "21_idle.png", 1.15f, "Idle");
            yield return ForceBones(driver, 2.2f, "22_walk.png", 0.55f, "Walk");
            yield return ForceBones(driver, 6.4f, "23_run.png", 0.35f, "Run");
            FrameBody(120f);
            for (var i = 0; i < 6; i++)
            {
                driver?.ForceSpeed(2.2f);
                yield return new WaitForSeconds(0.12f);
                yield return Shot(Path.Combine("locomotion", $"walk_{i:00}.png"));
            }

            for (var i = 0; i < 6; i++)
            {
                driver?.ForceSpeed(6.4f);
                yield return new WaitForSeconds(0.08f);
                yield return Shot(Path.Combine("locomotion", $"run_{i:00}.png"));
            }

            driver?.ClearForce();
        }

        IEnumerator ForceBones(CharacterLocomotionDriver driver, float speed, string file, float wait, string label)
        {
            var before = BoneMovementValidator.Capture(assembler.animator);
            driver?.ForceSpeed(speed);
            yield return new WaitForSeconds(wait);
            var after = BoneMovementValidator.Capture(assembler.animator);
            var moved = BoneMovementValidator.Moved(before, after);
            report.AppendLine(label + " boneMoved=" + moved + " avatarHuman=" + (assembler.animator != null && assembler.animator.avatar != null && assembler.animator.avatar.isHuman));
            yield return Shot(file);
        }

        IEnumerator ApplyAndWait(CharacterAppearanceData data)
        {
            assembler.ApplyAppearance(data);
            var deadline = Time.realtimeSinceStartup + 25f;
            while (assembler != null && !assembler.ready && Time.realtimeSinceStartup < deadline)
            {
                yield return null;
            }

            yield return new WaitForSeconds(0.35f);
        }

        IEnumerator WaitVisual(float extra)
        {
            yield return new WaitForSeconds(extra);
        }

        IEnumerator Full(string file)
        {
            yield return Orbit(file, 180f, false);
        }

        IEnumerator CloseHair(string file)
        {
            yield return Orbit(file, 180f, true);
        }

        IEnumerator FaceShot(string file)
        {
            var orbit = FindFirstObjectByType<CreatorOrbit>();
            if (orbit != null)
            {
                orbit.Frame("FACE");
                orbit.yaw = 180f;
            }

            yield return new WaitForSeconds(0.2f);
            yield return Shot(file);
        }

        IEnumerator ChestShot(string file)
        {
            var orbit = FindFirstObjectByType<CreatorOrbit>();
            if (orbit != null)
            {
                orbit.Frame("CHEST");
                orbit.yaw = 180f;
            }

            yield return new WaitForSeconds(0.2f);
            yield return Shot(file);
        }

        IEnumerator LegsShot(string file)
        {
            var orbit = FindFirstObjectByType<CreatorOrbit>();
            if (orbit != null)
            {
                orbit.Frame("LEGS");
                orbit.yaw = 180f;
            }

            yield return new WaitForSeconds(0.2f);
            yield return Shot(file);
        }

        IEnumerator Orbit(string file, float yaw, bool close)
        {
            if (assembler != null && assembler.previewPivot != null)
            {
                assembler.previewPivot.rotation = Quaternion.identity;
            }

            var orbit = FindFirstObjectByType<CreatorOrbit>();
            if (orbit != null)
            {
                orbit.yaw = yaw;
                orbit.pitch = close ? 8f : 8f;
                orbit.distance = close ? 1.7f : 4.4f;
                orbit.lookHeight = close ? 1.56f : 0.95f;
            }

            yield return new WaitForSeconds(0.2f);
            yield return Shot(file);
        }

        void FrameBody(float yaw = 160f)
        {
            var orbit = FindFirstObjectByType<CreatorOrbit>();
            if (orbit != null)
            {
                orbit.yaw = yaw;
                orbit.pitch = 8f;
                orbit.distance = 4.5f;
                orbit.lookHeight = 0.9f;
            }
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

            var rt = new RenderTexture(1280, 720, 24, RenderTextureFormat.ARGB32);
            var prev = cam.targetTexture;
            cam.targetTexture = rt;
            cam.Render();
            RenderTexture.active = rt;
            var tex = new Texture2D(1280, 720, TextureFormat.RGB24, false);
            tex.ReadPixels(new Rect(0, 0, 1280, 720), 0, 0);
            tex.Apply();
            cam.targetTexture = prev;
            RenderTexture.active = null;
            File.WriteAllBytes(Path.Combine(dir, file), tex.EncodeToPNG());
            Destroy(tex);
            rt.Release();
            Destroy(rt);
            report.AppendLine("shot " + file);
        }

        static CharacterAssembler WaitPlayer()
        {
            var player = GameObject.Find("Player");
            return player != null ? player.GetComponent<CharacterAssembler>() : null;
        }

        void FrameHaven(Transform target, float yaw)
        {
            var cam = Camera.main != null ? Camera.main : FindFirstObjectByType<Camera>();
            if (cam == null || target == null)
            {
                return;
            }

            var look = target.position + Vector3.up * 1.05f;
            cam.transform.position = look + Quaternion.Euler(8f, yaw, 0f) * new Vector3(0f, 0f, -3.4f);
            cam.transform.LookAt(look);
            var rig = cam.GetComponent<WorldCameraRig>();
            if (rig != null)
            {
                rig.enabled = false;
            }
        }

        void LogPyron()
        {
            var followers = FindObjectsByType<CompanionFollower>(FindObjectsSortMode.None);
            report.AppendLine("pyronFollowers=" + followers.Length);
        }

        void LogPerformance()
        {
            var skins = FindObjectsByType<SkinnedMeshRenderer>(FindObjectsSortMode.None).Length;
            var player = WaitPlayer();
            var playerSkins = player != null ? player.GetComponentsInChildren<SkinnedMeshRenderer>(true).Length : -1;
            report.AppendLine("skinsScene=" + skins + " playerSkins=" + playerSkins);
            report.AppendLine("animators=" + FindObjectsByType<Animator>(FindObjectsSortMode.None).Length);
        }

        void TryFfmpeg()
        {
            var loco = Path.Combine(dir, "locomotion");
            var walk = Path.Combine(loco, "walk_00.png");
            if (!File.Exists(walk))
            {
                return;
            }

            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "ffmpeg",
                    Arguments = "-y -framerate 8 -i \"" + Path.Combine(loco, "walk_%02d.png") + "\" -framerate 10 -i \"" + Path.Combine(loco, "run_%02d.png") + "\" -filter_complex \"[0:v][1:v]concat=n=2:v=1:a=0\" \"" + Path.Combine(dir, "runtime_locomotion_test.mp4") + "\"",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using var p = Process.Start(psi);
                p?.WaitForExit(20000);
                report.AppendLine("ffmpegExit=" + (p?.ExitCode ?? -1));
            }
            catch (System.Exception ex)
            {
                report.AppendLine("ffmpeg=" + ex.Message);
            }
        }

        static void Quit(int code)
        {
#if UNITY_EDITOR
            UnityEditor.EditorPrefs.DeleteKey("genoryx.acceptedCapture");
            var enable = Path.Combine(Application.dataPath, "..", "Captures", "ENABLE_ACCEPTED");
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
