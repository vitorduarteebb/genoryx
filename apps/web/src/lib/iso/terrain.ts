import {captureZones} from "@nexora/config";
import type { IsoMap } from "./maps";
import { worldToScreen } from "./projection";
/** Bake a continuous floor once per area, independently of actor depth. */
export function bakeTerrain(map:IsoMap){
 const b=map.bounds,corners=[[b.minX,b.minZ],[b.maxX,b.minZ],[b.maxX,b.maxZ],[b.minX,b.maxZ]].map(([x,z])=>worldToScreen(x,z));
 const left=Math.min(...corners.map(p=>p.x))-80,top=Math.min(...corners.map(p=>p.y))-60;
 const worldWidth=Math.ceil(Math.max(...corners.map(p=>p.x))-left+80),worldHeight=Math.ceil(Math.max(...corners.map(p=>p.y))-top+60),resolution=Math.min(1,3072/worldWidth,3072/worldHeight);
 const image=document.createElement("canvas");image.width=Math.ceil(worldWidth*resolution);image.height=Math.ceil(worldHeight*resolution);
 const ctx=image.getContext("2d")!;ctx.scale(resolution,resolution);ctx.translate(-left,-top);ctx.transform(48,24,-48,24,0,0);
 const forest=map.id==="verdantis";
 const gradient=ctx.createLinearGradient(b.minX,b.minZ,b.maxX,b.maxZ);gradient.addColorStop(0,forest?"#183e35":"#426d43");gradient.addColorStop(.5,forest?"#345839":"#68844a");gradient.addColorStop(1,forest?"#122f2c":"#2b513b");ctx.fillStyle=gradient;ctx.fillRect(b.minX,b.minZ,b.maxX-b.minX,b.maxZ-b.minZ);
 if(forest)for(const zone of captureZones){const g=ctx.createRadialGradient(zone.x,zone.z,1,zone.x,zone.z,zone.radius+1);g.addColorStop(0,zone.color);g.addColorStop(.7,zone.color+"bb");g.addColorStop(1,zone.color+"00");ctx.fillStyle=g;ctx.fillRect(zone.x-zone.radius-1,zone.z-zone.radius-1,(zone.radius+1)*2,(zone.radius+1)*2);}
 let seed=413;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<8500;i++){const x=b.minX+rand()*(b.maxX-b.minX),z=b.minZ+rand()*(b.maxZ-b.minZ);ctx.strokeStyle=i%3?"#b0b96520":"#102b2725";ctx.lineWidth=.018;ctx.beginPath();ctx.moveTo(x,z);ctx.lineTo(x+.035+rand()*.07,z-.015);ctx.stroke();}
 const groups=[{types:["stone","plaza"],color:"#a79c7d",r:.61},{types:["path","earth"],color:forest?"#8a7552":"#b1a17a",r:.58},{types:["water"],color:"#377c83",r:.65}];
 for(const group of groups){const tiles=map.tiles.filter(t=>group.types.includes(t.tile));ctx.beginPath();for(const t of tiles){ctx.moveTo(t.x+group.r,t.z);ctx.arc(t.x,t.z,group.r,0,Math.PI*2);}ctx.fillStyle=group.color;ctx.fill();
  ctx.save();ctx.clip();
  if(group.types.includes("stone")){
   ctx.strokeStyle="#655f514a";ctx.lineWidth=.017;
   for(let z=b.minZ;z<b.maxZ;z+=.35)for(let x=b.minX;x<b.maxX;x+=.6){ctx.strokeRect(x+((Math.round(z/.35)%2)*.3),z,.58,.33);}
  }
  for(let i=0;i<1800;i++){const x=b.minX+rand()*(b.maxX-b.minX),z=b.minZ+rand()*(b.maxZ-b.minZ);ctx.fillStyle=i%2?"#fff4c21c":"#423d3022";ctx.fillRect(x,z,.02+rand()*.09,.018);}
  ctx.restore();
 }
 if(!forest){for(const radius of [1.70,2.1]){ctx.strokeStyle="#e1cf99";ctx.lineWidth=.035;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();}}
 return {image,left,top,worldWidth,worldHeight};
}
