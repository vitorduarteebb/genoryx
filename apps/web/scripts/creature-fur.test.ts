import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildCreatureFur,furProfiles} from '../src/lib/creature-fur';
import {rollChassisDna,breedChassisDna} from '@nexora/game-engine';
import {chassisCombinationCount} from '@nexora/config';
test('fur follows skin weights, is deterministic and bounded across three coats',()=>{
 const counts=[];
 for(const pattern of Object.keys(furProfiles)){
 const root=new T.Group(),geo=new T.SphereGeometry(.25,16,12),n=geo.attributes.position.count;
 geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Uint16Array(n*4),4));const weights=new Float32Array(n*4);for(let i=0;i<n;i++)weights[i*4]=1;geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 const mat=new T.MeshStandardMaterial();mat.name='BODY_PRIMARY';const donor=new T.SkinnedMesh(geo,mat),bone=new T.Bone();root.add(bone,donor);donor.bind(new T.Skeleton([bone]));
 const coat=buildCreatureFur(root,pattern)[0].mesh as T.SkinnedMesh;assert.equal(coat.skeleton,donor.skeleton);assert(coat.geometry.attributes.position.count<=6500*9);counts.push(coat.geometry.attributes.position.count);
 for(const x of coat.geometry.attributes.position.array)assert(Number.isFinite(x));assert(coat.geometry.attributes.skinWeight.array.every((v,i)=>v===(i%4===0?1:0)));
 const before=new T.Vector3().fromBufferAttribute(coat.geometry.attributes.position,0);bone.position.x=.2;root.updateMatrixWorld(true);donor.skeleton.update();const after=coat.applyBoneTransform(0,before.clone());assert(Math.abs(after.x-before.x-.2)<1e-5);
 coat.removeFromParent();const second=buildCreatureFur(root,pattern)[0].mesh;assert.deepEqual(second.geometry.attributes.position.array,coat.geometry.attributes.position.array);
 }
 assert(new Set(counts).size>1);
});
test('new coat alleles generate and pass through breeding without rewriting parents',()=>{
 const found=new Set<string>();for(let seed=0;seed<500;seed++)found.add(rollChassisDna({seed}).pattern.d);
 for(const gene of Object.keys(furProfiles)){assert(found.has(gene));const a=rollChassisDna({seed:20});a.pattern={d:gene,r1:gene,r2:gene};const before=JSON.stringify(a);const child=breedChassisDna({seed:70,parentA:a,parentB:a});assert.equal(child.pattern.d,gene);assert.equal(JSON.stringify(a),before);}
 assert(chassisCombinationCount()>1e9);
});
