using System.Collections.Generic;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Asset Library V1. IDs sao contrato de rede e de banco: nunca renomear sem migracao.
    /// </summary>
    public static class CreatureParts
    {
        public const string ChassisV1 = "GENORYX_CORE_CHASSIS_V1";
        public const string RigV1 = "GENORYX_CORE_RIG";

        public const string BodyStandard = "BODY_CORE_STANDARD";

        public static readonly string[] Bodies =
        {
            BodyStandard
        };

        public static readonly string[] Heads =
        {
            "HEAD_01_SMOOTH",
            "HEAD_02_PREDATOR",
            "HEAD_03_DRACONIC",
            "HEAD_04_ARCANE"
        };

        public static readonly string[] Eyes =
        {
            "EYES_01_PREDATOR",
            "EYES_02_AZURE",
            "EYES_03_AMBER",
            "EYES_04_NATURE",
            "EYES_05_VOID"
        };

        public const string HornsNone = "HORNS_NONE";

        public static readonly string[] Horns =
        {
            "HORNS_01_BONE",
            "HORNS_02_DARK",
            "HORNS_03_CRYSTAL",
            "HORNS_04_INFERNAL",
            "HORNS_05_VOID_CRYSTAL",
            HornsNone
        };

        public static readonly string[] Limbs =
        {
            "LIMBS_01_SOFT",
            "LIMBS_02_ARMORED",
            "LIMBS_03_DRACONIC",
            "LIMBS_04_AGILE",
            "LIMBS_05_HEAVY"
        };

        public static readonly string[] Tails =
        {
            "TAIL_01_SHORT",
            "TAIL_02_CURVED",
            "TAIL_03_SPIKED",
            "TAIL_04_SERPENT",
            "TAIL_05_ELEMENTAL"
        };

        public const string BackNone = "BACK_NONE";

        public static readonly string[] Backs =
        {
            "BACK_01_PLATES",
            "BACK_02_LOW_SPIKES",
            "BACK_03_FIN",
            "BACK_04_CRYSTAL_SPINES",
            "BACK_05_ARMORED_SPINES",
            BackNone
        };

        public static readonly string[] Cores =
        {
            "CORE_01_EMBER",
            "CORE_02_FROST",
            "CORE_03_NATURE",
            "CORE_04_ARCANE",
            "CORE_05_VOID"
        };

        public static readonly string[] Patterns =
        {
            "PATTERN_NONE",
            "PATTERN_STRIPES",
            "PATTERN_VEINS",
            "PATTERN_CRACKS",
            "PATTERN_SCALES",
            "PATTERN_GENESIS"
        };

        public const string AuraNone = "AURA_NONE";

        public static readonly string[] Auras =
        {
            AuraNone,
            "AURA_EMBER",
            "AURA_FROST",
            "AURA_NATURE",
            "AURA_VOID"
        };

        public static string[] Catalog(CreatureSlot slot)
        {
            return slot switch
            {
                CreatureSlot.Body => Bodies,
                CreatureSlot.Head => Heads,
                CreatureSlot.Eyes => Eyes,
                CreatureSlot.Horns => Horns,
                CreatureSlot.Limbs => Limbs,
                CreatureSlot.Tail => Tails,
                CreatureSlot.Back => Backs,
                CreatureSlot.Core => Cores,
                CreatureSlot.Pattern => Patterns,
                CreatureSlot.Aura => Auras,
                _ => Bodies
            };
        }

        public static int IndexOf(CreatureSlot slot, string id)
        {
            var list = Catalog(slot);
            for (var i = 0; i < list.Length; i++)
            {
                if (list[i] == id)
                {
                    return i;
                }
            }

            return 0;
        }

        public static string Next(CreatureSlot slot, string current)
        {
            var list = Catalog(slot);
            var index = (IndexOf(slot, current) + 1) % list.Length;
            return list[index];
        }

        /// <summary>Variacao visual: numero de combinacoes distintas cobertas pela V1.</summary>
        public static long CombinationCount()
        {
            long total = Bodies.Length;
            total *= Heads.Length;
            total *= Eyes.Length;
            total *= Horns.Length;
            total *= Limbs.Length;
            total *= Tails.Length;
            total *= Backs.Length;
            total *= Cores.Length;
            total *= Patterns.Length;
            total *= Auras.Length;
            return total;
        }

        public static IEnumerable<CreatureSlot> MeshSlots()
        {
            yield return CreatureSlot.Head;
            yield return CreatureSlot.Eyes;
            yield return CreatureSlot.Horns;
            yield return CreatureSlot.Limbs;
            yield return CreatureSlot.Tail;
            yield return CreatureSlot.Back;
            yield return CreatureSlot.Core;
        }
    }
}
