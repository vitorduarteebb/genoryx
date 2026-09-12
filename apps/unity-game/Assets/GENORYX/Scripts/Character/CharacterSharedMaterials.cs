using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace Genoryx
{
    public static class CharacterSharedMaterials
    {
        static readonly Dictionary<int, Material> Skin = new();
        static readonly Dictionary<int, Material> Hair = new();
        static Material eye;
        static Texture2D skinMask;
        static Shader skinShader;

        static Material underwear;

        public static Material Underwear()
        {
            if (underwear != null)
            {
                return underwear;
            }

            underwear = new Material(SliceMaterials.LitShader()) { name = "GENORYX_Underwear" };
            underwear.SetColor("_BaseColor", new Color(0.86f, 0.84f, 0.8f));
            underwear.SetFloat("_Smoothness", 0.18f);
            return underwear;
        }

        public static Material Eye()
        {
            if (eye != null)
            {
                return eye;
            }

            var shader = SliceMaterials.LitShader();
            eye = new Material(shader) { name = "GENORYX_EyeShared" };
            eye.SetColor("_BaseColor", Color.white);
            eye.SetFloat("_Smoothness", 0.78f);
            return eye;
        }

        public static Material BodySkin(Texture albedo)
        {
            EnsureShader();
            var key = albedo != null ? albedo.GetInstanceID() : 0;
            if (Skin.TryGetValue(key, out var existing) && existing != null)
            {
                return existing;
            }

            var mat = new Material(skinShader != null ? skinShader : SliceMaterials.LitShader())
            {
                name = "GENORYX_SkinShared"
            };
            if (albedo != null)
            {
                mat.SetTexture("_BaseMap", albedo);
                mat.mainTexture = albedo;
            }

            if (Mask() != null)
            {
                mat.SetTexture("_SkinMask", Mask());
            }

            mat.SetColor("_SkinTint", Color.white);
            mat.SetColor("_TargetSkinColor", new Color(0.82f, 0.64f, 0.5f));
            mat.SetFloat("_PreserveLighting", 1f);
            mat.SetFloat("_RecolorAmount", 0.92f);
            mat.SetFloat("_Smoothness", 0.34f);
            Skin[key] = mat;
            return mat;
        }

        public static Material HairShared(Texture albedo)
        {
            var key = albedo != null ? albedo.GetInstanceID() : 0;
            if (Hair.TryGetValue(key, out var existing) && existing != null)
            {
                return existing;
            }

            var mat = new Material(SliceMaterials.LitShader()) { name = "GENORYX_HairShared" };
            if (albedo != null)
            {
                mat.SetTexture("_BaseMap", albedo);
                mat.mainTexture = albedo;
            }

            mat.SetFloat("_Smoothness", 0.22f);
            Hair[key] = mat;
            return mat;
        }

        public static Texture2D Mask()
        {
            if (skinMask != null)
            {
                return skinMask;
            }

            var path = Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "Processed", "Bodies", "skin_tint_mask.png");
            if (!File.Exists(path))
            {
                return null;
            }

            skinMask = new Texture2D(4, 4, TextureFormat.RGBA32, false);
            skinMask.LoadImage(File.ReadAllBytes(path), false);
            skinMask.wrapMode = TextureWrapMode.Clamp;
            return skinMask;
        }

        static void EnsureShader()
        {
            if (skinShader == null || !skinShader.isSupported)
            {
                skinShader = Shader.Find("GENORYX/CharacterSkin");
            }

            if (skinShader != null && !skinShader.isSupported)
            {
                skinShader = null;
            }
        }

        public static int UniqueMaterialCount()
        {
            return Skin.Count + Hair.Count + (eye != null ? 1 : 0) + (underwear != null ? 1 : 0);
        }
    }
}
