using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Provas de diversidade visual: quatro criaturas radicalmente diferentes
    /// usando o MESMO chassi, o MESMO skeleton e as MESMAS animacoes.
    /// </summary>
    public static class CreaturePresets
    {
        public const string Ember = "PRESET_EMBER";
        public const string Frost = "PRESET_FROST";
        public const string Nature = "PRESET_NATURE";
        public const string Void = "PRESET_VOID";

        public static readonly string[] All = { Ember, Frost, Nature, Void };

        public static CreatureDNA Get(string preset)
        {
            return preset switch
            {
                Frost => FrostDna(),
                Nature => NatureDna(),
                Void => VoidDna(),
                _ => EmberDna()
            };
        }

        public static CreatureDNA EmberDna()
        {
            var dna = Base("preset-ember");
            dna.head = new CreatureGene("HEAD_03_DRACONIC", "HEAD_02_PREDATOR", "HEAD_01_SMOOTH");
            dna.eyes = new CreatureGene("EYES_03_AMBER", "EYES_01_PREDATOR", "EYES_03_AMBER");
            dna.horns = new CreatureGene("HORNS_04_INFERNAL", "HORNS_02_DARK", "HORNS_01_BONE");
            dna.limbs = new CreatureGene("LIMBS_02_ARMORED", "LIMBS_05_HEAVY", "LIMBS_01_SOFT");
            dna.tail = new CreatureGene("TAIL_05_ELEMENTAL", "TAIL_03_SPIKED", "TAIL_01_SHORT");
            dna.back = new CreatureGene("BACK_05_ARMORED_SPINES", "BACK_02_LOW_SPIKES", "BACK_01_PLATES");
            dna.core = new CreatureGene("CORE_01_EMBER");
            dna.pattern = new CreatureGene("PATTERN_CRACKS", "PATTERN_VEINS", "PATTERN_NONE");
            dna.aura = new CreatureGene("AURA_EMBER");
            dna.primaryColorId = "charcoal";
            dna.secondaryColorId = "magma";
            dna.patternColorId = "ember";
            dna.eyeColorId = "amber";
            dna.coreColorId = "ember";
            return dna;
        }

        public static CreatureDNA FrostDna()
        {
            var dna = Base("preset-frost");
            dna.head = new CreatureGene("HEAD_01_SMOOTH", "HEAD_04_ARCANE", "HEAD_01_SMOOTH");
            dna.eyes = new CreatureGene("EYES_02_AZURE", "EYES_02_AZURE", "EYES_04_NATURE");
            dna.horns = new CreatureGene("HORNS_03_CRYSTAL", "HORNS_01_BONE", "HORNS_03_CRYSTAL");
            dna.limbs = new CreatureGene("LIMBS_05_HEAVY", "LIMBS_02_ARMORED", "LIMBS_01_SOFT");
            dna.tail = new CreatureGene("TAIL_05_ELEMENTAL", "TAIL_02_CURVED", "TAIL_01_SHORT");
            dna.back = new CreatureGene("BACK_04_CRYSTAL_SPINES", "BACK_02_LOW_SPIKES", "BACK_03_FIN");
            dna.core = new CreatureGene("CORE_02_FROST");
            dna.pattern = new CreatureGene("PATTERN_VEINS", "PATTERN_SCALES", "PATTERN_NONE");
            dna.aura = new CreatureGene("AURA_FROST");
            dna.primaryColorId = "pale_ice";
            dna.secondaryColorId = "glacier";
            dna.patternColorId = "cyan_ice";
            dna.eyeColorId = "azure";
            dna.coreColorId = "cyan_ice";
            return dna;
        }

        public static CreatureDNA NatureDna()
        {
            var dna = Base("preset-nature");
            dna.head = new CreatureGene("HEAD_01_SMOOTH", "HEAD_03_DRACONIC", "HEAD_02_PREDATOR");
            dna.eyes = new CreatureGene("EYES_04_NATURE", "EYES_03_AMBER", "EYES_04_NATURE");
            dna.horns = new CreatureGene("HORNS_01_BONE", "HORNS_02_DARK", "HORNS_NONE");
            dna.limbs = new CreatureGene("LIMBS_01_SOFT", "LIMBS_04_AGILE", "LIMBS_02_ARMORED");
            dna.tail = new CreatureGene("TAIL_02_CURVED", "TAIL_01_SHORT", "TAIL_04_SERPENT");
            dna.back = new CreatureGene("BACK_01_PLATES", "BACK_03_FIN", "BACK_02_LOW_SPIKES");
            dna.core = new CreatureGene("CORE_03_NATURE");
            dna.pattern = new CreatureGene("PATTERN_SCALES", "PATTERN_STRIPES", "PATTERN_NONE");
            dna.aura = new CreatureGene("AURA_NATURE");
            dna.primaryColorId = "moss";
            dna.secondaryColorId = "bark";
            dna.patternColorId = "verdant";
            dna.eyeColorId = "verdant";
            dna.coreColorId = "verdant";
            return dna;
        }

        public static CreatureDNA VoidDna()
        {
            var dna = Base("preset-void");
            dna.head = new CreatureGene("HEAD_04_ARCANE", "HEAD_03_DRACONIC", "HEAD_01_SMOOTH");
            dna.eyes = new CreatureGene("EYES_05_VOID", "EYES_01_PREDATOR", "EYES_05_VOID");
            dna.horns = new CreatureGene("HORNS_05_VOID_CRYSTAL", "HORNS_03_CRYSTAL", "HORNS_02_DARK");
            dna.limbs = new CreatureGene("LIMBS_04_AGILE", "LIMBS_03_DRACONIC", "LIMBS_01_SOFT");
            dna.tail = new CreatureGene("TAIL_04_SERPENT", "TAIL_05_ELEMENTAL", "TAIL_02_CURVED");
            dna.back = new CreatureGene("BACK_04_CRYSTAL_SPINES", "BACK_05_ARMORED_SPINES", "BACK_02_LOW_SPIKES");
            dna.core = new CreatureGene("CORE_05_VOID");
            dna.pattern = new CreatureGene("PATTERN_GENESIS", "PATTERN_CRACKS", "PATTERN_NONE");
            dna.aura = new CreatureGene("AURA_VOID");
            dna.primaryColorId = "void_black";
            dna.secondaryColorId = "void_purple";
            dna.patternColorId = "violet";
            dna.eyeColorId = "violet";
            dna.coreColorId = "violet";
            dna.mutations.Add(new CreatureMutation(CreatureMutations.VoidTail));
            return dna;
        }

        static CreatureDNA Base(string id)
        {
            return new CreatureDNA
            {
                creatureId = id,
                species = "genoryx",
                chassisId = CreatureParts.ChassisV1,
                body = new CreatureGene(CreatureParts.BodyStandard),
                growthStage = CreatureGrowthStage.Adult
            };
        }
    }
}
