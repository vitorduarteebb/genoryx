using UnityEngine;

namespace Genoryx.WorldArt
{
    public enum WorldArtQuality
    {
        WORLD_MOBILE_LOW,
        WORLD_MOBILE_MEDIUM,
        WORLD_HIGH,
    }

    public static class WorldArtQualityProfiles
    {
        public static WorldArtQuality Detect()
        {
            if (SystemInfo.processorCount <= 4 && (Screen.width < 900 || Screen.height < 900))
            {
                return WorldArtQuality.WORLD_MOBILE_LOW;
            }

            if (Screen.width < 1100 || Application.isMobilePlatform)
            {
                return WorldArtQuality.WORLD_MOBILE_MEDIUM;
            }

            return WorldArtQuality.WORLD_HIGH;
        }

        public static int ParticleBudget(WorldArtQuality quality) => quality switch
        {
            WorldArtQuality.WORLD_MOBILE_LOW => 8,
            WorldArtQuality.WORLD_MOBILE_MEDIUM => 18,
            _ => 36,
        };

        public static float CreatureAnimFps(WorldArtQuality quality) => quality switch
        {
            WorldArtQuality.WORLD_MOBILE_LOW => 8f,
            WorldArtQuality.WORLD_MOBILE_MEDIUM => 12f,
            _ => 20f,
        };
    }
}
