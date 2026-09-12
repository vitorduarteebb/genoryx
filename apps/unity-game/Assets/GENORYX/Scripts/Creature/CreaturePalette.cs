using System.Collections.Generic;
using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Cores nomeadas do GENORYX. IDs viajam na rede, nunca floats de cor.
    /// </summary>
    public static class CreaturePalette
    {
        static readonly Dictionary<string, Color> Colors = new Dictionary<string, Color>
        {
            { "slate", new Color(0.235f, 0.251f, 0.290f) },
            { "charcoal", new Color(0.114f, 0.118f, 0.137f) },
            { "ash", new Color(0.380f, 0.392f, 0.427f) },
            { "bone", new Color(0.855f, 0.831f, 0.760f) },
            { "pale_ice", new Color(0.788f, 0.855f, 0.902f) },
            { "glacier", new Color(0.545f, 0.686f, 0.796f) },
            { "moss", new Color(0.318f, 0.478f, 0.271f) },
            { "verdant", new Color(0.427f, 0.639f, 0.318f) },
            { "bark", new Color(0.353f, 0.267f, 0.192f) },
            { "soil", new Color(0.267f, 0.208f, 0.157f) },
            { "ember", new Color(0.902f, 0.365f, 0.129f) },
            { "magma", new Color(0.667f, 0.176f, 0.086f) },
            { "amber", new Color(0.949f, 0.686f, 0.239f) },
            { "azure", new Color(0.286f, 0.639f, 0.902f) },
            { "cyan_ice", new Color(0.451f, 0.831f, 0.929f) },
            // VOID puxa para o magenta profundo e ARCANE para o azul-violeta. Com 0.573/
            // 0.318/0.831 contra o lavanda do arcane, os dois Cores saiam do tonemap como
            // o mesmo rosa e os elementos ficavam indistinguiveis lado a lado.
            { "violet", new Color(0.478f, 0.157f, 0.769f) },
            { "void_black", new Color(0.086f, 0.067f, 0.114f) },
            { "void_purple", new Color(0.267f, 0.157f, 0.376f) },
            { "arcane", new Color(0.510f, 0.451f, 1.000f) },
            { "crimson", new Color(0.706f, 0.157f, 0.196f) },
            { "sand", new Color(0.769f, 0.686f, 0.529f) },
            { "steel", new Color(0.494f, 0.529f, 0.573f) }
        };

        public static readonly string[] BodyColorIds =
        {
            "slate", "charcoal", "ash", "bone", "pale_ice", "glacier",
            "moss", "verdant", "bark", "soil", "sand", "steel", "void_black", "void_purple", "crimson"
        };

        public static readonly string[] AccentColorIds =
        {
            "ash", "bone", "bark", "soil", "steel", "sand", "magma", "glacier", "moss", "void_purple", "arcane"
        };

        public static readonly string[] EmissiveColorIds =
        {
            "ember", "magma", "amber", "azure", "cyan_ice", "verdant", "violet", "arcane", "crimson"
        };

        public static Color Get(string id)
        {
            if (!string.IsNullOrEmpty(id) && Colors.TryGetValue(id, out var color))
            {
                return color;
            }

            return Colors["slate"];
        }

        public static bool Has(string id)
        {
            return !string.IsNullOrEmpty(id) && Colors.ContainsKey(id);
        }

        /// <summary>Cor emissiva com intensidade HDR aplicada.</summary>
        public static Color Emissive(string id, float intensity)
        {
            var color = Get(id);
            return new Color(color.r * intensity, color.g * intensity, color.b * intensity, 1f);
        }

        public static string ElementColor(string coreId)
        {
            return coreId switch
            {
                "CORE_01_EMBER" => "ember",
                "CORE_02_FROST" => "cyan_ice",
                "CORE_03_NATURE" => "verdant",
                "CORE_04_ARCANE" => "arcane",
                "CORE_05_VOID" => "violet",
                _ => "ember"
            };
        }
    }
}
