using UnityEngine;

namespace Genoryx.Creatures
{
    public enum CreatureElement
    {
        Ember,
        Frost,
        Nature,
        Arcane,
        Void
    }

    /// <summary>
    /// Genesis Core: assinatura visual e tag de combate.
    /// Mesma animacao ATTACK_02_CORE serve todos os elementos; so o VFX muda.
    /// </summary>
    [CreateAssetMenu(menuName = "GENORYX/Creature Core Definition", fileName = "CreatureCore")]
    public class CreatureCoreDefinition : ScriptableObject
    {
        public string id;
        public CreatureElement element;
        public Mesh mesh;
        public Color emissionColor = Color.white;
        public float emissionIntensity = 3.5f;
        public GameObject vfxPrefab;
        public string combatTag = "CORE_EMBER";

        public static CreatureElement ElementFor(string coreId)
        {
            return coreId switch
            {
                "CORE_02_FROST" => CreatureElement.Frost,
                "CORE_03_NATURE" => CreatureElement.Nature,
                "CORE_04_ARCANE" => CreatureElement.Arcane,
                "CORE_05_VOID" => CreatureElement.Void,
                _ => CreatureElement.Ember
            };
        }

        public static string CombatTagFor(string coreId)
        {
            return "CORE_" + ElementFor(coreId).ToString().ToUpperInvariant();
        }

        /// <summary>
        /// Intensidade de emissao da gema.
        ///
        /// Acima de ~2 o canal mais forte estoura e os cinco Cores viram o mesmo ponto
        /// branco na tela: o elemento so e legivel enquanto a cor sobrevive ao tonemap.
        /// A leitura de "poder" fica por conta da aura e do pulso, nao do estouro.
        /// </summary>
        public static float IntensityFor(string coreId)
        {
            return coreId switch
            {
                "CORE_01_EMBER" => 1.30f,
                "CORE_02_FROST" => 1.10f,
                "CORE_03_NATURE" => 0.95f,
                "CORE_04_ARCANE" => 1.20f,
                "CORE_05_VOID" => 1.40f,
                _ => 1.15f
            };
        }

        public static string AuraFor(string coreId)
        {
            return coreId switch
            {
                "CORE_01_EMBER" => "AURA_EMBER",
                "CORE_02_FROST" => "AURA_FROST",
                "CORE_03_NATURE" => "AURA_NATURE",
                "CORE_05_VOID" => "AURA_VOID",
                _ => CreatureParts.AuraNone
            };
        }
    }
}
