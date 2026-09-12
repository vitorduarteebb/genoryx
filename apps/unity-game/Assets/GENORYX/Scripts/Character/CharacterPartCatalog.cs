using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace Genoryx
{
    [Serializable]
    public class CharacterPartRecord
    {
        public string id;
        public string slot;
        public string file;
        public string bone;
        public string displayName;
        public string hiddenBodyRegions;
        public string rarity = "COMMON";
        public string compatibleBody = "canonical_body";
    }

    [Serializable]
    class CatalogFile
    {
        public CharacterPartRecord[] parts;
    }

    public static class CharacterPartCatalog
    {
        static Dictionary<string, CharacterPartRecord> map;

        public static string ProcessedFile(string relative)
        {
            var processed = Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "Processed", relative.Replace("/", Path.DirectorySeparatorChar.ToString()));
            if (File.Exists(processed))
            {
                return processed;
            }

            return Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "Generated", relative.Replace("/", Path.DirectorySeparatorChar.ToString()));
        }

        public static string GeneratedFile(string relative)
        {
            return ProcessedFile(relative);
        }

        public static string CanonicalBody()
        {
            var processed = ProcessedFile("Bodies/canonical_body.glb");
            if (File.Exists(processed))
            {
                return processed;
            }

            return Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "phase1", "canonical.rigged.glb");
        }

        public static string AnimFile(string name)
        {
            var processed = Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "Processed", "Bodies", name);
            if (File.Exists(processed))
            {
                return processed;
            }

            var canonical = Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "phase1", "canonical." + name.Replace("anim.", ""));
            if (File.Exists(canonical))
            {
                return canonical;
            }

            return CharacterGltfLoader.Phase1File(name);
        }

        public static void Ensure()
        {
            map = new Dictionary<string, CharacterPartRecord>();
            var path = Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "Processed", "catalog.json");
            if (!File.Exists(path))
            {
                path = Path.Combine(Application.streamingAssetsPath, "GENORYX", "Characters", "Generated", "catalog.json");
            }

            if (File.Exists(path))
            {
                var file = JsonUtility.FromJson<CatalogFile>(File.ReadAllText(path));
                if (file?.parts != null)
                {
                    foreach (var part in file.parts)
                    {
                        if (!string.IsNullOrEmpty(part.id))
                        {
                            map[part.id] = part;
                        }
                    }
                }
            }

            SeedFallback();
        }

        static void SeedFallback()
        {
            void Add(string id, string slot, string file, string bone, string hide)
            {
                if (map.ContainsKey(id))
                {
                    return;
                }

                map[id] = new CharacterPartRecord
                {
                    id = id,
                    slot = slot,
                    file = file,
                    bone = bone,
                    displayName = id,
                    hiddenBodyRegions = hide,
                    rarity = "COMMON",
                    compatibleBody = "canonical_body"
                };
            }

            Add("canonical_body", "BODY", "Bodies/canonical_body.glb", "", "");
            Add("hair_01", "HAIR", "Hair/hair_test_01.glb", "Head", "SCALP");
            Add("hair_02", "HAIR", "Hair/hair_02.glb", "Head", "SCALP");
            Add("chest_01", "CHEST", "Chest/chest_01.glb", "Chest", "TORSO");
            Add("chest_02", "CHEST", "Chest/chest_02.glb", "Chest", "TORSO");
            Add("pants_01", "LEGS", "Legs/pants_01.glb", "Pelvis", "PELVIS,UPPER_LEG_L,UPPER_LEG_R");
            Add("pants_02", "LEGS", "Legs/pants_02.glb", "Pelvis", "PELVIS,UPPER_LEG_L,UPPER_LEG_R");
            Add("boots_01", "BOOTS", "Boots/boots_01.glb", "Pelvis", "FOOT_L,FOOT_R,LOWER_LEG_L,LOWER_LEG_R");
            Add("boots_02", "BOOTS", "Boots/boots_02.glb", "Pelvis", "FOOT_L,FOOT_R");

            ForceHide("hair_01", "SCALP");
            ForceHide("hair_02", "SCALP");
            ForceHide("chest_01", "TORSO");
            ForceHide("chest_02", "TORSO");
            ForceHide("pants_01", "PELVIS,UPPER_LEG_L,UPPER_LEG_R");
            ForceHide("pants_02", "PELVIS,UPPER_LEG_L,UPPER_LEG_R");
            ForceHide("boots_01", "FOOT_L,FOOT_R,LOWER_LEG_L,LOWER_LEG_R");
            ForceHide("boots_02", "FOOT_L,FOOT_R");
        }

        static void ForceHide(string id, string hide)
        {
            if (map.TryGetValue(id, out var part))
            {
                part.hiddenBodyRegions = hide;
            }
        }

        public static CharacterPartRecord Find(string id)
        {
            if (map == null)
            {
                Ensure();
            }

            if (map.TryGetValue(id, out var part))
            {
                return part;
            }

            if (id == "hair_01_short")
            {
                return Find("hair_01");
            }

            if (id == "hair_02_messy")
            {
                return Find("hair_02");
            }

            if (id == "chest_novice_tamer")
            {
                return Find("chest_01");
            }

            if (id == "chest_field_explorer")
            {
                return Find("chest_02");
            }

            if (id == "legs_explorer")
            {
                return Find("pants_01");
            }

            if (id == "legs_reinforced")
            {
                return Find("pants_02");
            }

            if (id == "boots_explorer")
            {
                return Find("boots_01");
            }

            if (id == "boots_leather")
            {
                return Find("boots_02");
            }

            return null;
        }

        public static bool HasMesh(string id)
        {
            var part = Find(id);
            return part != null && !string.IsNullOrEmpty(part.file) && File.Exists(ProcessedFile(part.file));
        }

        public static IEnumerable<CharacterPartRecord> BySlot(string slot)
        {
            if (map == null)
            {
                Ensure();
            }

            foreach (var part in map.Values)
            {
                if (part.slot == slot)
                {
                    yield return part;
                }
            }
        }
    }
}
