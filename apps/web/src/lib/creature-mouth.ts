import * as T from "three";
import { headPoint } from "./creature-anatomy";
import { smooth } from "./creature-life";
export const mouthProfiles = {
 HEAD_01_SMOOTH:{label:"Presas curtas",type:"SHORT_FANGS",count:4,length:.030,width:.140,gape:.007},
 HEAD_02_PREDATOR:{label:"Caninos de sabre",type:"SABER_FANGS",count:6,length:.064,width:.176,gape:.009},
 HEAD_03_DRACONIC:{label:"Dentição serrilhada",type:"SERRATED",count:8,length:.027,width:.167,gape:.010},
 HEAD_04_ARCANE:{label:"Bico dracônico com presas",type:"BEAK_FANGS",count:4,length:.026,width:.128,gape:.006},
} as const;
export type MouthHead=keyof typeof mouthProfiles;
export function mouthOpening(state:string,age:number,reduced=false) {
 if(reduced||state==="DEATH"||state==="KO")return 0;
 const duration=/CAST|VICTORY|HATCH/.test(state)?1.6:/ATTACK|CLAW_SWIPE/.test(state)?.95:state==="HIT"?.45:0;
 if(!duration||age>=duration)return 0;
 return Math.sin(Math.max(0,age/duration)*Math.PI)**2*.92;
}
export function lowerJawPoint(x:number,y:number,z:number,open:number):[number,number,number] {
 const w=smooth((-.10-y)/.14)*smooth((z-.08)/.28),a=.30*w*open,dy=y+.11,dz=z-.10;
 if(!a)return [x,y,z];
 return [x,-.11+dy*Math.cos(a)-dz*Math.sin(a),.10+dy*Math.sin(a)+dz*Math.cos(a)];
}
type Surface=(x:number,y:number,z:number)=>T.Vector3;
type Tooth={mesh:T.Mesh;base:T.Vector3;lower:boolean};
type MovingMesh={mesh:T.Mesh;rest:Float32Array;weights:Float32Array};
/** Closed resting seam, embedded gum line, curved enamel crowns and tapered corners. */
export class CreatureMouth {
 readonly group=new T.Group();readonly profile;readonly teeth:Tooth[]=[];
 private readonly ownedMaterials:T.Material[]=[];
 private readonly moving:MovingMesh[]=[];
 private readonly point:Surface;
 private readonly colors={root:new T.Color("#9c7951"),mid:new T.Color("#ded1ad"),tip:new T.Color("#fff4d7")};
 constructor(readonly head:string,readonly eyes:string,color:T.Color,surface?:Surface) {
  this.profile=mouthProfiles[head as MouthHead]??mouthProfiles.HEAD_01_SMOOTH;
  this.group.name=`Mouth_${this.profile.type}`;
  this.point=surface??((x,y,z)=>new T.Vector3(...headPoint(x,y,z,head,eyes)));
  const material=(name:string,c:T.Color,roughness:number,vertexColors=false)=>{
   const m=new T.MeshStandardMaterial({color:c,roughness,vertexColors,side:T.DoubleSide});m.name=name;this.ownedMaterials.push(m);return m;
  };
  const cavity=material("OralDepth",new T.Color("white"),.88,true);
  const upper=material("UpperLipSkin",color.clone().multiplyScalar(.70),.65);
  const lower=material("LowerLipSkin",color.clone().multiplyScalar(.54),.69);
  const gum=material("GumTissue",new T.Color("#48222c"),.58);
  const enamel=material("LayeredEnamel",new T.Color("white"),.38,true);
  // Pointed cheek corners and a recessed gradient replace the rectangular grin.
  const pos:number[]=[],cols:number[]=[],weights:number[]=[],idx:number[]=[];
  for(let row=0;row<=4;row++)for(let i=0;i<=40;i++){
   const t=i/40,v=row/4,p=this.line(t,v);p.z+=.002;pos.push(...p);weights.push(v*this.corner(t));
   const c=new T.Color("#08070a").lerp(new T.Color("#381820"),Math.abs(v-.5)*.6);cols.push(c.r,c.g,c.b);
  }
  for(let r=0;r<4;r++)for(let i=0;i<40;i++){const a=r*41+i;idx.push(a,a+1,a+41,a+1,a+42,a+41);}
  const inside=new T.BufferGeometry();inside.setAttribute("position",new T.Float32BufferAttribute(pos,3));inside.setAttribute("color",new T.Float32BufferAttribute(cols,3));inside.setIndex(idx);inside.computeVertexNormals();this.add("OralCavity",inside,cavity,weights);
  this.ribbon("UpperLip",0,.008,upper,false,.006);
  this.ribbon("LowerLip",1,.006,lower,true,.005);
  this.ribbon("UpperGum",.20,.0032,gum,false,.003);
  this.ribbon("LowerGum",.80,.0028,gum,true,.003);
  for(let row=0;row<2;row++)for(let i=0;i<this.profile.count;i++){
   const canine=i===0||i===this.profile.count-1,serrated=this.profile.type==="SERRATED";
   const t=.16+(i+(row?.32:.5))/this.profile.count*.68;
   const length=this.profile.length*(row?.27:canine?1:serrated?.68:.24);
   const radius=canine?(this.profile.type==="SABER_FANGS"?.013:.010):serrated?.010:.007;
   const geometry=this.crown(length,radius,serrated?"blade":"fang",row===1);
   const base=this.line(t,row?1:0);base.z+=.005;base.y+=row?-.0025:.004;
   const mesh=new T.Mesh(geometry,enamel);mesh.name=`Tooth_${row}_${i}`;mesh.position.copy(base);
   mesh.rotation.z=(t-.5)*(row?-.26:.26);this.group.add(mesh);this.teeth.push({mesh,base,lower:row===1});mesh.userData.t=t;
  }
  if(this.profile.type==="BEAK_FANGS"){
   const m=new T.Mesh(this.crown(.031,.024,"beak",false),enamel);m.name="DraconicBeak";
   m.position.copy(this.line(.5,0));m.position.y+=.009;m.position.z+=.006;this.group.add(m);
  }
  this.update(0);
 }
 private corner(t:number){return Math.sin(Math.PI*Math.max(0,Math.min(1,t)))**.65;}
 private line(t:number,row:number){
  const a=t*2-1,y=-.194+.010*a*a;
  return this.point(a*this.profile.width,y-row*this.profile.gape*(1-a*a),.43);
 }
 private add(name:string,g:T.BufferGeometry,m:T.Material,weights?:number[]){
  const mesh=new T.Mesh(g,m);mesh.name=name;this.group.add(mesh);
  if(weights)this.moving.push({mesh,rest:new Float32Array(g.getAttribute("position").array),weights:new Float32Array(weights)});
  return mesh;
 }
 private ribbon(name:string,row:number,radius:number,material:T.Material,move:boolean,offset:number){
  const pos:number[]=[],idx:number[]=[],weights:number[]=[];
  for(let i=0;i<=40;i++){
   const t=i/40,p=this.line(t,row),next=this.line(Math.min(1,t+.005),row),prev=this.line(Math.max(0,t-.005),row);
   const tangent=next.sub(prev).normalize(),normal=new T.Vector3(-tangent.y,tangent.x,0).normalize();
   const r=radius*(.06+.94*this.corner(t));
   for(let j=0;j<=10;j++){
    const a=j/10*Math.PI*2,q=p.clone().addScaledVector(normal,Math.cos(a)*r);
    q.z+=offset+Math.sin(a)*r*.60;pos.push(...q);weights.push(this.corner(t));
   }
  }
  for(let i=0;i<40;i++)for(let j=0;j<10;j++){const a=i*11+j;idx.push(a,a+1,a+11,a+1,a+12,a+11);}
  const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();this.add(name,g,material,move?weights:undefined);
 }
 private crown(length:number,radius:number,shape:"fang"|"blade"|"beak",lower:boolean){
  const pos:number[]=[],cols:number[]=[],idx:number[]=[],rings=9,sides=12;
  for(let i=0;i<=rings;i++){
   const t=i/rings,r=radius*Math.max(.012,(1-t)**.72)*(1+.13*Math.sin(t*Math.PI));
   const bend=length*(shape==="fang"?.32:.18)*t*t;
   for(let j=0;j<=sides;j++){
    const a=j/sides*Math.PI*2,ridge=1+.045*Math.cos(a*3)*Math.sin(t*Math.PI);
    pos.push(Math.cos(a)*r*ridge*(shape==="beak"?1.25:1),(lower?1:-1)*length*t,Math.sin(a)*r*(shape==="blade"?.35:shape==="beak"?.48:.70)+bend);
    const c=t<.3?this.colors.root.clone().lerp(this.colors.mid,t/.3):this.colors.mid.clone().lerp(this.colors.tip,(t-.3)/.7);cols.push(c.r,c.g,c.b);
   }
  }
  for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j;idx.push(a,a+1,a+sides+1,a+1,a+sides+2,a+sides+1);}
  const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setAttribute("color",new T.Float32BufferAttribute(cols,3));g.setIndex(idx);g.computeVertexNormals();return g;
 }
 update(open:number){
  const amount=Math.max(0,Math.min(1,open));
  for(const {mesh,rest,weights} of this.moving){
   const p=mesh.geometry.getAttribute("position");
   for(let i=0;i<p.count;i++){const a=amount*weights[i];p.setXYZ(i,rest[i*3],rest[i*3+1]-a*.055,rest[i*3+2]-a*.016);}p.needsUpdate=true;
  }
  for(const t of this.teeth){
   t.mesh.position.copy(t.base);
   if(t.lower){const a=amount*this.corner(t.mesh.userData.t);t.mesh.position.y-=a*.055;t.mesh.position.z-=a*.016;}
  }
 }
 exportClip(){
  this.update(0);const tracks:T.KeyframeTrack[]=[],times=[0,.2,.6,1,1.4],values=[0,0,1,.7,0];this.update(1);
  for(const {mesh,rest} of this.moving){
   const p=mesh.geometry.getAttribute("position"),delta=new Float32Array(rest.length);for(let i=0;i<delta.length;i++)delta[i]=p.array[i]-rest[i];
   const attr=new T.Float32BufferAttribute(delta,3);attr.name="MouthOpen";mesh.geometry.morphAttributes.position=[attr];mesh.geometry.morphTargetsRelative=true;mesh.updateMorphTargets();
   tracks.push(new T.NumberKeyframeTrack(`${mesh.name}.morphTargetInfluences`,times,values));
  }
  for(const t of this.teeth.filter(t=>t.lower)){
   const positions:number[]=[];
   for(const w of values){const a=w*this.corner(t.mesh.userData.t);positions.push(t.base.x,t.base.y-a*.055,t.base.z-a*.016);}
   tracks.push(new T.VectorKeyframeTrack(`${t.mesh.name}.position`,times,positions));
  }
  this.update(0);return new T.AnimationClip("Mouth_Roar",1.4,tracks);
 }
 dispose(){this.group.traverse(o=>{if((o as T.Mesh).isMesh)(o as T.Mesh).geometry.dispose();});this.ownedMaterials.forEach(m=>m.dispose());this.group.removeFromParent();}
}
