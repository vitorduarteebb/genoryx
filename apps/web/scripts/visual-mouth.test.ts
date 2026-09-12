import {test} from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {CreatureMouth,mouthProfiles,mouthOpening,lowerJawPoint} from "../src/lib/creature-mouth";
test("four mouth types have different dentition, immutable rest poses and exportable jaw animation",()=>{
 const types=new Set<string>();for(const [head,p] of Object.entries(mouthProfiles)) {
  const mouth=new CreatureMouth(head,"EYES_03_AMBER",new T.Color("red"));types.add(p.type);assert.equal(mouth.teeth.length,p.count*2);
  mouth.update(0);const rest=mouth.teeth.map(t=>t.mesh.position.clone());
  for(let i=0;i<500;i++)mouth.update(mouthOpening("ATTACK",(i%100)/100));mouth.update(0);
  mouth.teeth.forEach((t,i)=>assert(t.mesh.position.distanceTo(rest[i])<1e-8));
  mouth.group.traverse(o=>{assert([...o.position,...o.scale,...o.quaternion].every(Number.isFinite));if((o as T.Mesh).isMesh){const a=(o as T.Mesh).geometry.getAttribute("position");assert([...a.array].every(Number.isFinite));}});
  assert(mouth.exportClip().validate());mouth.dispose();
 }assert.equal(types.size,4);
});
test("jaw preserves upper skull and neck; attacks return closed, reduced motion stays calm",()=>{
 assert.deepEqual(lowerJawPoint(.1,.1,.4,1),[.1,.1,.4]);assert.deepEqual(lowerJawPoint(.1,-.2,0,1),[.1,-.2,0]);
 assert(lowerJawPoint(0,-.22,.45,1)[1]<-.22);assert(mouthOpening("ATTACK",.4)>.5);assert.equal(mouthOpening("ATTACK",3),0);assert(mouthOpening("CAST",.7,true)<.1);
});
test("refined mouths keep cheek corners attached and tooth dimensions stable during opening",()=>{
 for(const head of Object.keys(mouthProfiles)){
  const mouth=new CreatureMouth(head,"EYES_03_AMBER",new T.Color("red"));
  const cavity=mouth.group.getObjectByName("OralCavity") as T.Mesh;
  const p=cavity.geometry.getAttribute("position"),corners=[0,40,164,204];
  const rest=corners.map(i=>new T.Vector3().fromBufferAttribute(p,i));
  mouth.update(1);
  corners.forEach((i,j)=>assert(new T.Vector3().fromBufferAttribute(p,i).distanceTo(rest[j])<1e-7));
  assert(mouth.teeth.every(t=>t.mesh.scale.equals(new T.Vector3(1,1,1))));
  assert.equal(mouthOpening("IDLE",1),0);
  let triangles=0;mouth.group.traverse(o=>{if((o as T.Mesh).isMesh){const g=(o as T.Mesh).geometry;triangles+=(g.index?.count??g.getAttribute("position").count)/3;}});
  assert(triangles<8000);mouth.dispose();
 }
});
