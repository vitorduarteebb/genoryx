import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { mapFor } from "../src/lib/iso/maps";
import { createTamerModel } from "../src/lib/world-art/tamer-model";

test("larger regions preserve exits and provide reachable new places",()=>{
 for(const id of ["haven","verdantis"] as const){
  const map=mapFor(id,true);
  const area=(b:typeof map.walk)=>(b.maxX-b.minX)*(b.maxZ-b.minZ);
  const originalArea=id==="haven"?11.2*13.4:9*14;
  assert.ok(area(map.walk)>originalArea*2.5);assert.ok(map.npcs.length>(id==="haven"?5:0));
  assert.ok(map.interactables.some(i=>i.kind==="exit"&&i.payload===(id==="haven"?"verdantis":"haven")));
  const step=.35,queue=[map.spawn],seen=new Set<string>(),cells:Array<{x:number;z:number}>=[];
  const key=(x:number,z:number)=>`${Math.round((x-map.spawn.x)/step)},${Math.round((z-map.spawn.z)/step)}`;seen.add(key(map.spawn.x,map.spawn.z));
  for(let j=0;j<queue.length;j++){const p=queue[j];cells.push(p);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx*step,z=p.z+dz*step,k=key(x,z);if(seen.has(k)||x<map.walk.minX||x>map.walk.maxX||z<map.walk.minZ||z>map.walk.maxZ||map.blocks.some(b=>Math.hypot(b.x-x,b.z-z)<b.r))continue;seen.add(k);queue.push({x,z});}}
  for(const point of map.interactables.filter(i=>["haven.market","haven.garden","haven.residential","verdantis.camp","verdantis.ruins","verdantis.canopy","npc.mira","npc.oren","npc.aya","npc.sol","npc.ivo"].includes(i.id)))assert.ok(cells.some(p=>Math.hypot(p.x-point.x,p.z-point.z)<point.radius),`unreachable ${point.id}`);
 }
});
test("appearance and NPC roles produce distinct bounded models without mutating saved input",()=>{
 const input={hairId:"hair_05_long",skinTone:"ebony",capeId:"cape_genesis_mantle",chestId:"chest_genesis_researcher"},before=JSON.stringify(input);
 const signatures=new Set<string>();
 for(const role of [undefined,"GUARD","MERCHANT","RESEARCHER","BREEDER"]){const model=createTamerModel(undefined,input,role);model.pose(0,false);model.root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model.root);assert.ok(box.min.y>-.05&&box.max.y<1.85);let vertices=0;model.root.traverse(o=>{if((o as T.Mesh).isMesh)vertices+=(o as T.Mesh).geometry.getAttribute("position").count;});signatures.add(String(vertices));model.dispose();}
 assert.ok(signatures.size>=4);assert.equal(JSON.stringify(input),before);
});
