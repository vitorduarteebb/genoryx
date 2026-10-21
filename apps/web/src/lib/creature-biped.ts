import * as T from "three";
export const isBipedPlan=(plan?:string|null)=>["BIPED","INSECTOID_BIPED","HUMANOID_BEAST"].includes(plan??"");
const axis=new T.Vector3(1,0,0);
/** Dedicated upright anatomy avoids pulling quadruped shoulder/hip skin into
 * long triangles. Parts are rigid at their skeletal attachment, with organic
 * overlapping joints, genetic material masks and separate claw material. */
export function buildBipedAnatomy(root:T.Object3D,bones:Map<string,T.Bone>,limbs?:string, maturity=1){
 root.updateMatrixWorld(true);
 const quadrupedSkins:T.Object3D[]=[];root.traverse(o=>{if((o as T.SkinnedMesh).isSkinnedMesh)quadrupedSkins.push(o);});quadrupedSkins.forEach(o=>o.removeFromParent());
 const skin=new T.MeshStandardMaterial({color:"white"});skin.name="Art04_BODY";
 const claw=new T.MeshStandardMaterial({color:"white"});claw.name="Art04_CLAW";
 const meshes:T.Mesh[]=[];
 const add=(bone:T.Object3D,g:T.BufferGeometry,name:string,material=skin)=>{
  const p=g.getAttribute("position"),mask:number[]=[];for(let i=0;i<p.count;i++){const belly=Math.max(0,Math.min(.65,.22+p.getZ(i)*1.4));mask.push(1-belly,belly,0);}
  g.setAttribute("color",new T.Float32BufferAttribute(mask,3));const m=new T.Mesh(g,material);m.name=name;bone.add(m);meshes.push(m);return m;
 };
 const oval=(x:number,y:number,z:number)=>new T.SphereGeometry(1,28,18).scale(x,y,z);
 const body=bones.get("Body");if(body){add(body,oval(.222+ .028*maturity,.337+.035*maturity,.218).translate(0,.025,-.012),"Biped_Torso");add(body,oval(.186,.160,.175).translate(0,-.174,-.015),"Biped_Pelvis");}
 const heavy=/HEAVY|ARMORED/.test(limbs??""),agile=/AGILE/.test(limbs??"");
 for(const side of ["L","R"]){
  for(const region of ["Front","Rear"]){
   const bone=bones.get(`${region}_${side}`),foot=bones.get(`${region}_${side}_Foot`);if(!bone||!foot)continue;
   const arm=region==="Front",length=foot.position.y,radius=(arm?.062:.089)*(heavy?1.15:agile?.90:1);
   if(arm){
    add(bone,oval(radius*1.15,length*.30,radius).translate(0,length*.23,0),`Biped_${side}_UpperArm`);
    add(bone,oval(radius*.85,length*.28,radius*.86).translate(0,length*.70,.014),`Biped_${side}_Forearm`);
    add(bone,oval(radius*.87,radius*.83,radius*.87).translate(0,length*.49,.012),`Biped_${side}_Elbow`);
   }else add(bone,oval(radius,length*.56,radius*.90).translate(0,length*.44,0),`Biped_${region}_${side}_Muscle`);
   add(bone,oval(radius*1.12,radius*1.10,radius*1.10).translate(0,.025,0),`Biped_${region}_${side}_Joint`);
   const world=foot.getWorldPosition(new T.Vector3()),inverse=foot.matrixWorld.clone().invert();
   const sole=oval(arm?.066:.081,.043,arm?.074:.121).translate(world.x,world.y+.032,world.z+.035).applyMatrix4(inverse);
   add(foot,sole,`Biped_${region}_${side}_Paw`);
   if(arm)for(let i=-1;i<=1;i++){
    const finger=oval(.018,.024,.045).translate(world.x+i*.034,world.y+.025,world.z+.080).applyMatrix4(inverse);
    add(foot,finger,`Biped_${side}_Finger_${i}`);
   }
   for(let i=-1;i<=1;i++){
    const g=new T.ConeGeometry(arm?.011:.014,arm?.042:.048,10,2);g.rotateX(Math.PI/2);g.translate(world.x+i*(arm?.033:.041),world.y+.030,world.z+(arm?.105:.145));g.applyMatrix4(inverse);add(foot,g,`Biped_${region}_${side}_Claw_${i}`,claw);
   }
  }
 }
 return {meshes,materials:[skin,claw]};
}
/** Retarget Art04's creature skeleton into an upright pelvis/chest posture.
 * The front pair becomes shorter free arms; only the rear pair supports weight. */
export class BipedPose {
 private world=new Map<string,T.Quaternion>();
 constructor(private bones:Map<string,T.Bone>,private root:T.Object3D,private maturity=1){
  const inverse=root.getWorldQuaternion(new T.Quaternion()).invert();
  for(const [name,b] of bones)this.world.set(name,inverse.clone().multiply(b.getWorldQuaternion(new T.Quaternion())));
 }
 private rotate(name:string,pitch:number){
  const b=this.bones.get(name),rest=this.world.get(name);if(!b||!rest)return;
  const desired=this.root.getWorldQuaternion(new T.Quaternion()).multiply(new T.Quaternion().setFromAxisAngle(axis,pitch)).multiply(rest);
  const parent=b.parent?.getWorldQuaternion(new T.Quaternion())??new T.Quaternion();
  b.quaternion.copy(parent.invert().multiply(desired));b.updateWorldMatrix(false,true);
 }
 apply(state:string,time:number,age:number,reduced:boolean){
  const moving=!reduced&&(state==="WALK"||state==="RUN"),run=state==="RUN";
  const phase=time*(run?10:6),stride=moving?(run?.40:.23):0;
  const strike=!reduced&&/ATTACK|CLAW_SWIPE/.test(state)?Math.sin(Math.min(1,age/.95)*Math.PI)**2:0;
  const roar=!reduced&&/CAST|VICTORY|HATCH/.test(state)?Math.sin(Math.min(1,age/1.6)*Math.PI)**2:0;
  const dead=state==="DEATH"||state==="KO",fall=dead?Math.min(1,age/1.1):0;
  this.rotate("Body",-1.02+.13*strike+.80*fall);
  const breath=reduced||dead?0:.009*Math.sin(time*1.35);
  const body=this.bones.get("Body");if(body){body.position.y+=.035+(moving?Math.abs(Math.sin(phase))*.025:0);body.scale.set(1+.08*this.maturity+breath*.4,1.04+.12*this.maturity+breath,.93+breath*.5);}
  this.rotate("Head",-.08*roar+.14*strike);this.rotate("Tail",.12+.08*Math.sin(time*1.4));
  for(const [side,sign] of [["L",1],["R",-1]] as const){
   const swing=Math.sin(phase)*stride*sign;
   this.rotate(`Rear_${side}`,swing-.05);this.rotate(`Rear_${side}_Foot`,-swing*.35);
   const leg=this.bones.get(`Rear_${side}`);if(leg)leg.scale.set(1+.12*this.maturity,1.03+.23*this.maturity,1+.12*this.maturity);
   this.rotate(`Front_${side}`,-.50-swing*.65-(side==="R"?.8*strike:0)-.22*roar);
   this.rotate(`Front_${side}_Foot`,-.28-(side==="R"?.35*strike:0));
   const arm=this.bones.get(`Front_${side}`);if(arm){arm.scale.set(.92+.13*this.maturity,.91+.17*this.maturity,.92+.13*this.maturity);arm.position.y=.145;arm.position.x=sign*(.225+.025*this.maturity);}
  }
 }
}
