import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { groundPixelOffset } from "../src/lib/world-art/sprite-contact";
import { createTamerModel } from "../src/lib/world-art/tamer-model";

test("projected ground and sprite pivot coincide at every atlas resolution",()=>{
 const camera=new T.OrthographicCamera(-1.1,1.1,1.1,-1.1,.05,24);camera.position.set(1.5,1,1.5);camera.lookAt(0,.3,0);
 for(const size of [80,112,160]){const a={x:.5,y:.9},o=groundPixelOffset(camera,size,size,a),p=new T.Vector3().project(camera);assert.ok(Math.abs((p.x+1)*size/2+o.x-size*a.x)<1e-8);assert.ok(Math.abs((1-p.y)*size/2+o.y-size*a.y)<1e-8);}
});
test("explorer's supporting boot stays on the floor through the full directional gait",()=>{
 const model=createTamerModel();
 for(let dir=0;dir<8;dir++)for(let frame=0;frame<32;frame++){
  model.root.rotation.y=dir*Math.PI/4;model.pose(frame/32*Math.PI*2,true);model.root.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(model.root);assert.ok(Math.abs(box.min.y)<1e-6,`ground ${box.min.y}`);assert.ok(box.max.y<1.8);model.root.traverse(o=>assert.ok([...o.position,...o.quaternion,...o.scale].every(Number.isFinite)));
 }
 model.pose(0,false);const before=new T.Box3().setFromObject(model.root);model.pose(0,false);assert.deepEqual(new T.Box3().setFromObject(model.root),before);model.dispose();
});
