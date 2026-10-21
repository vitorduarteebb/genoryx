import {test} from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {CreatureMouth,mouthProfiles,mouthOpening,lowerJawPoint} from "../src/lib/creature-mouth";
import {splitJawSurface,jawHinge,jawAngle} from "../src/lib/creature-jaw";
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
test("lower teeth and lip rotate around one fixed hinge without stretching",()=>{
 for(const head of Object.keys(mouthProfiles)){
  const mouth=new CreatureMouth(head,"EYES_03_AMBER",new T.Color("red"));
  const pivot=mouth.group.getObjectByName("MandiblePivot")!;
  assert(pivot.position.distanceTo(jawHinge(head,"EYES_03_AMBER"))<1e-8);
  const tooth=mouth.teeth.find(t=>t.lower)!.mesh;
  const rest=tooth.position.clone();assert.equal(tooth.parent,pivot);
  assert.equal(mouth.group.getObjectByName("LowerLip")!.parent,pivot);
  mouth.update(1);
  assert(tooth.position.distanceTo(rest)<1e-8);assert(Math.abs(pivot.rotation.x-jawAngle(1))<1e-8);
  assert(mouth.teeth.every(t=>t.mesh.scale.distanceTo(new T.Vector3(1,1,1))<1e-7));
  assert.equal(mouthOpening("IDLE",1),0);
  let triangles=0;mouth.group.traverse(o=>{if((o as T.Mesh).isMesh){const g=(o as T.Mesh).geometry;triangles+=(g.index?.count??g.getAttribute("position").count)/3;}});
  assert(triangles<8000);mouth.dispose();
 }
});
test("jaw cut separates crossing triangles while retaining color and UV channels",()=>{
 const g=new T.BoxGeometry(.5,.4,.7,3,3,3).translate(0,-.15,.2);
 const colors=new Float32Array(g.getAttribute("position").count*3);for(let i=0;i<colors.length;i+=3)colors.set([.2,.3,.5],i);g.setAttribute("color",new T.Float32BufferAttribute(colors,3));
 const split=splitJawSurface(g,new T.Matrix4());assert(split.seam.length>3);
 for(const [part,sign] of [[split.upper,1],[split.lower,-1]] as const){
  assert(part.getAttribute("uv"));const p=part.getAttribute("position"),c=part.getAttribute("color");
  for(let i=0;i<p.count;i++){assert(sign*(p.getY(i)+.194)>-1e-6);assert(Math.abs(c.getX(i)+c.getY(i)+c.getZ(i)-1)<1e-6);}part.dispose();
 }g.dispose();
});
