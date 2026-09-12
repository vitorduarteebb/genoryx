using UnityEngine;

namespace Genoryx
{
    [System.Serializable]
    public class CharacterAppearanceData
    {
        public string bodyType = "canonical_body";
        public string faceId = "face_01";
        public string skinTone = "sand";
        public string eyeColor = "teal";
        public string eyebrowId = "brow_01";
        public string hairId = "hair_01";
        public string hairColor = "black";
        public string beardId = "beard_none";
        public string chestId = "chest_01";
        public string legsId = "pants_01";
        public string glovesId = "gloves_none";
        public string bootsId = "boots_01";
        public string capeId = "cape_none";
        public string backId = "back_none";

        public static CharacterAppearanceData Phase1()
        {
            return new CharacterAppearanceData();
        }

        public static CharacterAppearanceData FromJson(string json)
        {
            if (string.IsNullOrEmpty(json))
            {
                return Phase1();
            }

            return JsonUtility.FromJson<CharacterAppearanceData>(json) ?? Phase1();
        }

        public string ToJson()
        {
            return JsonUtility.ToJson(this);
        }

        public Color HairTint()
        {
            return hairColor switch
            {
                "black" => new Color(0.07f, 0.06f, 0.06f),
                "dark_brown" => new Color(0.18f, 0.11f, 0.07f),
                "brown" => new Color(0.42f, 0.24f, 0.12f),
                "blonde" => new Color(0.86f, 0.72f, 0.38f),
                "red" => new Color(0.72f, 0.2f, 0.12f),
                "white" => new Color(0.92f, 0.9f, 0.86f),
                "blue_black" => new Color(0.08f, 0.1f, 0.18f),
                _ => new Color(0.2f, 0.12f, 0.08f)
            };
        }

        public Color SkinTint()
        {
            return skinTone switch
            {
                "ivory" => new Color(0.96f, 0.86f, 0.78f),
                "tan" => new Color(0.72f, 0.5f, 0.36f),
                "amber" => new Color(0.6f, 0.4f, 0.26f),
                "bronze" => new Color(0.46f, 0.3f, 0.2f),
                "umber" => new Color(0.32f, 0.2f, 0.14f),
                "ebony" => new Color(0.16f, 0.1f, 0.08f),
                _ => new Color(0.82f, 0.64f, 0.5f)
            };
        }

        public Color EyeTint()
        {
            return eyeColor switch
            {
                "brown" => new Color(0.32f, 0.18f, 0.08f),
                "blue" => new Color(0.22f, 0.42f, 0.78f),
                "green" => new Color(0.18f, 0.52f, 0.28f),
                "amber" => new Color(0.78f, 0.48f, 0.12f),
                "gray" => new Color(0.55f, 0.58f, 0.6f),
                "violet" => new Color(0.48f, 0.28f, 0.72f),
                "teal" => new Color(0.18f, 0.62f, 0.58f),
                _ => new Color(0.32f, 0.18f, 0.08f)
            };
        }

        public static CharacterAppearanceData RandomValid()
        {
            var data = Phase1();
            data.bodyType = "canonical_body";
            data.faceId = Pick("face_01", "face_02", "face_03");
            data.skinTone = Pick("ivory", "sand", "tan", "amber", "bronze", "umber", "ebony");
            data.eyeColor = Pick("brown", "blue", "green", "amber", "gray", "violet", "teal");
            data.hairId = Pick("hair_01", "hair_02");
            data.hairColor = Pick("black", "dark_brown", "brown", "blonde", "red", "white", "blue_black");
            data.chestId = Pick("chest_01", "chest_02");
            data.legsId = Pick("pants_01", "pants_02");
            data.bootsId = Pick("boots_01", "boots_02");
            return data;
        }

        public static CharacterAppearanceData VariantA()
        {
            var data = Phase1();
            data.faceId = "face_01";
            data.skinTone = "sand";
            data.eyeColor = "brown";
            data.hairId = "hair_01";
            data.hairColor = "black";
            data.chestId = "chest_01";
            data.legsId = "pants_01";
            data.bootsId = "boots_01";
            return data;
        }

        public static CharacterAppearanceData VariantB()
        {
            var data = Phase1();
            data.faceId = "face_03";
            data.skinTone = "ebony";
            data.eyeColor = "blue";
            data.hairId = "hair_02";
            data.hairColor = "blonde";
            data.chestId = "chest_02";
            data.legsId = "pants_02";
            data.bootsId = "boots_02";
            return data;
        }

        static string Pick(params string[] options)
        {
            return options[UnityEngine.Random.Range(0, options.Length)];
        }
    }
}
