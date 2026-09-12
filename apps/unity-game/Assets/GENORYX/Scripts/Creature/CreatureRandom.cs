using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Gerador de DNA aleatorio valido. Deterministico por seed, o que torna
    /// os testes de 100 criaturas e de 1000 swaps reproduziveis.
    /// </summary>
    public static class CreatureRandom
    {
        public static CreatureDNA Generate(int seed)
        {
            var rng = new System.Random(seed);
            var dna = new CreatureDNA
            {
                creatureId = "rnd-" + seed,
                species = "genoryx",
                chassisId = CreatureParts.ChassisV1,
                body = new CreatureGene(CreatureParts.BodyStandard),
                head = Gene(rng, CreatureSlot.Head),
                eyes = Gene(rng, CreatureSlot.Eyes),
                horns = Gene(rng, CreatureSlot.Horns),
                limbs = Gene(rng, CreatureSlot.Limbs),
                tail = Gene(rng, CreatureSlot.Tail),
                back = Gene(rng, CreatureSlot.Back),
                core = Gene(rng, CreatureSlot.Core),
                pattern = Gene(rng, CreatureSlot.Pattern),
                growthStage = (CreatureGrowthStage)rng.Next(0, 3)
            };

            dna.primaryColorId = Pick(rng, CreaturePalette.BodyColorIds);
            dna.secondaryColorId = Pick(rng, CreaturePalette.AccentColorIds);
            dna.patternColorId = Pick(rng, CreaturePalette.EmissiveColorIds);
            dna.eyeColorId = Pick(rng, CreaturePalette.EmissiveColorIds);
            dna.coreColorId = CreaturePalette.ElementColor(dna.CoreId);

            // Aura combina com o Core na maioria dos casos, mas nem sempre: variedade importa.
            dna.aura = rng.NextDouble() < 0.72
                ? new CreatureGene(CreatureCoreDefinition.AuraFor(dna.CoreId))
                : Gene(rng, CreatureSlot.Aura);

            if (rng.NextDouble() < 0.14)
            {
                dna.mutations.Add(new CreatureMutation(CreatureMutations.All[rng.Next(CreatureMutations.All.Length)]));
            }

            return dna;
        }

        static CreatureGene Gene(System.Random rng, CreatureSlot slot)
        {
            var catalog = CreatureParts.Catalog(slot);
            return new CreatureGene(
                catalog[rng.Next(catalog.Length)],
                catalog[rng.Next(catalog.Length)],
                catalog[rng.Next(catalog.Length)]);
        }

        static string Pick(System.Random rng, string[] values)
        {
            return values[rng.Next(values.Length)];
        }

        /// <summary>Cruza dois genomas: dominante sorteado entre os pais, recessivos preservados.</summary>
        public static CreatureDNA Breed(CreatureDNA a, CreatureDNA b, int seed)
        {
            var rng = new System.Random(seed);
            var child = new CreatureDNA
            {
                creatureId = "bred-" + seed,
                species = a.species,
                chassisId = a.chassisId,
                growthStage = CreatureGrowthStage.Baby
            };

            child.body = Cross(rng, a.body, b.body);
            child.head = Cross(rng, a.head, b.head);
            child.eyes = Cross(rng, a.eyes, b.eyes);
            child.horns = Cross(rng, a.horns, b.horns);
            child.limbs = Cross(rng, a.limbs, b.limbs);
            child.tail = Cross(rng, a.tail, b.tail);
            child.back = Cross(rng, a.back, b.back);
            child.core = Cross(rng, a.core, b.core);
            child.pattern = Cross(rng, a.pattern, b.pattern);
            child.aura = Cross(rng, a.aura, b.aura);

            child.primaryColorId = rng.Next(2) == 0 ? a.primaryColorId : b.primaryColorId;
            child.secondaryColorId = rng.Next(2) == 0 ? a.secondaryColorId : b.secondaryColorId;
            child.patternColorId = rng.Next(2) == 0 ? a.patternColorId : b.patternColorId;
            child.eyeColorId = rng.Next(2) == 0 ? a.eyeColorId : b.eyeColorId;
            child.coreColorId = CreaturePalette.ElementColor(child.CoreId);
            return child;
        }

        static CreatureGene Cross(System.Random rng, CreatureGene a, CreatureGene b)
        {
            var fromA = new[] { a.d, a.r1, a.r2 };
            var fromB = new[] { b.d, b.r1, b.r2 };
            return new CreatureGene(
                rng.Next(2) == 0 ? fromA[rng.Next(3)] : fromB[rng.Next(3)],
                fromA[rng.Next(3)],
                fromB[rng.Next(3)]);
        }
    }
}
