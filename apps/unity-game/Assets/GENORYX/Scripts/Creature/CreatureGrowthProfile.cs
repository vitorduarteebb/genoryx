using System;
using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Baby / Juvenile / Adult usam o MESMO rig. So escalas mudam.
    /// </summary>
    [Serializable]
    public struct CreatureGrowthProfile
    {
        public float overallScale;
        public float headScale;
        public float hornScale;
        public float tailScale;
        public float backTraitScale;
        public float limbScale;
        public float eyeScale;
        public float coreScale;

        public static CreatureGrowthProfile For(CreatureGrowthStage stage)
        {
            return stage switch
            {
                CreatureGrowthStage.Baby => new CreatureGrowthProfile
                {
                    overallScale = 0.65f,
                    headScale = 1.15f,
                    hornScale = 0.25f,
                    tailScale = 0.65f,
                    backTraitScale = 0.55f,
                    limbScale = 0.90f,
                    eyeScale = 1.18f,
                    coreScale = 0.80f
                },
                CreatureGrowthStage.Juvenile => new CreatureGrowthProfile
                {
                    overallScale = 0.85f,
                    headScale = 1.05f,
                    hornScale = 0.65f,
                    tailScale = 0.85f,
                    backTraitScale = 0.80f,
                    limbScale = 0.96f,
                    eyeScale = 1.08f,
                    coreScale = 0.92f
                },
                _ => Adult
            };
        }

        public static CreatureGrowthProfile Adult => new CreatureGrowthProfile
        {
            overallScale = 1f,
            headScale = 1f,
            hornScale = 1f,
            tailScale = 1f,
            backTraitScale = 1f,
            limbScale = 1f,
            eyeScale = 1f,
            coreScale = 1f
        };

        public float ScaleFor(CreatureSlot slot)
        {
            return slot switch
            {
                CreatureSlot.Head => headScale,
                CreatureSlot.Eyes => eyeScale,
                CreatureSlot.Horns => hornScale,
                CreatureSlot.Limbs => limbScale,
                CreatureSlot.Tail => tailScale,
                CreatureSlot.Back => backTraitScale,
                CreatureSlot.Core => coreScale,
                _ => 1f
            };
        }

        public static CreatureGrowthStage Parse(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return CreatureGrowthStage.Adult;
            }

            return value.ToUpperInvariant() switch
            {
                "BABY" => CreatureGrowthStage.Baby,
                "JUVENILE" => CreatureGrowthStage.Juvenile,
                _ => CreatureGrowthStage.Adult
            };
        }
    }
}
