import { emberBabyChassis, floruneWildChassis } from "../adventure-chassis";
import { captureZones } from "@nexora/config";
import type { AdventureAreaId } from "../adventure-return";
import type { CreatureVisualInput } from "../creature-visual-contract";
import { companionWorldOffset } from "../world-art/scale";
import { motesFor } from "../world-art/vfx";
import { paintWorldMinimap } from "../world-art/minimap";
import { detectWorldQuality, worldQuality } from "../world-art/quality";
import { bakeWorldAvatar, type WorldAvatar } from "./avatar";
import {
  areaPackImage,
  bakeCharacterWorldAvatar,
  loadAreaArtPack,
  loadNpcWorldSprite,
  paintWorldHitmap,
  plateScreenRect,
  readWorldDebugFlags,
  type CharacterWorldAvatar,
  type NpcWorldSprite,
} from "./assets";
import { buildIsoKit, type IsoKit } from "./kit";
import { mapFor, type IsoMap } from "./maps";
import { bakeTerrain } from "./terrain";
import { depthOf, dirFromDelta, screenToWorld, worldToScreen, type IsoDir } from "./projection";
import { buildTamerAtlas, paintNpc, type TamerAtlas } from "./tamer";
import type { AdventureHudState, AdventureInteractable } from "./types";
import { worldAssetForProp, worldPlate, type NpcArchetype } from "@nexora/config";

type Listener = (state: AdventureHudState) => void;

type Actor = {
  x: number;
  z: number;
  dir: IsoDir;
  moving: boolean;
  frame: number;
};

function blocked(map: IsoMap, x: number, z: number) {
  if (x < map.walk.minX || x > map.walk.maxX || z < map.walk.minZ || z > map.walk.maxZ) return true;
  return map.blocks.some((b) => Math.hypot(b.x - x, b.z - z) < b.r);
}

