import { havenPalette, verdantisPalette } from "@nexora/config";
import { captureZones } from "@nexora/config";

type Mark = { x: number; z: number; kind: "player" | "path" | "landmark" | "exit" | "poi" | "wild"; label?: string };
type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

export function paintWorldMinimap(
  ctx: CanvasRenderingContext2D,
  map: { id: string; bounds: Bounds; walk: Bounds; marks: Mark[];tiles?:Array<{x:number;z:number;tile:string}> },
  player: { x: number; z: number },
  w: number,
  h: number,
) {
  ctx.clearRect(0, 0, w, h);
  const haven = map.id === "haven";
  const pad = 18;
  const nx = (x: number) => pad + ((x - map.bounds.minX) / (map.bounds.maxX - map.bounds.minX)) * (w - pad * 2);
  const nz = (z: number) => pad + ((z - map.bounds.minZ) / (map.bounds.maxZ - map.bounds.minZ)) * (h - pad * 2);

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, haven ? "#2C3828" : "#15241A");
  bg.addColorStop(1, haven ? "#1C2418" : "#0E1812");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = haven ? "#6A8A62" : "#2A4A32";
  ctx.beginPath();
  ctx.rect(nx(map.walk.minX), nz(map.walk.minZ), nx(map.walk.maxX) - nx(map.walk.minX), nz(map.walk.maxZ) - nz(map.walk.minZ));
  ctx.fill();

  if(!haven)for(const zone of captureZones){ctx.fillStyle=zone.color+"88";ctx.beginPath();ctx.ellipse(nx(zone.x),nz(zone.z),zone.radius*(w-pad*2)/(map.bounds.maxX-map.bounds.minX),zone.radius*(h-pad*2)/(map.bounds.maxZ-map.bounds.minZ),0,0,Math.PI*2);ctx.fill();}

  ctx.save();
  ctx.globalAlpha=.6;
  ctx.strokeStyle="#bed39e";ctx.lineWidth=.5;
  for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(pad+(w-pad*2)*i/5,pad);ctx.lineTo(pad+(w-pad*2)*i/5,h-pad);ctx.stroke();ctx.beginPath();ctx.moveTo(pad,pad+(h-pad*2)*i/5);ctx.lineTo(w-pad,pad+(h-pad*2)*i/5);ctx.stroke();}
  ctx.restore();
  if(map.tiles){for(const tile of map.tiles){if(!["path","earth","stone","plaza","water"].includes(tile.tile))continue;ctx.fillStyle=tile.tile==="water"?"#61aeb5":["stone","plaza"].includes(tile.tile)?"#c6b991":"#ad9d72";ctx.beginPath();ctx.ellipse(nx(tile.x),nz(tile.z),w/(map.bounds.maxX-map.bounds.minX)*.58,h/(map.bounds.maxZ-map.bounds.minZ)*.58,0,0,Math.PI*2);ctx.fill();}}

  ctx.strokeStyle = haven ? havenPalette.path : verdantisPalette.earth;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(nx(0), nz(map.walk.minZ));
  ctx.lineTo(nx(0.15), nz((map.walk.minZ + map.walk.maxZ) / 2));
  ctx.lineTo(nx(0), nz(map.walk.maxZ));
  if(!map.tiles)ctx.stroke();

  for (const mark of map.marks) {
    const x = nx(mark.x);
    const y = nz(mark.z);
    ctx.fillStyle =
      mark.kind === "exit"
        ? havenPalette.goldAccent
        : mark.kind === "landmark"
          ? havenPalette.genesisCyan
          : mark.kind === "wild"
            ? "#D4543A"
            : mark.kind === "poi"
              ? "#D8C8A0"
              : "#9AA69C";
    ctx.beginPath();
    ctx.arc(x, y, mark.kind === "landmark" ? 4.5 : 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle="#142621";ctx.lineWidth=1.5;ctx.stroke();
  }

  ctx.fillStyle = havenPalette.genesisCyan;
  ctx.beginPath();
  ctx.moveTo(nx(player.x), nz(player.z) - 6);
  ctx.lineTo(nx(player.x) + 5, nz(player.z) + 5);
  ctx.lineTo(nx(player.x) - 5, nz(player.z) + 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.45)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle="#f4ead0";ctx.font=`600 ${Math.max(9,w*.042)}px system-ui`;ctx.textAlign="center";ctx.fillText("N",w/2,12);
  ctx.font=`${Math.max(8,w*.035)}px system-ui`;ctx.fillStyle="#d1dcc2";ctx.fillText(haven?"HAVEN · PRAÇA GENESIS":"VERDANTIS · TRILHA VERDE",w/2,h-5);
}
