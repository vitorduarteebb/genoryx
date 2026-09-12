using System.IO;
using UnityEngine;

namespace Genoryx
{
    public static class CharacterAppearanceStore
    {
        const string Key = "genoryx.character.appearance";

        public static string FilePath =>
            Path.Combine(Application.persistentDataPath, "genoryx_appearance.json");

        public static void Save(CharacterAppearanceData data)
        {
            var json = (data ?? CharacterAppearanceData.Phase1()).ToJson();
            PlayerPrefs.SetString(Key, json);
            PlayerPrefs.Save();
            try
            {
                File.WriteAllText(FilePath, json);
            }
            catch (IOException)
            {
            }
        }

        public static CharacterAppearanceData Load()
        {
            var prefs = PlayerPrefs.GetString(Key, "");
            if (!string.IsNullOrEmpty(prefs))
            {
                return CharacterAppearanceData.FromJson(prefs);
            }

            try
            {
                if (File.Exists(FilePath))
                {
                    return CharacterAppearanceData.FromJson(File.ReadAllText(FilePath));
                }
            }
            catch (IOException)
            {
            }

            return CharacterAppearanceData.Phase1();
        }

        public static string ToNetworkPayload(CharacterAppearanceData data)
        {
            return (data ?? CharacterAppearanceData.Phase1()).ToJson();
        }

        public static CharacterAppearanceData FromNetworkPayload(string json)
        {
            return CharacterAppearanceData.FromJson(json);
        }
    }
}
