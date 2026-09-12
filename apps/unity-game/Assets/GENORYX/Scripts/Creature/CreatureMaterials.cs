using System.Collections.Generic;
using UnityEngine;

namespace Genoryx.Creatures
{
    public enum CreatureMaterialProfile
    {
        Skin,
        Horn,
        Crystal,
        Eye,
        Armor,
        CoreGem,
        Membrane
    }

    /// <summary>
    /// Um Material por arquetipo, compartilhado por TODAS as criaturas.
    /// Variacao de cor vai por MaterialPropertyBlock: nunca instanciar Material por criatura.
    /// </summary>
    public static class CreatureMaterials
    {
        public const string ShaderName = "GENORYX/Creature";
        public const string ResourceFolder = "GENORYX/Materials/GENORYX_Creature_";

        static readonly Dictionary<CreatureMaterialProfile, Material> Shared =
            new Dictionary<CreatureMaterialProfile, Material>();

        static Shader shader;

        public static int SharedMaterialCount => Shared.Count;

        public static Shader CreatureShader()
        {
            if (shader == null)
            {
                shader = Shader.Find(ShaderName);
            }

            if (shader == null)
            {
                shader = Shader.Find("Universal Render Pipeline/Lit");
            }

            return shader;
        }

        public static bool UsingCreatureShader()
        {
            var s = CreatureShader();
            return s != null && s.name == ShaderName;
        }

        public static Material Get(CreatureMaterialProfile profile)
        {
            if (Shared.TryGetValue(profile, out var mat) && mat != null)
            {
                return mat;
            }

            // Material versionado no projeto tem prioridade: prefabs precisam de referencia estavel.
            var asset = Resources.Load<Material>(ResourceFolder + profile);
            if (asset != null)
            {
                Shared[profile] = asset;
                return asset;
            }

            mat = new Material(CreatureShader())
            {
                name = "GENORYX_Creature_" + profile,
                enableInstancing = true,
                hideFlags = HideFlags.DontSave
            };

            switch (profile)
            {
                case CreatureMaterialProfile.Skin:
                    SetFloat(mat, "_Smoothness", 0.30f);
                    SetFloat(mat, "_Metallic", 0f);
                    SetFloat(mat, "_RimStrength", 0.16f);
                    SetFloat(mat, "_BellyLift", 0.55f);
                    break;
                case CreatureMaterialProfile.Horn:
                    SetFloat(mat, "_Smoothness", 0.42f);
                    SetFloat(mat, "_Metallic", 0.05f);
                    SetFloat(mat, "_RimStrength", 0.10f);
                    SetFloat(mat, "_BellyLift", 0.20f);
                    break;
                case CreatureMaterialProfile.Crystal:
                    SetFloat(mat, "_Smoothness", 0.88f);
                    SetFloat(mat, "_Metallic", 0f);
                    SetFloat(mat, "_RimStrength", 0.55f);
                    SetFloat(mat, "_BellyLift", 0.05f);
                    break;
                case CreatureMaterialProfile.Eye:
                    SetFloat(mat, "_Smoothness", 0.95f);
                    SetFloat(mat, "_Metallic", 0f);
                    SetFloat(mat, "_RimStrength", 0.30f);
                    SetFloat(mat, "_BellyLift", 0f);
                    break;
                // Metallic alto zera o difuso e deixa a peca refletindo so o ambiente:
                // uma perna "armored" saia cinza-espelhada num corpo charcoal, lendo como
                // vidro. Armadura estilizada quer aspereza, nao metal fisicamente correto.
                case CreatureMaterialProfile.Armor:
                    SetFloat(mat, "_Smoothness", 0.38f);
                    SetFloat(mat, "_Metallic", 0.12f);
                    SetFloat(mat, "_RimStrength", 0.14f);
                    SetFloat(mat, "_BellyLift", 0.25f);
                    break;
                // Rim em 0.85 iluminava a gema inteira por igual — numa peca pequena e
                // convexa quase todo pixel e borda — e as facetas perdiam contraste: o Core
                // lia como adesivo hexagonal colado no flanco. Com 0.32 o especular por
                // faceta volta a aparecer e a gema le como mineral cravado.
                case CreatureMaterialProfile.CoreGem:
                    SetFloat(mat, "_Smoothness", 0.94f);
                    SetFloat(mat, "_Metallic", 0.05f);
                    SetFloat(mat, "_RimStrength", 0.32f);
                    SetFloat(mat, "_BellyLift", 0f);
                    break;
                case CreatureMaterialProfile.Membrane:
                    SetFloat(mat, "_Smoothness", 0.62f);
                    SetFloat(mat, "_Metallic", 0f);
                    SetFloat(mat, "_RimStrength", 0.62f);
                    SetFloat(mat, "_BellyLift", 0.40f);
                    break;
            }

            Shared[profile] = mat;
            return mat;
        }

        static void SetFloat(Material mat, string property, float value)
        {
            if (mat.HasProperty(property))
            {
                mat.SetFloat(property, value);
            }
        }

        /// <summary>Perfil de material adequado para um ID de peca.</summary>
        public static CreatureMaterialProfile ProfileFor(CreatureSlot slot, string id)
        {
            switch (slot)
            {
                case CreatureSlot.Eyes:
                    return CreatureMaterialProfile.Eye;
                case CreatureSlot.Core:
                    return CreatureMaterialProfile.CoreGem;
                case CreatureSlot.Horns:
                    return id is "HORNS_03_CRYSTAL" or "HORNS_05_VOID_CRYSTAL"
                        ? CreatureMaterialProfile.Crystal
                        : CreatureMaterialProfile.Horn;
                case CreatureSlot.Back:
                    return id switch
                    {
                        "BACK_04_CRYSTAL_SPINES" => CreatureMaterialProfile.Crystal,
                        "BACK_05_ARMORED_SPINES" => CreatureMaterialProfile.Armor,
                        "BACK_03_FIN" => CreatureMaterialProfile.Membrane,
                        _ => CreatureMaterialProfile.Horn
                    };
                case CreatureSlot.Limbs:
                    return id is "LIMBS_02_ARMORED" or "LIMBS_05_HEAVY"
                        ? CreatureMaterialProfile.Armor
                        : CreatureMaterialProfile.Skin;
                case CreatureSlot.Tail:
                    return id == "TAIL_05_ELEMENTAL" ? CreatureMaterialProfile.Skin : CreatureMaterialProfile.Skin;
                default:
                    return CreatureMaterialProfile.Skin;
            }
        }

        public static int PatternIndex(string patternId)
        {
            return CreatureParts.IndexOf(CreatureSlot.Pattern, patternId);
        }

        public static void ReleaseShared()
        {
            foreach (var mat in Shared.Values)
            {
                // Nunca destruir material versionado no projeto: so os gerados em memoria.
                if (mat != null && (mat.hideFlags & HideFlags.DontSave) != 0)
                {
                    Object.DestroyImmediate(mat);
                }
            }

            Shared.Clear();
        }
    }
}
