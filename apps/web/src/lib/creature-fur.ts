import * as T from "three";
export const furProfiles:Record<string,{label:string;length:number;density:number}>={
 PATTERN_FUR_SHORT:{label:"Pelagem curta aveludada",length:.028,density:2800},
 PATTERN_FUR_SHAGGY:{label:"Pelagem longa de tundra",length:.075,density:3200},
 PATTERN_FUR_MANE:{label:"Juba ancestral",length:.11,density:3000},
};
/** Deterministic surface tufts, with the donor's skin weights and morph deltas.
 * No genome generation here. Each tuft follows the same animation as its root. */
export function buildCreatureFur(root:T.Object3D,pattern:string){
 const profile=furProfiles[pattern];const result:{mesh:T.Mesh;source:T.Mesh}[]=[];
 if(!profile)return result;
 root.updateMatrixWorld(true);
 const headSocket=root.getObjectByName("Socket_Head");
 const sources:T.Mesh[]=[];root.traverse(o=>{const m=o as T.Mesh;if(!m.isMesh||!m.visible)return;const mats=Array.isArray(m.material)?m.material:[m.material];if(mats.length===1&&/BODY|TAIL/.test(mats[0].name)&&!/EYE|MOUTH|CORE/.test(mats[0].name))sources.push(m);});
 let remaining=6500;
 for(const source of sources){
  let visible=true;for(let p:T.Object3D|null=source;p;p=p.parent)if(!p.visible)visible=false;if(!visible)continue;
  const g=source.geometry,p=g.getAttribute('position'),normal=g.getAttribute('normal');if(!normal)continue;
  const ix=g.index,mask=g.getAttribute('color'),joints=g.getAttribute('skinIndex'),weights=g.getAttribute('skinWeight');
  const pos:number[]=[],colors:number[]=[],ji:number[]=[],sw:number[]=[],roots:number[]=[];
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),n=new T.Vector3(),v=new T.Vector3(),side=new T.Vector3(),flow=new T.Vector3();
  let seed=2166136261;for(const ch of source.name)seed=Math.imul(seed^ch.charCodeAt(0),16777619);const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const face=/HeadSurface|Mandible/.test(source.name)||/HeadSurface/.test(source.parent?.name??"");
  const faceMatrix=headSocket?headSocket.matrixWorld.clone().invert().multiply(source.matrixWorld):new T.Matrix4();
  const count=ix?.count??p.count;
  for(let k=0;k<count&&remaining>0;k+=3){
   const ids=[0,1,2].map(d=>ix?ix.getX(k+d):k+d);a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);
   const area=b.clone().sub(a).cross(c.clone().sub(a)).length()*.5;
   const expected=area*profile.density,num=Math.min(12,Math.floor(expected)+(random()<expected%1?1:0));
   for(let t=0;t<num&&remaining>0;t++){
    const u=Math.sqrt(random()),w=random(),bary=[1-u,u*(1-w),u*w];v.set(0,0,0);n.set(0,0,0);for(let d=0;d<3;d++){v.addScaledVector(new T.Vector3().fromBufferAttribute(p,ids[d]),bary[d]);n.addScaledVector(new T.Vector3().fromBufferAttribute(normal,ids[d]),bary[d]);}n.normalize();
    // Keep lips, nose and eye sockets exposed; coat cheeks and crown only.
    const facePoint=v.clone().applyMatrix4(faceMatrix);
    if(face&&(facePoint.z>.18||facePoint.y<-.13))continue;
    if(/Foot|Front|Rear/.test(source.name)&&n.y<-.35)continue;
    const mane=pattern==='PATTERN_FUR_MANE';const length=profile.length*(.7+random()*.5)*(face?1.1:mane&&v.z<0?.32:1);
    side.crossVectors(n,Math.abs(n.y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0)).normalize();
    flow.set(0,-.55,-.55).addScaledVector(n,-new T.Vector3(0,-.55,-.55).dot(n)).normalize();
    const width=length*(pattern==='PATTERN_FUR_SHORT'?.42:.26),rootId=ids[bary.indexOf(Math.max(...bary))];
    const points=[v.clone().addScaledVector(side,-width),v.clone().addScaledVector(side,width),v.clone().addScaledVector(n,length*.55).addScaledVector(flow,length*.14).addScaledVector(side,width*.55),v.clone().addScaledVector(n,length*.55).addScaledVector(flow,length*.14).addScaledVector(side,-width*.55),v.clone().addScaledVector(n,length*.8).addScaledVector(flow,length*.6)];
    for(const id of [0,1,2,0,2,3,3,2,4]){const point=points[id];pos.push(point.x,point.y,point.z);roots.push(rootId);const secondary=mask?mask.getY(rootId):.18;colors.push(1-secondary,secondary,0);if(joints&&weights)for(let d=0;d<4;d++){ji.push(joints.getComponent(rootId,d));sw.push(weights.getComponent(rootId,d));}}
    remaining--;
   }
  }
  if(!pos.length)continue;
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  if(ji.length){geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(ji,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));}
  if(g.morphAttributes.position?.length){geo.morphTargetsRelative=g.morphTargetsRelative;geo.morphAttributes.position=g.morphAttributes.position.map(attr=>{const values:number[]=[];for(let i=0;i<roots.length;i++){const id=roots[i];for(let d=0;d<3;d++)values.push(g.morphTargetsRelative?attr.getComponent(id,d):pos[i*3+d]+attr.getComponent(id,d)-p.getComponent(id,d));}return new T.Float32BufferAttribute(values,3);});}
  const material=new T.MeshStandardMaterial({roughness:.95,side:T.DoubleSide});material.name='BODY_FUR';
  const skin=source as T.SkinnedMesh,mesh=skin.isSkinnedMesh?new T.SkinnedMesh(geo,material):new T.Mesh(geo,material);
  mesh.name='Fur_'+source.name;mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);mesh.scale.copy(source.scale);mesh.userData.articulatedJaw=source.userData.articulatedJaw;source.parent?.add(mesh);
  if(mesh instanceof T.SkinnedMesh){const sk=mesh;sk.bindMode=skin.bindMode;sk.bind(skin.skeleton,skin.bindMatrix);sk.bindMatrixInverse.copy(skin.bindMatrixInverse);}
  mesh.morphTargetDictionary=source.morphTargetDictionary;mesh.morphTargetInfluences=source.morphTargetInfluences;
  result.push({mesh,source});
 }
 return result;
}
