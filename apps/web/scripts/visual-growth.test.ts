import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { CreatureWings } from "../src/lib/creature-wings";
import { visualGrowth,visualIdentity } from "../src/lib/creature-visual-contract";
import { visualFixture } from "../src/lib/creature-visual-fixtures";

test("maturation changes proportions and cache identity without rerolling inherited DNA",()=>{
 const dna=visualFixture(0),before=JSON.stringify(dna);
 const stages=["BABY","YOUNG","ADULT"].map(lifeStage=>({growth:visualGrowth(lifeStage),identity:visualIdentity({chassis:dna,lifeStage})}));
 assert.equal(new Set(stages.map(s=>s.identity)).size,3);
 assert.ok(stages[0].growth.head>stages[1].growth.head&&stages[1].growth.head>stages[2].growth.head);
 assert.ok(stages[0].growth.scale<stages[1].growth.scale&&stages[1].growth.scale<stages[2].growth.scale);
 assert.deepEqual(visualGrowth("Juvenile"),visualGrowth("YOUNG"));assert.equal(JSON.stringify(dna),before);
});
test("paired wings develop with age and retain finite surfaces, genetic masks and reversible motion",()=>{
 const sizes:number[]=[];
 for(const maturity of [0,.5,1]){
  const root=new T.Group(),wings=new CreatureWings(root,maturity);
  assert.equal(root.children.length,2);assert.equal(wings.meshes.filter(m=>m.name==="Wing_Membrane").length,8);
  sizes.push(new T.Box3().setFromObject(root).getSize(new T.Vector3()).x);
  for(const m of wings.meshes){const p=m.geometry.getAttribute("position");for(let i=0;i<p.count;i++)assert.ok([p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite));
   const c=m.geometry.getAttribute("color");if(c)for(let i=0;i<c.count;i++)assert.ok(Math.abs(c.getX(i)+c.getY(i)+c.getZ(i)-1)<1e-6);
  }
  wings.update(0,"IDLE",false);const rest=root.children.map(o=>o.quaternion.toArray());
  for(let t=0;t<90;t+=.17)for(const state of ["IDLE","CAST","ATTACK","DEATH"])wings.update(t,state,false);
  wings.update(0,"IDLE",false);assert.deepEqual(root.children.map(o=>o.quaternion.toArray()),rest);
  wings.update(0,"CAST",true);const calm=root.children.map(o=>o.quaternion.toArray());wings.update(90,"CAST",true);assert.deepEqual(root.children.map(o=>o.quaternion.toArray()),calm);
  wings.meshes.forEach(m=>m.geometry.dispose());wings.materials.forEach(m=>m.dispose());
 }
 assert.ok(sizes[0]<sizes[1]&&sizes[1]<sizes[2]);
});
