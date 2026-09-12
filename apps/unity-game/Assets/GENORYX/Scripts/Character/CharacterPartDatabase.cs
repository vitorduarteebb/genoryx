using System.Collections.Generic;
using UnityEngine;

namespace Genoryx
{
    [CreateAssetMenu(menuName = "GENORYX/Character Part Database", fileName = "CharacterPartDatabase")]
    public class CharacterPartDatabase : ScriptableObject
    {
        public CharacterPartDefinition[] parts;

        public CharacterPartDefinition Find(string id)
        {
            if (parts == null)
            {
                return null;
            }

            for (var i = 0; i < parts.Length; i++)
            {
                if (parts[i] != null && parts[i].id == id)
                {
                    return parts[i];
                }
            }

            return null;
        }

        public IEnumerable<CharacterPartDefinition> BySlot(CharacterSlot slot)
        {
            if (parts == null)
            {
                yield break;
            }

            for (var i = 0; i < parts.Length; i++)
            {
                if (parts[i] != null && parts[i].slot == slot)
                {
                    yield return parts[i];
                }
            }
        }
    }
}
