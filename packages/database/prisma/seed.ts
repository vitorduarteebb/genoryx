import { Element, ItemRarity, InventoryCategory, MapType, PrismaClient } from "../generated";

const prisma = new PrismaClient();

const species = [
  { key: "pyron", name: "Pyron", elementPrimary: Element.FIRE, baseHp: 90, baseAtk: 120, baseDef: 80, baseMag: 85, baseRes: 75, baseSpd: 100, isStarter: true },
  { key: "drakor", name: "Drakor", elementPrimary: Element.FIRE, baseHp: 110, baseAtk: 130, baseDef: 95, baseMag: 70, baseRes: 80, baseSpd: 85, isStarter: false },
  { key: "nympha", name: "Nympha", elementPrimary: Element.WATER, baseHp: 100, baseAtk: 95, baseDef: 95, baseMag: 100, baseRes: 100, baseSpd: 95, isStarter: true },
  { key: "aqualis", name: "Aqualis", elementPrimary: Element.WATER, baseHp: 105, baseAtk: 85, baseDef: 90, baseMag: 120, baseRes: 110, baseSpd: 90, isStarter: false },
  { key: "florune", name: "Florune", elementPrimary: Element.NATURE, baseHp: 95, baseAtk: 80, baseDef: 85, baseMag: 110, baseRes: 115, baseSpd: 90, isStarter: true },
  { key: "terranox", name: "Terranox", elementPrimary: Element.EARTH, baseHp: 130, baseAtk: 100, baseDef: 120, baseMag: 70, baseRes: 100, baseSpd: 70, isStarter: false },
  { key: "voltaris", name: "Voltaris", elementPrimary: Element.ELECTRIC, baseHp: 85, baseAtk: 110, baseDef: 75, baseMag: 115, baseRes: 80, baseSpd: 125, isStarter: false },
  { key: "sparkyn", name: "Sparkyn", elementPrimary: Element.ELECTRIC, baseHp: 70, baseAtk: 95, baseDef: 65, baseMag: 100, baseRes: 70, baseSpd: 140, isStarter: false },
  { key: "grumak", name: "Grumak", elementPrimary: Element.EARTH, baseHp: 140, baseAtk: 105, baseDef: 130, baseMag: 60, baseRes: 110, baseSpd: 55, isStarter: false },
  { key: "cryon", name: "Cryon", elementPrimary: Element.ICE, baseHp: 100, baseAtk: 90, baseDef: 100, baseMag: 110, baseRes: 105, baseSpd: 80, isStarter: false },
  { key: "noctyr", name: "Noctyr", elementPrimary: Element.DARK, baseHp: 95, baseAtk: 115, baseDef: 80, baseMag: 120, baseRes: 85, baseSpd: 105, isStarter: false },
  { key: "lumera", name: "Lumera", elementPrimary: Element.LIGHT, baseHp: 100, baseAtk: 90, baseDef: 90, baseMag: 125, baseRes: 120, baseSpd: 95, isStarter: false },
] as const;

