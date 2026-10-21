namespace Genoryx
{
    public static class WorldAreaId
    {
        public const string HavenGenesisPlaza = "Haven_GenesisPlaza";
        public const string HavenSouthGate = "Haven_SouthGate";
        public const string VerdantisGreenRoad = "Verdantis_GreenRoad";
        public const string VerdantisLuminaGrove = "Verdantis_LuminaGrove";
        public const string VerdantisHollow = "Verdantis_Hollow";
    }

    public enum WorldCameraState
    {
        Exploration,
        NarrowPath,
        Vista,
        EncounterFocus,
        GateTransition
    }

    public enum WorldInteractKind
    {
        Npc,
        Poi,
        Exit,
        Wild,
        Collectable
    }

    public enum WorldWildBehavior
    {
        Passive,
        Curious,
        Territorial,
        Predatory
    }
}
