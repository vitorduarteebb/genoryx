import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {existsSync} from "node:fs";
import * as T from "three";
import {ART04_CANONICAL_FORWARD,battleActorYaw,frameBattleCamera} from "@nexora/game-engine";
import {EggVisualController,eggStyle} from "../src/lib/egg-visual-controller";
import {headProfiles,eyeProfiles,headPoint} from "../src/lib/creature-anatomy";
import {sampleCreatureLife} from "../src/lib/creature-life";
import {eggIncubation,publicEggAppearance} from "../src/lib/genesis-presentation";
import {genomeMask} from "../src/lib/creature-visual-controller";
test("genome mask selection handles both export orders without using the preview palette",()=>{
 const mask=new T.Float32BufferAttribute([.7,.3,0,.1,.8,.1],3),preview=new T.Float32BufferAttribute([.55,.7,.8,.4,.5,.7],3);
 for(const order of [false,true]){const g=new T.BufferGeometry();g.setAttribute("color",order?preview:mask);g.setAttribute("color_1",order?mask:preview);assert.equal(genomeMask(g),mask);g.dispose();}
 const g=new T.BufferGeometry();g.setAttribute("color",preview);assert.equal(genomeMask(g),undefined);g.dispose();
});
test("all head/eye profiles are finite, symmetric, preserve neck and produce distinct silhouettes",()=>{
 const signatures=new Set<string>();
 for(const h of Object.keys(headProfiles))for(const e of Object.keys(eyeProfiles)) {
  const a=headPoint(.19,-.04,.36,h,e),b=headPoint(-.19,-.04,.36,h,e);assert.equal(a[0],-b[0]);assert.equal(a[1],b[1]);assert.equal(a[2],b[2]);
  assert.deepEqual(headPoint(.2,.1,-.1,h,e),[.2,.1,-.1]);assert(a.every(Number.isFinite));signatures.add(a.join());
 }
 assert.equal(signatures.size,Object.keys(headProfiles).length*Object.keys(eyeProfiles).length);
});
test("breathing and blink remain bounded over three life stages and 90 seconds",()=>{
 for(const stage of ["BABY","YOUNG","ADULT"]){let blinks=0,previous=0;const times:number[]=[];
  for(let i=0;i<9000;i++){const life=sampleCreatureLife(i/100,"stable-dna",stage,"CALM",false);assert(life.breath>=0&&life.breath<=1);assert(life.blink>=0&&life.blink<=1);assert(Math.abs(life.yaw)<.04);if(life.blink>.5&&previous<=.5){blinks++;times.push(i/100);}previous=life.blink;}
  assert(blinks>=3&&blinks<35);assert(new Set(times.slice(1).map((t,i)=>Math.round((t-times[i])*10))).size>2);
  assert.equal(sampleCreatureLife(9,"stable-dna",stage,"CALM",true).blink,0);
 }
});
test("client clock never authorizes hatch; grade and public lineage only style the shell",()=>{
 const egg={status:"INCUBATING",incubationStartedAt:"2026-09-10T00:00:00Z",hatchAt:"2026-09-10T01:00:00Z"};
 assert.equal(eggIncubation(egg,Date.parse("2026-09-11T00:00:00Z")).ready,false);
 assert.equal(eggIncubation({...egg,status:"READY"},Date.parse("2026-09-11T00:00:00Z")).ready,true);
 assert.equal(eggIncubation({...egg,hatchAt:"invalid"},Date.now()).ready,false);
 assert.deepEqual(publicEggAppearance({eggId:"a",genesisGrade:"RARE"}),publicEggAppearance({eggId:"a",genesisGrade:"RARE"}));
 assert.equal(eggStyle({genesisGrade:"unknown"}),"MOTTLED");
});
test("five egg shells have finite motion, independent materials, restart without drift and three valid export clips",()=>{
 const styles=new Set<string>();
 for(const grade of ["COMMON","REFINED","RARE","EXCEPTIONAL","GENESIS"]) {
  const input={hints:{eggId:"egg-a",genesisGrade:grade},motion:"still" as const,progress:0},before=JSON.stringify(input);
  const egg=new EggVisualController(input),other=new EggVisualController(input);styles.add(egg.style);assert.equal(egg.shards.length,24);assert.notEqual(egg.shards[0].mesh.material,other.shards[0].mesh.material);
  for(const motion of ["incubating","ready","pulse","crack","burst","still"] as const){egg.configure({...input,motion});for(let f=0;f<180;f++){egg.update(1/60);egg.actor.traverse(o=>assert([...o.position,...o.quaternion,...o.scale].every(Number.isFinite)));}}
  for(const shard of egg.shards)assert(shard.mesh.position.distanceTo(shard.center)<1e-8);
  const clips=egg.exportClips();assert.deepEqual(clips.map(c=>c.name),["Egg_Incubate","Egg_Crack","Egg_Hatch"]);assert(clips.every(c=>c.validate()));
  assert.equal(JSON.stringify(input),before);egg.dispose();other.dispose();
 }
 assert.equal(styles.size,5);
});
test("battle pose projects foe to the right, player to the left, and ground near the canvas floor",()=>{
  const yawAxis=new T.Vector3(0,1,0);
  function project(side:"FOE"|"YOU"){
    const yaw=battleActorYaw(ART04_CANONICAL_FORWARD,side);
    const head=new T.Vector3(0,.48,.62).applyAxisAngle(yawAxis,yaw);
    const framed=frameBattleCamera({height:1.12,span:1.5});
    const camera=new T.PerspectiveCamera(framed.fovDeg,1,.025,40);
    camera.position.set(framed.position.x,framed.position.y,framed.position.z);
    camera.lookAt(framed.target.x,framed.target.y,framed.target.z);
    camera.updateMatrixWorld();
    return {head:head.clone().project(camera),ground:new T.Vector3(0,0,0).project(camera),worldHead:head};
  }
  const foe=project("FOE"),you=project("YOU");
  assert(foe.worldHead.x>0.5,"inimigo deve apontar +X");
  assert(you.worldHead.x<-0.5,"jogador deve apontar -X");
  assert(foe.worldHead.z>0&&you.worldHead.z>0,"nenhum time mostra a traseira para a câmera em +Z");
  assert(foe.head.x>0.08,"focinho inimigo na metade direita do canvas");
  assert(you.head.x<-0.08,"focinho do jogador na metade esquerda do canvas");
  assert(foe.ground.y<-.7&&foe.ground.y>-.96,"pés perto da base do quadro, não no centro");
});
test("o facing antigo Math.PI do inimigo virava a traseira para a câmera ¾",()=>{
  const head=new T.Vector3(0,.48,.62).applyAxisAngle(new T.Vector3(0,1,0),Math.PI+0.18);
  assert(head.z<0);
});
test("exported GLBs contain shell nodes, valid bounds and all three animations",async()=>{
 for(const grade of ["COMMON","REFINED","RARE","EXCEPTIONAL","GENESIS"]){
  const prefix=existsSync("public/genoryx-art04")?"public":"apps/web/public";
  const b=await readFile(`${prefix}/genoryx-art04/eggs/GXR_EGG_${grade}.glb`);assert.equal(b.toString("ascii",0,4),"glTF");assert.equal(b.readUInt32LE(8),b.length);
  const doc=JSON.parse(b.toString("utf8",20,20+b.readUInt32LE(12)));assert.equal(doc.nodes.filter((n:{name?:string})=>n.name?.startsWith("Shell_")).length,24);assert.equal(doc.animations.length,3);
  for(const a of doc.accessors){if(a.min)assert(a.min.every(Number.isFinite));if(a.max)assert(a.max.every(Number.isFinite));}
 }
});