async function main() {
  for (const row of species) {
    await prisma.creatureSpecies.upsert({
      where: { key: row.key },
      update: row,
      create: row,
    });
  }

  const maps = [
    { key: "haven", name: "Haven", type: MapType.TOWN },
    { key: "verdantis", name: "Verdantis", type: MapType.EXPLORATION },
    { key: "emberfall", name: "Emberfall", type: MapType.EXPLORATION },
  ] as const;

  for (const row of maps) {
    await prisma.gameMap.upsert({
      where: { key: row.key },
      update: row,
      create: row,
    });
  }

  const verdantis = await prisma.gameMap.findUniqueOrThrow({ where: { key: "verdantis" } });
  const emberfall = await prisma.gameMap.findUniqueOrThrow({ where: { key: "emberfall" } });
  const haven = await prisma.gameMap.findUniqueOrThrow({ where: { key: "haven" } });

  const speciesByKey = Object.fromEntries(
    (await prisma.creatureSpecies.findMany()).map((row) => [row.key, row.id]),
  );

  const requireSpecies = (key: string) => {
    const id = speciesByKey[key];
    if (!id) {
      throw new Error(`Espécie ausente no seed: ${key}`);
    }
    return id;
  };

  const spawnRows = [
    { mapId: verdantis.id, speciesId: requireSpecies("florune"), weight: 35, minLevel: 1, maxLevel: 4 },
    { mapId: verdantis.id, speciesId: requireSpecies("terranox"), weight: 25, minLevel: 2, maxLevel: 5 },
    { mapId: verdantis.id, speciesId: requireSpecies("nympha"), weight: 15, minLevel: 1, maxLevel: 4 },
    { mapId: emberfall.id, speciesId: requireSpecies("pyron"), weight: 40, minLevel: 1, maxLevel: 4 },
    { mapId: emberfall.id, speciesId: requireSpecies("drakor"), weight: 25, minLevel: 3, maxLevel: 6 },
    { mapId: emberfall.id, speciesId: requireSpecies("voltaris"), weight: 15, minLevel: 2, maxLevel: 5 },
  ];

  await prisma.mapSpawn.deleteMany({
    where: { mapId: { in: [verdantis.id, emberfall.id] } },
  });
  await prisma.mapSpawn.createMany({ data: spawnRows });

  const npcs = [
    { key: "professor_kael", name: "Professor Kael", role: "professor", posX: 420, posY: 320 },
    { key: "breeder_lyra", name: "Breeder Lyra", role: "breeder", posX: 620, posY: 300 },
    { key: "blacksmith_orin", name: "Blacksmith Orin", role: "blacksmith", posX: 780, posY: 360 },
    { key: "merchant_theo", name: "Merchant Theo", role: "merchant", posX: 300, posY: 400 },
    { key: "arena_master", name: "Arena Master", role: "arena", posX: 900, posY: 280 },
  ] as const;

  for (const npc of npcs) {
    await prisma.npc.upsert({
      where: { key: npc.key },
      update: { ...npc, mapId: haven.id },
      create: { ...npc, mapId: haven.id },
    });
  }

  const orbs = [
    { key: "nexorb", name: "NexOrb", rarity: ItemRarity.COMMON, category: InventoryCategory.CONSUMABLES },
    { key: "nexorb_plus", name: "NexOrb+", rarity: ItemRarity.UNCOMMON, category: InventoryCategory.CONSUMABLES },
    { key: "nexorb_ultra", name: "NexOrb Ultra", rarity: ItemRarity.RARE, category: InventoryCategory.CONSUMABLES },
    { key: "nexorb_ancient", name: "NexOrb Ancient", rarity: ItemRarity.ANCIENT, category: InventoryCategory.CONSUMABLES },
    { key: "tonic", name: "Tônico menor", rarity: ItemRarity.COMMON, category: InventoryCategory.CONSUMABLES },
    { key: "genome_catalyst", name: "Genome Catalyst", rarity: ItemRarity.RARE, category: InventoryCategory.MATERIALS },
  ] as const;

  for (const orb of orbs) {
    await prisma.itemTemplate.upsert({
      where: { key: orb.key },
      update: { name: orb.name, rarity: orb.rarity, category: orb.category, stackable: true },
      create: { ...orb, stackable: true },
    });
  }

  await prisma.quest.upsert({
    where: { key: "the-genesis-code" },
    update: { name: "The Genesis Code", type: "BREEDING" },
    create: { key: "the-genesis-code", name: "The Genesis Code", type: "BREEDING" },
  });

  await prisma.quest.upsert({
    where: { key: "first-hunt" },
    update: { name: "First Hunt", type: "CAPTURE" },
    create: { key: "first-hunt", name: "First Hunt", type: "CAPTURE" },
  });

  await prisma.quest.upsert({
    where: { key: "first-spark" },
    update: { name: "First Spark", type: "TUTORIAL" },
    create: { key: "first-spark", name: "First Spark", type: "TUTORIAL" },
  });

  await prisma.user.upsert({
    where: { email: "system@genoryx.internal" },
    update: {},
    create: {
      email: "system@genoryx.internal",
      passwordHash: "SYSTEM_NO_LOGIN",
      role: "PLAYER",
      wallets: {
        create: [{ currency: "GOLD", balance: 0n }, { currency: "NEX", balance: 0n }],
      },
    },
  });

  const mutations = [
    { key: "PLASMA", name: "Plasma", elementSecondary: Element.ELECTRIC },
    { key: "MAGMA", name: "Magma", elementSecondary: Element.FIRE },
    { key: "ANCIENT", name: "Ancient", elementSecondary: null },
    { key: "VOID", name: "Void", elementSecondary: Element.DARK },
  ] as const;

  for (const row of mutations) {
    await prisma.mutation.upsert({
      where: { key: row.key },
      update: { name: row.name, elementSecondary: row.elementSecondary },
      create: { key: row.key, name: row.name, elementSecondary: row.elementSecondary },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
