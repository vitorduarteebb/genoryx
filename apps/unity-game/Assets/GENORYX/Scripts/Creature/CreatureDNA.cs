using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;

namespace Genoryx.Creatures
{
    public enum CreatureSlot
    {
        Body,
        Head,
        Eyes,
        Horns,
        Limbs,
        Tail,
        Back,
        Core,
        Pattern,
        Aura
    }

    public enum CreatureGrowthStage
    {
        Baby,
        Juvenile,
        Adult
    }

    /// <summary>
    /// Um locus genetico: dominante visivel + dois recessivos persistidos para breeding.
    /// </summary>
    [Serializable]
    public class CreatureGene
    {
        public string d;
        public string r1;
        public string r2;

        public CreatureGene()
        {
        }

        public CreatureGene(string dominant, string recessive1 = null, string recessive2 = null)
        {
            d = dominant;
            r1 = recessive1 ?? dominant;
            r2 = recessive2 ?? dominant;
        }

        public string Expressed => string.IsNullOrEmpty(d) ? r1 : d;

        public CreatureGene Clone()
        {
            return new CreatureGene(d, r1, r2);
        }

        public override string ToString()
        {
            return d + "|" + r1 + "|" + r2;
        }
    }

    [Serializable]
    public class CreatureMutation
    {
        public string id;
        public float intensity = 1f;

        public CreatureMutation()
        {
        }

        public CreatureMutation(string id, float intensity = 1f)
        {
            this.id = id;
            this.intensity = intensity;
        }
    }

    public static class CreatureMutations
    {
        public const string CrystalHorns = "CRYSTAL_HORNS";
        public const string VoidTail = "VOID_TAIL";
        public const string GenesisEyes = "GENESIS_EYES";
        public const string EmberCoreOvercharge = "EMBER_CORE_OVERCHARGE";

        public static readonly string[] All = { CrystalHorns, VoidTail, GenesisEyes, EmberCoreOvercharge };
    }

    /// <summary>
    /// Genoma visual completo. Multiplayer-ready: so IDs, nunca meshes.
    /// Nenhuma etapa deste tipo chama Meshy — as pecas ja existem no projeto.
    /// </summary>
    [Serializable]
    public class CreatureDNA
    {
        public string creatureId = "";
        public string species = "genoryx";
        public string chassisId = CreatureParts.ChassisV1;

        public CreatureGene body = new CreatureGene(CreatureParts.BodyStandard);
        public CreatureGene head = new CreatureGene(CreatureParts.Heads[0]);
        public CreatureGene eyes = new CreatureGene(CreatureParts.Eyes[0]);
        public CreatureGene horns = new CreatureGene(CreatureParts.Horns[0]);
        public CreatureGene limbs = new CreatureGene(CreatureParts.Limbs[0]);
        public CreatureGene tail = new CreatureGene(CreatureParts.Tails[0]);
        public CreatureGene back = new CreatureGene(CreatureParts.Backs[0]);
        public CreatureGene core = new CreatureGene(CreatureParts.Cores[0]);
        public CreatureGene pattern = new CreatureGene(CreatureParts.Patterns[0]);
        public CreatureGene aura = new CreatureGene(CreatureParts.Auras[0]);

        public string primaryColorId = "slate";
        public string secondaryColorId = "ash";
        public string patternColorId = "ember";
        public string eyeColorId = "amber";
        public string coreColorId = "ember";

        public CreatureGrowthStage growthStage = CreatureGrowthStage.Adult;
        public List<CreatureMutation> mutations = new List<CreatureMutation>();

        public string BodyId => body.Expressed;
        public string HeadId => head.Expressed;
        public string EyesId => eyes.Expressed;
        public string HornsId => horns.Expressed;
        public string LimbsId => limbs.Expressed;
        public string TailId => tail.Expressed;
        public string BackId => back.Expressed;
        public string CoreId => core.Expressed;
        public string PatternId => pattern.Expressed;
        public string AuraId => aura.Expressed;

        public CreatureGene Gene(CreatureSlot slot)
        {
            return slot switch
            {
                CreatureSlot.Body => body,
                CreatureSlot.Head => head,
                CreatureSlot.Eyes => eyes,
                CreatureSlot.Horns => horns,
                CreatureSlot.Limbs => limbs,
                CreatureSlot.Tail => tail,
                CreatureSlot.Back => back,
                CreatureSlot.Core => core,
                CreatureSlot.Pattern => pattern,
                CreatureSlot.Aura => aura,
                _ => body
            };
        }

        public string Expressed(CreatureSlot slot)
        {
            return Gene(slot).Expressed;
        }

        public void SetExpressed(CreatureSlot slot, string id)
        {
            Gene(slot).d = id;
        }

        public bool HasMutation(string id)
        {
            for (var i = 0; i < mutations.Count; i++)
            {
                if (mutations[i] != null && mutations[i].id == id)
                {
                    return true;
                }
            }

            return false;
        }

        public CreatureDNA Clone()
        {
            var copy = new CreatureDNA
            {
                creatureId = creatureId,
                species = species,
                chassisId = chassisId,
                body = body.Clone(),
                head = head.Clone(),
                eyes = eyes.Clone(),
                horns = horns.Clone(),
                limbs = limbs.Clone(),
                tail = tail.Clone(),
                back = back.Clone(),
                core = core.Clone(),
                pattern = pattern.Clone(),
                aura = aura.Clone(),
                primaryColorId = primaryColorId,
                secondaryColorId = secondaryColorId,
                patternColorId = patternColorId,
                eyeColorId = eyeColorId,
                coreColorId = coreColorId,
                growthStage = growthStage,
                mutations = new List<CreatureMutation>()
            };

            for (var i = 0; i < mutations.Count; i++)
            {
                copy.mutations.Add(new CreatureMutation(mutations[i].id, mutations[i].intensity));
            }

            return copy;
        }

        public string ToJson()
        {
            return JsonUtility.ToJson(this);
        }

        public static CreatureDNA FromJson(string json)
        {
            if (string.IsNullOrEmpty(json))
            {
                return new CreatureDNA();
            }

            return JsonUtility.FromJson<CreatureDNA>(json) ?? new CreatureDNA();
        }

        /// <summary>Assinatura estavel de aparencia. Usada em testes de swap e em sync de rede.</summary>
        public string VisualSignature()
        {
            var sb = new StringBuilder();
            sb.Append(chassisId).Append('/');
            sb.Append(BodyId).Append('/').Append(HeadId).Append('/').Append(EyesId).Append('/');
            sb.Append(HornsId).Append('/').Append(LimbsId).Append('/').Append(TailId).Append('/');
            sb.Append(BackId).Append('/').Append(CoreId).Append('/').Append(PatternId).Append('/').Append(AuraId);
            sb.Append('#').Append(primaryColorId).Append(',').Append(secondaryColorId).Append(',');
            sb.Append(patternColorId).Append(',').Append(eyeColorId).Append(',').Append(coreColorId);
            sb.Append('@').Append(growthStage);
            return sb.ToString();
        }
    }
}