export function createAdventureWorld(
  canvas: HTMLCanvasElement,
  options: {
    companion?: CreatureVisualInput | null;
    appearance?: unknown;
    startArea?: AdventureAreaId;
    startAt?: { x: number; z: number };
    wildGone?: boolean;
    onHud: Listener;
    onToast: (text: string) => void;
    minimap?: HTMLCanvasElement | null;
  },
) {
  const mobile = window.innerWidth < 760 || "ontouchstart" in window;
  const raw = canvas.getContext("2d");
  if (!raw) throw new Error("2d");
  const ctx: CanvasRenderingContext2D = raw;
  const quality = worldQuality(detectWorldQuality());
  const follow = companionWorldOffset();
  const kit: IsoKit = buildIsoKit();
  const tamer: TamerAtlas = buildTamerAtlas(options.appearance);
  let flags = readWorldDebugFlags(options.startArea ?? "haven");
  const npcSprites = new Map<NpcArchetype, NpcWorldSprite>();

  let area: AdventureAreaId = options.startArea ?? "haven";
  let wildVisible = !options.wildGone;
  let map = mapFor(area, wildVisible);
  let terrain=bakeTerrain(map);
  let terrainArea=area;
  const player: Actor = {
    x: options.startAt?.x ?? map.spawn.x,
    z: options.startAt?.z ?? map.spawn.z,
    dir: "N",
    moving: false,
    frame: 0,
  };
  const companion: Actor = { x: player.x + follow.x, z: player.z + follow.z, dir: "N", moving: false, frame: 0 };
  const wild: Actor = { x: 3.2, z: 8.5, dir: "W", moving: true, frame: 0 };
  let destination: { x: number; z: number } | null = null;
  let camX = 0;
  let camY = 0;
  let zoom = mobile ? 1.44 : 1.5;
  let targetZoom = zoom;
  let selected: string | null = null;
  let discovered = new Set<string>(area === "verdantis" ? ["haven.plaza", "haven.gate"] : []);
  let toast: string | null = null;
  let companionAvatar: WorldAvatar | undefined;
  let wildAvatar: WorldAvatar | undefined;
  let characterAvatar: CharacterWorldAvatar | undefined;
  let disposed = false;
  let frame = 0;
  let last = performance.now();
  let fps = 60;
  let sprites = 0;
  const held = { w: false, a: false, s: false, d: false };

  function emit(force = false) {
    const habitat=area==="verdantis"?captureZones.find(zone=>Math.hypot(player.x-zone.x,player.z-zone.z)<zone.radius):undefined;
    options.onHud({
      area,
      region: habitat?`Verdantis · ${habitat.name}`:map.region,
      player: { x: player.x, z: player.z },
      destination,
      nearby: closest(),
      selected,
      discovered: [...discovered],
      toast,
      wildVisible,
      metrics: {
        fps: Math.round(fps),
        sprites,
        avatar: companionAvatar?.source === "sprite-atlas" ? "sprite-atlas" : characterAvatar?.source === "needs-art" ? "needs-art" : "fallback",
        debugArt: flags.debugArt,
      },
    });
    void force;
  }

  function closest() {
    let best: AdventureInteractable | null = null;
    let bestGap = 1.55;
    for (const item of map.interactables) {
      if (item.kind === "wild" && !wildVisible) continue;
      const x = item.kind === "wild" ? wild.x : item.x;
      const z = item.kind === "wild" ? wild.z : item.z;
      const gap = Math.hypot(x - player.x, z - player.z);
      if (gap < Math.max(item.radius, 1.15) && gap < bestGap) {
        best = { ...item, x, z };
        bestGap = gap;
      }
    }
    return best;
  }

  function toastOnce(id: string, text: string) {
    if (discovered.has(id)) return;
    discovered.add(id);
    toast = text;
    options.onToast(text);
    window.setTimeout(() => {
      if (toast === text) toast = null;
      emit(true);
    }, 2600);
  }

  function setArea(next: AdventureAreaId, spawn?: { x: number; z: number }) {
    area = next;
    flags = readWorldDebugFlags(area);
    map = mapFor(area, wildVisible);
    player.x = spawn?.x ?? map.spawn.x;
    player.z = spawn?.z ?? map.spawn.z;
    companion.x = player.x + follow.x;
    companion.z = player.z + follow.z;
    destination = null;
    selected = null;
    const origin = worldToScreen(player.x, player.z);
    camX = origin.x;
    camY = origin.y;
    void loadAreaArtPack(area, window.devicePixelRatio || 1);
    emit(true);
  }

  function nearestOpen(x: number, z: number) {
    if (!blocked(map, x, z)) return { x, z };
    for (let ring = 1; ring <= 8; ring++) {
      const step = ring * 0.45;
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i;
        const nx = x + Math.cos(angle) * step;
        const nz = z + Math.sin(angle) * step;
        if (!blocked(map, nx, nz)) return { x: nx, z: nz };
      }
    }
    return { x: map.spawn.x, z: map.spawn.z };
  }

  function enterAt(x: number, z: number) {
    const spot = nearestOpen(x, z);
    player.x = spot.x;
    player.z = spot.z;
    companion.x = player.x + follow.x;
    companion.z = player.z + follow.z;
    destination = null;
    selected = null;
    const origin = worldToScreen(player.x, player.z);
    camX = origin.x;
    camY = origin.y;
    emit(true);
  }

  function places() {
    const districts = map.interactables
      .filter((row) => row.kind === "poi" && (row.id.startsWith("haven.") || row.id.startsWith("verdantis.")))
      .map((row) => ({ id: row.id, name: row.name, x: row.x, z: row.z }));
    if (area === "haven") {
      return [{ id: "haven.plaza", name: "Genesis Plaza", x: map.spawn.x, z: map.spawn.z }, ...districts];
    }
    return [{ id: "verdantis.road", name: "Green Road", x: map.spawn.x, z: map.spawn.z }, ...districts];
  }

  function pointFromMinimap(clientX: number, clientY: number) {
    const el = options.minimap;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return null;
    const sx = ((clientX - rect.left) / rect.width) * el.width;
    const sy = ((clientY - rect.top) / rect.height) * el.height;
    const pad = 18;
    const spanX = el.width - pad * 2;
    const spanY = el.height - pad * 2;
    if (spanX <= 0 || spanY <= 0) return null;
    return {
      x: map.bounds.minX + ((sx - pad) / spanX) * (map.bounds.maxX - map.bounds.minX),
      z: map.bounds.minZ + ((sy - pad) / spanY) * (map.bounds.maxZ - map.bounds.minZ),
    };
  }

  function travel(next: AdventureAreaId) {
    if (next === area) return;
    setArea(next, next === "verdantis" ? { x: 0, z: 0.8 } : { x: 0, z: 7.8 });
    if (next === "haven") toastOnce("haven.gate", "South Gate — de volta à cidade");
    else toastOnce("verdantis.road", "Verdantis · Green Road descoberta");
  }

  function tryStep(x: number, z: number) {
    if (!blocked(map, x, z)) {
      player.x = x;
      player.z = z;
      return true;
    }
    if (!blocked(map, x, player.z)) {
      player.x = x;
      return true;
    }
    if (!blocked(map, player.x, z)) {
      player.z = z;
      return true;
    }
    return false;
  }

  function pick(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const sx = ((clientX - rect.left) * (canvas.width / rect.width) - canvas.width / 2) / zoom + camX;
    const sy = ((clientY - rect.top) * (canvas.height / rect.height) - canvas.height * 0.62) / zoom + camY;
    return screenToWorld(sx, sy);
  }

  function tap(clientX: number, clientY: number) {
    const point = pick(clientX, clientY);
    if (!point) return null;
    for (const item of map.interactables) {
      if (item.kind === "wild" && !wildVisible) continue;
      const x = item.kind === "wild" ? wild.x : item.x;
      const z = item.kind === "wild" ? wild.z : item.z;
      if (Math.hypot(x - point.x, z - point.z) < Math.max(item.radius, mobile ? 1.25 : 0.95)) {
        destination = { x, z };
        selected = item.id;
        emit(true);
        return { ...item, x, z };
      }
    }
    selected = null;
    destination = point;
    emit(true);
    return null;
  }

  function snapshot() {
    return { area, x: player.x, z: player.z, wildGone: !wildVisible };
  }

  function hideWild() {
    wildVisible = false;
    map = mapFor(area, false);
    emit(true);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  function drawGroundMarker(x: number, z: number) {
    const p = worldToScreen(x, z);
    const sx = (p.x - camX) * zoom + canvas.width / 2;
    const sy = (p.y - camY) * zoom + canvas.height * 0.62;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#c9a24a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 6, 18 * zoom, 8 * zoom, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawSprite(img: CanvasImageSource | undefined, x: number, z: number, layer: number, scale = 1, glow = false, anchorY = 1) {
    // An atlas may still be baking during travel; do not abort the world frame.
    if(!img)return;
    const p = worldToScreen(x, z);
    const sx = (p.x - camX) * zoom + canvas.width / 2;
    const sy = (p.y - camY) * zoom + canvas.height * 0.62;
    const w = ("width" in img ? Number(img.width) : 64) * scale * (zoom / 1.2);
    const h = ("height" in img ? Number(img.height) : 64) * scale * (zoom / 1.2);
    if (sx < -120 || sy < -140 || sx > canvas.width + 120 || sy > canvas.height + 140) return;
    const playerScreen = worldToScreen(player.x, player.z);
    const psx = (playerScreen.x - camX) * zoom + canvas.width / 2;
    const psy = (playerScreen.y - camY) * zoom + canvas.height * 0.62;
    const occludes = layer >= 11 && Math.hypot(sx - psx, sy - h * 0.45 - psy) < Math.max(w, h) * 0.38;
    ctx.save();
    if (occludes) ctx.globalAlpha = 0.38;
    if (glow) drawGroundMarker(x, z);
    ctx.drawImage(img, sx - w / 2, sy - h * anchorY, w, h);
    ctx.restore();
    sprites += 1;
  }

  function drawPlate(defId: "background" | "base") {
    const def = worldPlate(area, defId);
    if (!def) return false;
    const img = areaPackImage(def, window.devicePixelRatio || 1);
    if (!img) return false;
    const rect = plateScreenRect(def, camX, camY, zoom, canvas.width, canvas.height);
    if (!rect) return false;
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
    sprites += 1;
    return true;
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, map.sky[0]);
    g.addColorStop(0.42, map.sky[1]);
    g.addColorStop(1, map.id === "haven" ? "#2a2418" : "#142016");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (drawPlate("background")) {
      ctx.fillStyle = map.fog;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.22);
      return;
    }
    ctx.fillStyle = map.id === "haven" ? "rgba(30,42,38,.55)" : "rgba(12,28,16,.6)";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.34);
    ctx.quadraticCurveTo(canvas.width * 0.3, canvas.height * 0.22, canvas.width * 0.55, canvas.height * 0.3);
    ctx.quadraticCurveTo(canvas.width * 0.78, canvas.height * 0.2, canvas.width, canvas.height * 0.32);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();
    ctx.fillStyle = map.fog;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.38);
  }

  function propImage(prop: string) {
    const def = worldAssetForProp(prop);
    const ready = def ? areaPackImage(def, window.devicePixelRatio || 1) : null;
    if (ready) return ready;
    if (flags.debugArt) return kit.props[prop] ?? kit.tiles[prop] ?? null;
    return null;
  }

  function drawMotes(now: number) {
    const spec = motesFor(map.id === "verdantis" ? "verdantis" : "haven", quality.particles);
    ctx.fillStyle = spec.color;
    for (let i = 0; i < spec.count; i++) {
      const t = now * spec.speed * 0.001 + i * 1.7;
      const x = ((Math.sin(t + i) * 0.5 + 0.5) * canvas.width + i * 37) % canvas.width;
      const y = ((Math.cos(t * 0.8 + i) * 0.5 + 0.5) * canvas.height * 0.7 + 40) % (canvas.height * 0.85);
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.arc(x, y, map.id === "haven" ? 1.6 : 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function tick(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    fps = fps * 0.9 + (1 / Math.max(dt, 0.008)) * 0.1;
    sprites = 0;

    let keyX = 0;
    let keyZ = 0;
    if (held.w) {
      keyX -= 1;
      keyZ -= 1;
    }
    if (held.s) {
      keyX += 1;
      keyZ += 1;
    }
    if (held.a) {
      keyX -= 1;
      keyZ += 1;
    }
    if (held.d) {
      keyX += 1;
      keyZ -= 1;
    }
    if (keyX || keyZ) {
      destination = null;
      const len = Math.hypot(keyX, keyZ) || 1;
      tryStep(player.x + (keyX / len) * 3.15 * dt, player.z + (keyZ / len) * 3.15 * dt);
      player.dir = dirFromDelta(keyX, keyZ);
      player.moving = true;
    } else if (destination) {
      const dx = destination.x - player.x;
      const dz = destination.z - player.z;
      const gap = Math.hypot(dx, dz);
      if (gap < 0.16) {
        destination = null;
        player.moving = false;
      } else {
        const step = Math.min(gap, 3.15 * dt);
        tryStep(player.x + (dx / gap) * step, player.z + (dz / gap) * step);
        player.dir = dirFromDelta(dx, dz);
        player.moving = true;
      }
    } else {
      player.moving = false;
    }

    const desired = { x: player.x + follow.x, z: player.z + follow.z };
    const previousCompanion={x:companion.x,z:companion.z};
    companion.x += (desired.x - companion.x) * (1 - Math.exp(-5 * dt));
    companion.z += (desired.z - companion.z) * (1 - Math.exp(-5 * dt));
    const companionDx=companion.x-previousCompanion.x,companionDz=companion.z-previousCompanion.z;
    const companionDistance=Math.hypot(companionDx,companionDz);
    companion.moving = companionDistance > dt*.12;
    if(companion.moving)companion.dir = dirFromDelta(companionDx/Math.max(dt,.001),companionDz/Math.max(dt,.001));
    const anim = quality.creatureFps / 10;
    player.frame += dt * (player.moving ? anim * 6 : 4);
    companion.frame += companion.moving ? companionDistance*(companionAvatar?.frames[companion.dir].walk.length??6)/1.7 : dt*anim;

    if (area === "verdantis" && wildVisible) {
      wild.x = 3.2 + Math.sin(now / 1400) * 0.7;
      wild.z = 8.5 + Math.cos(now / 1700) * 0.55;
      wild.dir = dirFromDelta(-Math.sin(now / 1400), -Math.cos(now / 1700));
      wild.frame += dt * anim * 5;
      const row = map.interactables.find((item) => item.id === "wild.florune");
      if (row) {
        row.x = wild.x;
        row.z = wild.z;
      }
    }

    const nearCore = area === "haven" && Math.hypot(player.x, player.z) < 2.1;
    const nearGate = area === "haven" && player.z > 7.2;
    const nearWild = area === "verdantis" && selected === "wild.florune";
    targetZoom = mobile
      ? nearWild
        ? 1.52
        : nearGate
          ? 1.38
          : nearCore
            ? 1.36
            : 1.44
      : nearWild
        ? 1.62
        : nearGate
          ? 1.42
          : nearCore
            ? 1.38
            : 1.5;
    zoom += (targetZoom - zoom) * (1 - Math.exp(-3.2 * dt));
    const focus = worldToScreen(player.x, player.z - 0.15);
    camX += (focus.x - camX) * (1 - Math.exp(-5.4 * dt));
    camY += (focus.y - camY) * (1 - Math.exp(-5.4 * dt));

    for (const zone of map.discoveries) {
      if (Math.hypot(zone.x - player.x, zone.z - player.z) < zone.r) toastOnce(zone.id, zone.toast);
    }

    drawBackground();
    const nearId = closest()?.id ?? null;
    const drawables: Array<{ depth: number; draw: () => void }> = [];
    const basePlate = !flags.debugArt && drawPlate("base");
    if (!basePlate && flags.debugArt) {
      if(terrainArea!==area){terrain=bakeTerrain(map);terrainArea=area;}
      ctx.drawImage(terrain.image,(terrain.left-camX)*zoom+canvas.width/2,(terrain.top-camY)*zoom+canvas.height*.62,terrain.worldWidth*zoom,terrain.worldHeight*zoom);
    }
    for (const prop of map.props) {
      const img = propImage(prop.prop);
      if (!img) continue;
      drawables.push({
        depth: depthOf(prop.x, prop.z, prop.layer ?? 5),
        draw: () => {
          ctx.save();
          if (prop.flip) {
            const p = worldToScreen(prop.x, prop.z);
            const sx = (p.x - camX) * zoom + canvas.width / 2;
            ctx.translate(sx, 0);
            ctx.scale(-1, 1);
            ctx.translate(-sx, 0);
          }
          drawSprite(img, prop.x, prop.z, prop.layer ?? 5, prop.scale ?? 1);
          ctx.restore();
        },
      });
    }
    for (const npc of map.npcs) {
      const ready = npcSprites.get(npc.archetype)?.image;
      const img = ready ?? paintNpc(npc.palette,npc.archetype,now/250);
      if (!img) continue;
      const sway = quality.foliageSway ? Math.sin(now / 1800 + npc.x) * 0.06 : 0;
      drawables.push({
        depth: depthOf(npc.x, npc.z, 14),
        draw: () => drawSprite(img, npc.x + sway, npc.z, 14, 0.95, selected === npc.id || nearId === npc.id, .92),
      });
    }
    // A generic disk atlas cannot represent the player's selected appearance.
    const diskTamer = !options.appearance && characterAvatar?.source === "sprite-atlas" ? characterAvatar.frames?.[player.dir] : null;
    const tamerPack = diskTamer
      ? player.moving
        ? diskTamer.walk
        : diskTamer.idle
      : tamer[player.dir][player.moving ? "walk" : "idle"];
    drawables.push({
      depth: depthOf(player.x, player.z, 16),
      draw: () => drawSprite(tamerPack[Math.floor(player.frame) % tamerPack.length], player.x, player.z, 16, 1.12, false, 0.92),
    });
    const companionSheet = companionAvatar?.frames[companion.dir];
    if (companionSheet) {
      const pack = companion.moving ? companionSheet.walk : companionSheet.idle;
      drawables.push({
        depth: depthOf(companion.x, companion.z, 16),
        draw: () => drawSprite(pack[Math.floor(companion.frame) % pack.length], companion.x, companion.z, 16, 0.92, false, .9),
      });
    }
    if (area === "verdantis" && wildVisible && wildAvatar) {
      const pack = wildAvatar.frames[wild.dir].walk;
      drawables.push({
        depth: depthOf(wild.x, wild.z, 16),
        draw: () => drawSprite(pack[Math.floor(wild.frame) % pack.length], wild.x, wild.z, 16, 1, selected === "wild.florune", .9),
      });
    }
    drawables.sort((a, b) => a.depth - b.depth);
    if(destination)drawGroundMarker(destination.x,destination.z);
    for (const item of drawables) item.draw();
    for(const mark of map.marks){
      if(!mark.label||mark.kind==="path"||(mark.kind==="wild"&&mark.label==="Florune"))continue;
      const p=worldToScreen(mark.x,mark.z),sx=(p.x-camX)*zoom+canvas.width/2,sy=(p.y-camY)*zoom+canvas.height*.62+18;
      if(sx<65||sx>canvas.width-65||sy<70||sy>canvas.height-90)continue;
      ctx.save();ctx.font="600 11px system-ui";const label=mark.label==="Core"?"Núcleo Genesis":mark.label==="Gate"?"Portão Sul":mark.label;
      const width=ctx.measureText(label).width+22;ctx.fillStyle="rgba(14,32,28,.84)";ctx.beginPath();ctx.roundRect(sx-width/2,sy,width,23,7);ctx.fill();ctx.strokeStyle="rgba(205,191,139,.4)";ctx.stroke();ctx.textAlign="center";ctx.fillStyle=mark.kind==="exit"?"#f0d790":"#ece8d4";ctx.fillText(label,sx,sy+15);ctx.restore();
    }
    drawMotes(now);
    if (flags.hitmap) paintWorldHitmap(ctx, map, camX, camY, zoom, player);

    if (options.minimap) {
      const m = options.minimap.getContext("2d");
      if (m) paintWorldMinimap(m, map, player, options.minimap.width, options.minimap.height);
    }
    emit();
  }

  function onKey(e: KeyboardEvent, down: boolean) {
    const k = e.key.toLowerCase();
    if (k === "w" || k === "arrowup") held.w = down;
    if (k === "s" || k === "arrowdown") held.s = down;
    if (k === "a" || k === "arrowleft") held.a = down;
    if (k === "d" || k === "arrowright") held.d = down;
  }

  const down = (e: KeyboardEvent) => onKey(e, true);
  const up = (e: KeyboardEvent) => onKey(e, false);
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("resize", resize);
  resize();
  setArea(area, options.startAt);
  toastOnce(area === "haven" ? "haven.plaza" : "verdantis.road", map.region + " descoberta");
  frame = requestAnimationFrame(tick);

  void bakeCharacterWorldAvatar(options.appearance, window.devicePixelRatio || 1).then((avatar) => {
    characterAvatar = avatar;
    if (avatar.source === "needs-art") console.warn("[world-avatar] character NEEDS_ART");
  });
  for (const npc of map.npcs) {
    void loadNpcWorldSprite(npc.archetype, window.devicePixelRatio || 1).then((sprite) => {
      npcSprites.set(sprite.archetype, sprite);
    });
  }

  void bakeWorldAvatar(
    options.companion ?? {
      chassis: emberBabyChassis(),
      lifeStage: "BABY",
      element: "FIRE",
      context: "WORLD",
      creatureId: "world-companion",
    },
  )
    .then((avatar) => {
      companionAvatar = avatar;
      if (avatar.source !== "sprite-atlas") {
        console.warn("[world-avatar] companion WORLD_AVATAR_PENDING", options.companion?.creatureId);
      }
    })
    .catch((err) => {
      console.warn("[world-avatar] companion bake failed", err);
    });
  void bakeWorldAvatar({
    chassis: floruneWildChassis(),
    lifeStage: "YOUNG",
    element: "NATURE",
    context: "WORLD",
    creatureId: "world-florune",
  })
    .then((avatar) => {
      wildAvatar = avatar;
      if (avatar.source !== "sprite-atlas") {
        console.warn("[world-avatar] wild WORLD_AVATAR_PENDING", "world-florune");
      }
    })
    .catch((err) => {
      console.warn("[world-avatar] wild bake failed", err);
    });

  return {
    tap,
    travel,
    enterAt,
    places,
    pointFromMinimap,
    snapshot,
    hideWild,
    closest,
    capture() {
      return canvas.toDataURL("image/png");
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("resize", resize);
    },
  };
}

export type AdventureWorld = ReturnType<typeof createAdventureWorld>;
