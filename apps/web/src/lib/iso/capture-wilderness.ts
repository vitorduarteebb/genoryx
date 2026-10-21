import {captureZones} from "@nexora/config";
import type {IsoMap} from "./maps";
export function addCaptureWilderness(map:IsoMap){
 if(map.id!=="verdantis"||map.interactables.some(p=>p.id==="capture.meadow"))return map;
 map.bounds={minX:-19,maxX:19,minZ:-2,maxZ:71};map.walk={minX:-17,maxX:17,minZ:-.6,maxZ:69};
 const road=(a:{x:number;z:number},b:{x:number;z:number})=>{const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.3);for(let i=0;i<=n;i++)map.tiles.push({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n,tile:"earth"});};
 road({x:0,z:26},{x:0,z:66});
 for(const zone of captureZones){
  road({x:0,z:zone.z},{x:zone.x,z:zone.z});
  const approach={x:zone.x,z:zone.z-1};
  map.interactables.push({id:`capture.${zone.id}`,name:zone.name,...approach,radius:1.6,kind:"captureZone",zoneId:zone.id,danger:zone.label,prompt:"Procurar criatura",body:`${zone.description} Níveis ${zone.minLevel}–${zone.maxLevel}. Equipe recomendada: nível ${zone.recommendedLevel}.`});
  map.marks.push({x:zone.x,z:zone.z,kind:"wild",label:zone.name});map.discoveries.push({id:`capture.${zone.id}`,toast:`${zone.name} · ${zone.label}`,x:zone.x,z:zone.z,r:zone.radius});
  map.props.push({x:zone.x+1.4,z:zone.z+1.4,prop:zone.difficulty==="EXTREME"?"hollow":zone.id==="ember"?"ruin":"sign",layer:8});
  for(let i=0;i<18;i++){
   const a=i*2.399,r=zone.radius*(.62+(i%3)*.12),x=zone.x+Math.cos(a)*r,z=zone.z+Math.sin(a)*r;
   if(Math.abs(z-zone.z)<1.1||Math.abs(x)<1)continue;
   const prop=zone.id==="ember"?(i%3?"rocks":"crystal"):zone.difficulty==="EXTREME"?(i%3?"crystal":"ruin"):(i%3?"treeVerdA":"bushB");
   map.props.push({x,z,prop,layer:prop.startsWith("tree")?12:5,scale:.8+(i%3)*.15});map.blocks.push({x,z,r:.28});
  }
 }
 for(let z=30;z<69;z+=3){map.props.push({x:1.5,z,prop:"lamp",layer:4});map.props.push({x:-2.2,z:z+1,prop:"grassClump",layer:2});}
 return map;
}
