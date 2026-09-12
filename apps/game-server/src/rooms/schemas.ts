import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") characterId = "";
  @type("string") name = "";
  @type("string") mapKey = "";
  @type("number") x = 0;
  @type("number") y = 0;
  @type("string") facing = "down";
  @type("number") lastProcessedSequence = 0;
  @type("string") companionCreatureId = "";
  @type("string") companionSpeciesKey = "";
  @type("string") companionTemperament = "";
}

export class NpcState extends Schema {
  @type("string") key = "";
  @type("string") name = "";
  @type("string") role = "";
  @type("number") x = 0;
  @type("number") y = 0;
}

export class MobState extends Schema {
  @type("string") spawnKey = "";
  @type("string") speciesKey = "";
  @type("string") family = "COMMON";
  @type("string") aggro = "PASSIVE";
  @type("number") level = 1;
  @type("number") x = 0;
  @type("number") y = 0;
  @type("string") state = "IDLE";
}

export class WorldState extends Schema {
  @type("string") mapKey = "haven";
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ array: NpcState }) npcs = new ArraySchema<NpcState>();
  @type({ array: MobState }) mobs = new ArraySchema<MobState>();
}
