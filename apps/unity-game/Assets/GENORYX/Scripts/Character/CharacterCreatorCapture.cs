using System.Collections;
using System.IO;
using System.Text;
using UnityEngine;

namespace Genoryx
{
    public class CharacterCreatorCapture : MonoBehaviour
    {
        public CharacterAssembler assembler;

        IEnumerator Start()
        {
            var capture = false;
            foreach (var arg in System.Environment.GetCommandLineArgs())
            {
                if (arg == "-genoryxCapture")
                {
                    capture = true;
                }
            }

            var dir = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "Captures", "modular-character-final"));
            if (!capture)
            {
                yield break;
            }

            Directory.CreateDirectory(dir);
            Debug.Log("[GENORYX] Capture Start dir=" + dir);

            if (assembler == null)
            {
                assembler = FindFirstObjectByType<CharacterAssembler>();
            }

            var deadline = Time.realtimeSinceStartup + 90f;
            while ((assembler == null || !assembler.ready) && Time.realtimeSinceStartup < deadline)
            {
                if (assembler == null)
                {
                    assembler = FindFirstObjectByType<CharacterAssembler>();
                }

                yield return null;
            }

            if (assembler == null)
            {
                File.WriteAllText(Path.Combine(dir, "validation.txt"), "FAIL: assembler não encontrado");
                File.WriteAllText(Path.Combine(dir, "DONE"), "fail");
                yield break;
            }

            yield return Shot(dir, "A_hair_01", () => assembler.SetHair("hair_01"));
            yield return Shot(dir, "B_hair_02", () => assembler.SetHair("hair_02"));
            yield return Shot(dir, "C_chest_01", () => assembler.SetChest("chest_01"));
            yield return Shot(dir, "D_chest_02", () => assembler.SetChest("chest_02"));
            yield return Shot(dir, "E_skin_ivory", () => assembler.SetSkinTone("ivory"));
            yield return Shot(dir, "F_skin_ebony", () => assembler.SetSkinTone("ebony"));
            if (assembler.previewPivot != null)
            {
                assembler.previewPivot.rotation = Quaternion.identity;
                yield return Shot(dir, "front", null);
                assembler.previewPivot.rotation = Quaternion.Euler(0f, 40f, 0f);
                yield return Shot(dir, "three_quarter", null);
                assembler.previewPivot.rotation = Quaternion.Euler(0f, 180f, 0f);
                yield return Shot(dir, "back", null);
            }

            var report = CharacterCreatorValidation.Run(assembler) + "\n\n" + DumpHierarchy(assembler);
            File.WriteAllText(Path.Combine(dir, "validation.txt"), report);
            File.WriteAllText(Path.Combine(dir, "DONE"), "ok");
            Debug.Log("[GENORYX] Capturas em " + dir + "\n" + report);
        }

        IEnumerator Shot(string dir, string name, System.Action apply)
        {
            apply?.Invoke();
            var waitUntil = Time.realtimeSinceStartup + 12f;
            while (Time.realtimeSinceStartup < waitUntil)
            {
                if (assembler != null && assembler.HasSkinnedMesh())
                {
                    break;
                }

                yield return null;
            }

            yield return new WaitForSeconds(2.2f);
            var path = Path.Combine(dir, name + ".png");
            var cam = Camera.main;
            if (cam == null)
            {
                File.WriteAllText(path + ".error.txt", "Camera.main ausente");
                yield break;
            }

            var width = 1280;
            var height = 720;
            var rt = new RenderTexture(width, height, 24);
            var prev = cam.targetTexture;
            cam.targetTexture = rt;
            yield return null;
            RenderTexture.active = rt;
            var tex = new Texture2D(width, height, TextureFormat.RGB24, false);
            tex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            tex.Apply();
            cam.targetTexture = prev;
            RenderTexture.active = null;
            File.WriteAllBytes(path, tex.EncodeToPNG());
            UnityEngine.Object.Destroy(tex);
            rt.Release();
            UnityEngine.Object.Destroy(rt);
            Debug.Log("[GENORYX] Shot " + name);
        }

        void OnGUI()
        {
            if (assembler == null || assembler.visualRoot == null)
            {
                return;
            }

            GUI.Box(new Rect(12, 12, 440, 240), "HIERARCHY / CharacterRoot");
            GUI.Label(new Rect(24, 40, 420, 200), DumpHierarchy(assembler));
        }

        static string DumpHierarchy(CharacterAssembler assembler)
        {
            if (assembler == null)
            {
                return "assembler null";
            }

            var lines = new StringBuilder();
            lines.AppendLine(assembler.gameObject.name);
            lines.AppendLine("CharacterAssembler=" + assembler.GetType().Name);
            lines.AppendLine("Animator=" + (assembler.animator != null));
            lines.AppendLine("Skinned=" + assembler.HasSkinnedMesh());
            lines.AppendLine("HairRenderer=" + (assembler.HairRenderer() != null ? assembler.HairRenderer().name : "null"));
            lines.AppendLine("ChestRenderer=" + (assembler.ChestRenderer() != null ? assembler.ChestRenderer().name : "null"));
            lines.AppendLine("hair=" + assembler.appearance.hairId);
            lines.AppendLine("chest=" + assembler.appearance.chestId);
            lines.AppendLine("skin=" + assembler.appearance.skinTone);
            if (assembler.visualRoot != null)
            {
                foreach (var t in assembler.visualRoot.GetComponentsInChildren<Transform>(true))
                {
                    lines.AppendLine("  " + t.name);
                }
            }

            return lines.ToString();
        }
    }
}
