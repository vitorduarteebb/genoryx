import type { IsoMap, IsoNpc } from "./maps";

/** Connected additions preserve original exits and the player's saved coordinates. */
export function expandMap(map: IsoMap): IsoMap {
  if (map.interactables.some((row) => row.id === "haven.market" || row.id === "verdantis.camp")) {
    return map;
  }
  const haven = map.id === "haven";
  map.bounds = haven
    ? { minX: -12, maxX: 12, minZ: -11, maxZ: 13 }
    : { minX: -11, maxX: 11, minZ: -2, maxZ: 29 };
  map.walk = haven
    ? { minX: -10, maxX: 10, minZ: -9, maxZ: 11 }
    : { minX: -9, maxX: 9, minZ: -0.6, maxZ: 27 };

  const road = (points: number[][]) => {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.32);
      for (let j = 0; j <= n; j++) {
        map.tiles.push({
          x: a[0] + ((b[0] - a[0]) * j) / n,
          z: a[1] + ((b[1] - a[1]) * j) / n,
          tile: haven ? "path" : "earth",
        });
      }
    }
  };

  const site = (id: string, name: string, x: number, z: number, body: string) => {
    map.marks.push({ x, z, kind: "poi", label: name });
    map.interactables.push({ id, name, x, z, kind: "poi", prompt: "Entrar", body, radius: 1.4 });
    map.discoveries.push({ id, toast: `${name} descoberto`, x, z, r: 2.5 });
  };

  const prop = (x: number, z: number, name: string, solid = false) => {
    map.props.push({ x, z, prop: name, layer: solid ? 9 : 3 });
    if (solid) map.blocks.push({ x, z, r: 1 });
  };

  const npc = (
    id: string,
    name: string,
    role: string,
    x: number,
    z: number,
    archetype: IsoNpc["archetype"],
    palette: IsoNpc["palette"],
    body: string,
  ) => {
    map.npcs.push({ id, name, role, x, z, archetype, palette });
    map.interactables.push({
      id,
      name: `${name} · ${role}`,
      x,
      z,
      kind: "npc",
      prompt: "Conversar",
      body,
      radius: 1.2,
    });
  };

  if (haven) {
    road([
      [0, -3.6],
      [0, -7],
      [-7, -7],
      [-8, -1],
      [-4, 0],
    ]);
    road([
      [0, -7],
      [7, -7],
      [8, 1],
      [8, 6],
      [2, 5],
    ]);
    road([
      [-8, -1],
      [-8, 6],
      [0, 7.5],
    ]);
    // Stand points sit off the solid props so the player can actually enter.
    site("haven.market", "Mercado das Linhagens", 0, -5.6, "Bancas coloridas recebem treinadores de todas as regiões.");
    site("haven.garden", "Jardim Genesis", 6.4, 5.4, "Um jardim tranquilo onde as criaturas descansam entre expedições.");
    site("haven.residential", "Vila dos Treinadores", -6.4, 4, "Casas, pequenas hortas e histórias de jornadas que ainda vão começar.");
    for (const x of [-4, 3, 6]) prop(x, -8.7, "stall", true);
    for (const z of [-4, 2, 6]) {
      prop(-10, z, "houseA", true);
      prop(10, z, "treeHavenA");
    }
    prop(8, 5, "shrine", true);
    prop(7, 7, "bench");
    prop(9, 7, "planter");
    prop(-7, 7, "houseC", true);
    npc("npc.mira", "Mira", "Mercadora", -2, -7, "MERCHANT", "gold", "O mercado começa cedo. Cada viajante traz uma história diferente.");
    npc("npc.oren", "Oren", "Pesquisador", 7, 3, "RESEARCHER", "violet", "Observe sua criatura com calma: os detalhes contam a história da linhagem.");
    npc("npc.aya", "Aya", "Cuidadora", -8, 2, "BREEDER", "green", "Uma pausa à sombra também faz parte da aventura.");
  } else {
    road([
      [0, 13],
      [0, 17],
      [-5, 18],
      [-5, 24],
      [0, 26],
      [5, 23],
      [5, 18],
      [0, 17],
    ]);
    site("verdantis.camp", "Acampamento Aurora", -5, 18, "Viajantes se reúnem perto das tendas e preparam a próxima expedição.");
    site("verdantis.ruins", "Ruínas do Primeiro Eco", 5, 23, "Colunas partidas cercam um cristal que ainda conserva uma luz tênue.");
    site("verdantis.canopy", "Clareira das Lanternas", 0, 26, "Pequenos pontos de luz atravessam a vegetação antiga.");
    prop(-7, 18, "stall", true);
    prop(-6, 20, "crate");
    prop(-4, 20, "log");
    prop(6, 24, "ruin", true);
    prop(4, 25, "crystal");
    prop(-1, 27, "waystone", true);
    npc("npc.sol", "Sol", "Exploradora", -5, 17, "ADVENTURER", "green", "A trilha se divide aqui. As ruínas ficam a leste, e a clareira ao norte.");
    npc("npc.ivo", "Ivo", "Sentinela", 4, 21, "GUARD", "steel", "Siga os marcos de pedra para encontrar o caminho de volta.");
  }

  // Vegetation stays off the new paths; solid trunks receive matching collision circles.
  for (let i = 0; i < 30; i++) {
    const x = Math.sin(i * 2.399) * (haven ? 10.5 : 9.8);
    const z = haven ? -9 + (i % 7) * 3 : 14 + (i % 7) * 2;
    if (map.tiles.some((t) => ["path", "earth", "stone", "plaza"].includes(t.tile) && Math.hypot(t.x - x, t.z - z) < 1.2)) {
      continue;
    }
    const name = haven ? (i % 2 ? "treeHavenA" : "treeHavenB") : i % 2 ? "treeVerdA" : "treeVerdB";
    map.props.push({ x, z, prop: name, layer: 12, scale: 0.85 + (i % 3) * 0.15 });
    map.blocks.push({ x, z, r: 0.26 });
    map.props.push({ x: x + 0.5, z: z + 0.3, prop: i % 2 ? "flowers" : "grassClump", layer: 2 });
  }

  return map;
}
