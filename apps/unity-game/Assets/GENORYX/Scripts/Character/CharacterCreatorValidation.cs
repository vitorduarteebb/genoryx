using UnityEngine;

namespace Genoryx
{
    public static class CharacterCreatorValidation
    {
        public static string Run(CharacterAssembler assembler)
        {
            if (assembler == null)
            {
                return "FAIL: CharacterAssembler ausente";
            }

            if (assembler.visualRoot == null)
            {
                return "FAIL: CharacterVisualRoot ausente";
            }

            if (assembler.visualRoot.GetComponentInChildren<SpriteRenderer>(true) != null)
            {
                return "FAIL: Preview usa Sprite";
            }

            if (!assembler.HasSkinnedMesh())
            {
                return "FAIL: sem SkinnedMeshRenderer no CharacterVisualRoot";
            }

            if (assembler.animator == null)
            {
                return "FAIL: Animator ausente";
            }

            if (assembler.animator.applyRootMotion)
            {
                return "FAIL: applyRootMotion deve ser false";
            }

            if (assembler.HeadRegionCount() > 1)
            {
                return "FAIL: mais de uma cabeça humana";
            }

            if (assembler.VisibleHumanoidBodies() > 1)
            {
                return "FAIL: anatomia duplicada visível";
            }

            if (assembler.HairRenderer() == null)
            {
                return "FAIL: Hair não trocou mesh 3D";
            }

            if (assembler.ChestRenderer() == null)
            {
                return "FAIL: Chest não trocou mesh 3D";
            }

            if (assembler.LegsRenderer() == null)
            {
                return "FAIL: Pants não trocou mesh 3D";
            }

            if (assembler.BootsRenderer() == null)
            {
                return "FAIL: Boots não trocou mesh 3D";
            }

            return "OK"
                   + " hair=" + assembler.appearance.hairId
                   + " chest=" + assembler.appearance.chestId
                   + " legs=" + assembler.appearance.legsId
                   + " boots=" + assembler.appearance.bootsId
                   + " skin=" + assembler.appearance.skinTone
                   + " hairColor=" + assembler.appearance.hairColor;
        }

        public static string RunHaven(CharacterAssembler assembler)
        {
            var creator = Run(assembler);
            if (!creator.StartsWith("OK"))
            {
                return creator;
            }

            var saved = CharacterAppearanceStore.Load();
            if (saved.hairId != assembler.appearance.hairId
                || saved.chestId != assembler.appearance.chestId
                || saved.legsId != assembler.appearance.legsId
                || saved.bootsId != assembler.appearance.bootsId
                || saved.skinTone != assembler.appearance.skinTone
                || saved.hairColor != assembler.appearance.hairColor)
            {
                return "FAIL: personagem do Haven não corresponde ao save"
                       + " save=" + saved.ToJson()
                       + " live=" + assembler.appearance.ToJson();
            }

            return creator + " haven-match";
        }

        public static string RunCreatorOnly(CharacterAssembler assembler)
        {
            if (assembler == null)
            {
                return "FAIL: CharacterAssembler ausente";
            }

            if (!assembler.HasSkinnedMesh() || assembler.animator == null)
            {
                return "FAIL: corpo/animator ausente";
            }

            if (assembler.HairRenderer() == null || assembler.ChestRenderer() == null
                || assembler.LegsRenderer() == null || assembler.BootsRenderer() == null)
            {
                return "FAIL: slot modular sem mesh";
            }

            if (assembler.VisibleHumanoidBodies() > 1 || assembler.HeadRegionCount() > 1)
            {
                return "FAIL: anatomia duplicada";
            }

            return "OK creator";
        }
    }
}
