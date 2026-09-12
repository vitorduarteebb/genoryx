using System.Collections.Generic;
using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Registro de todas as pecas e cores do chassi V1.
    /// Carregado de Resources. Se ausente, o sistema opera 100% procedural.
    /// </summary>
    [CreateAssetMenu(menuName = "GENORYX/Creature Part Database", fileName = "CreaturePartDatabase")]
    public class CreaturePartDatabase : ScriptableObject
    {
        public const string ResourcePath = "GENORYX/CreaturePartDatabase";

        public string chassisId = CreatureParts.ChassisV1;
        public string rigId = CreatureParts.RigV1;
        public List<CreaturePartDefinition> parts = new List<CreaturePartDefinition>();
        public List<CreatureCoreDefinition> cores = new List<CreatureCoreDefinition>();
        public RuntimeAnimatorController animatorController;
        public GameObject auraEmber;
        public GameObject auraFrost;
        public GameObject auraNature;
        public GameObject auraVoid;

        static CreaturePartDatabase cached;
        static bool lookedUp;

        Dictionary<string, CreaturePartDefinition> index;

        public static CreaturePartDatabase Load()
        {
            if (lookedUp)
            {
                return cached;
            }

            lookedUp = true;
            cached = Resources.Load<CreaturePartDatabase>(ResourcePath);
            return cached;
        }

        public static void InvalidateCache()
        {
            cached = null;
            lookedUp = false;
        }

        public CreaturePartDefinition Find(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return null;
            }

            if (index == null)
            {
                index = new Dictionary<string, CreaturePartDefinition>();
                for (var i = 0; i < parts.Count; i++)
                {
                    if (parts[i] != null && !string.IsNullOrEmpty(parts[i].id))
                    {
                        index[parts[i].id] = parts[i];
                    }
                }
            }

            return index.TryGetValue(id, out var def) ? def : null;
        }

        public CreatureCoreDefinition FindCore(string id)
        {
            for (var i = 0; i < cores.Count; i++)
            {
                if (cores[i] != null && cores[i].id == id)
                {
                    return cores[i];
                }
            }

            return null;
        }

        public GameObject AuraPrefab(string auraId)
        {
            return auraId switch
            {
                "AURA_EMBER" => auraEmber,
                "AURA_FROST" => auraFrost,
                "AURA_NATURE" => auraNature,
                "AURA_VOID" => auraVoid,
                _ => null
            };
        }
    }
}
