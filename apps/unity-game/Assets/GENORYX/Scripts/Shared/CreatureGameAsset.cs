using UnityEngine;

namespace Genoryx
{
    public enum CreatureRenderMode
    {
        Model3DAnimated,
        Model3D,
        Portrait,
        SpeciesMaster,
        Silhouette
    }

    [System.Serializable]
    public class CreatureGameAsset
    {
        public string creatureId;
        public string speciesKey;
        public string temperament;
        public string lifeStage;
        public CreatureRenderMode renderMode = CreatureRenderMode.Silhouette;
        public string modelUrl;
        public string portraitUrl;
        public bool forming;
    }
}
