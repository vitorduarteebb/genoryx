import * as T from "three";
import { publicEggAppearance, type PublicEggHints } from "./genesis-presentation";
import { smooth,visualHash } from "./creature-life";
export type EggMotion = "incubating"|"ready"|"pulse"|"crack"|"burst"|"still";
export type EggVisualInput = {hints:PublicEggHints;motion:EggMotion;progress:number;reducedMotion?:boolean};
export const eggStyles=["MOTTLED","SCALED","CRYSTAL","OBSIDIAN","CELESTIAL"] as const;
export type EggStyle=typeof eggStyles[number];
const grades=["COMMON","REFINED","RARE","EXCEPTIONAL","GENESIS"];
export function eggStyle(hints:PublicEggHints):EggStyle {return eggStyles[Math.max(0,grades.indexOf(hints.genesisGrade??"COMMON"))];}
type Shard={mesh:T.Mesh;center:T.Vector3;direction:T.Vector3;row:number;sector:number};
function surface(u:number,v:number,style:EggStyle,inside=false) {
  // The same boundary function is shared by neighboring patches: a closed shell at rest.
  const theta=u*Math.PI,phi=v*Math.PI*2;
  const warp=.018*Math.sin(phi*8+theta*13)*Math.sin(theta)**2;
  const t=theta+warp,r=Math.sin(t)*(.285-.057*Math.cos(t));
  const plate=style==="SCALED"?.004*(Math.cos(phi*12+Math.floor(u*18)*Math.PI)*Math.sin(theta*24)**2):0;
  const ridge=style==="CRYSTAL"?.011*Math.cos(phi*8)*Math.sin(t):style==="OBSIDIAN"?.007*Math.cos(phi*10+theta*8):plate;
  const radius=r+ridge-(inside?.012:0);
  return new T.Vector3(Math.cos(phi)*radius,.42+.42*Math.cos(t),Math.sin(phi)*radius);
}
function shellPatch(row:number,sector:number,style:EggStyle,palette:{shell:string;energy:string},seed:number) {
  const cols=8,rows=3,nx=8,ny=10,positions:number[]=[],colors:number[]=[],uv:number[]=[],indices:number[]=[];
  const base=new T.Color(palette.shell),accent=new T.Color(palette.energy),cream=new T.Color("#efd9a4");
  const center=surface((row+.5)/rows,(sector+.5)/cols,style);
  for(let layer=0;layer<2;layer++)for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++) {
    const u=(row+y/ny)/rows,v=(sector+x/nx)/cols,p=surface(u,v,style,layer===1),c=base.clone();
    const fleck=Math.sin(v*317+u*193+seed%97)*Math.cos(v*211-u*283);
    const band=Math.pow(Math.max(0,Math.sin(u*23+Math.sin(v*31))),10);
    if(layer)c.copy(cream).multiplyScalar(.45);
    else if(style==="MOTTLED")c.lerp(cream,Math.max(0,fleck-.35)*.75);
    else if(style==="SCALED")c.lerp(accent,.13+band*.25);
    else if(style==="CRYSTAL")c.lerp(accent,Math.pow(Math.max(0,Math.sin(v*50+u*8)),5)*.55);
    else if(style==="OBSIDIAN")c.lerp(accent,Math.max(0,band-.85)*2.5);
    else c.lerp(accent,Math.max(0,fleck-.5)*1.5+band*.12);
    c.multiplyScalar(.8+.2*Math.cos(u*Math.PI*.7));positions.push(p.x-center.x,p.y-center.y,p.z-center.z);colors.push(c.r,c.g,c.b);uv.push(v,u);
  }
  const stride=nx+1,layerSize=(ny+1)*stride;
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++) {const a=y*stride+x,b=a+1,c=a+stride,d=c+1;indices.push(a,c,b,b,c,d,a+layerSize,b+layerSize,c+layerSize,b+layerSize,d+layerSize,c+layerSize);}
  const edge=(a:number,b:number)=>indices.push(a,b,a+layerSize,b,b+layerSize,a+layerSize);
  for(let x=0;x<nx;x++){edge(x,x+1);edge(ny*stride+x+1,ny*stride+x);}
  for(let y=0;y<ny;y++){edge((y+1)*stride,y*stride);edge(y*stride+nx,(y+1)*stride+nx);}
  const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(positions,3));g.setAttribute("color",new T.Float32BufferAttribute(colors,3));g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  return {geometry:g,center};
}
/** One actual 3D object per egg, rendered through the creature preview's shared WebGL context. */
export class EggVisualController {
  readonly actor=new T.Group();readonly bounds=new T.Box3();readonly root=new T.Group();readonly shards:Shard[]=[];
  readonly style:EggStyle;private time=0;private phaseAt=0;private phase:EggMotion;private glow:T.Mesh;private ornaments=new T.Group();
  private shell:T.MeshPhysicalMaterial;private energy:T.MeshStandardMaterial;private materials=new Set<T.Material>();
  constructor(public input:EggVisualInput) {
    this.style=eggStyle(input.hints);this.phase=input.motion;this.actor.name=`GENORYX_EGG_${this.style}`;this.root.name="EggShell";this.actor.add(this.root);
    const appearance=publicEggAppearance(input.hints),seed=visualHash(input.hints.eggId??"egg");
    this.shell=new T.MeshPhysicalMaterial({vertexColors:true,roughness:this.style==="CRYSTAL"?.24:.52,metalness:this.style==="OBSIDIAN"?.20:.05,clearcoat:.35,clearcoatRoughness:.28,side:T.DoubleSide});
    this.energy=new T.MeshStandardMaterial({color:appearance.energy,emissive:appearance.energy,emissiveIntensity:.65,roughness:.25});
    this.materials.add(this.shell);this.materials.add(this.energy);
    for(let row=0;row<3;row++)for(let sector=0;sector<8;sector++) {
      const patch=shellPatch(row,sector,this.style,appearance,seed),mesh=new T.Mesh(patch.geometry,this.shell);mesh.name=`Shell_${row}_${sector}`;mesh.position.copy(patch.center);this.root.add(mesh);
      const direction=new T.Vector3(patch.center.x,.12+(2-row)*.12,patch.center.z).normalize();this.shards.push({mesh,center:patch.center,direction,row,sector});
    }
    this.glow=new T.Mesh(new T.SphereGeometry(.235,24,16),this.energy);this.glow.name="IncubationEnergy";this.glow.position.y=.39;this.glow.scale.set(1,1.55,1);this.root.add(this.glow);
    this.ornaments.name="ShellOrnaments";this.root.add(this.ornaments);
    if(this.style==="CRYSTAL"||this.style==="CELESTIAL")for(let i=0;i<6;i++) {
      const p=surface(.52,i/6,this.style),gem=new T.Mesh(new T.OctahedronGeometry(this.style==="CRYSTAL"?.026:.015,0),this.energy);gem.position.copy(p);gem.scale.y=2.1;gem.name=`Crystal_${i}`;this.ornaments.add(gem);
    }
    // A raised genetic seal; its orientation derives only from the public egg identity.
    const seal=new T.Mesh(new T.TorusGeometry(.043,.005,6,4),this.energy);seal.name="LineageSeal";seal.position.set(0,.41,.302);seal.rotation.z=Math.PI/4;seal.scale.y=1.3;this.ornaments.add(seal);
    this.actor.rotation.y=.25;this.actor.updateMatrixWorld(true);this.bounds.setFromObject(this.actor);this.update(0);
  }
  configure(input:EggVisualInput) {if(input.motion!==this.phase){this.phase=input.motion;this.phaseAt=this.time;}this.input=input;}
  play(){/* Egg phase is controlled by the server-authorized hatch presentation. */}
  update(dt:number) {
    this.time+=Math.max(0,Math.min(dt,.25));const t=this.time-this.phaseAt,reduced=this.input.reducedMotion;
    const pulse=this.phase==="pulse"||this.phase==="crack"||this.phase==="ready";
    const breakage=this.phase==="burst"?(reduced?1:Math.min(t/1.5,1)):0;
    const crack=this.phase==="crack"||this.phase==="ready"||this.phase==="burst";
    const amount=crack?(this.phase==="ready"?.002:.005)*(reduced?1:smooth(t/.6)):0;
    const envelope=Math.sin(this.time*.72)**12;
    this.root.rotation.set(0,0,reduced||this.phase==="still"?0:Math.sin(this.time*(pulse?13:2.1))*(pulse?.013:.004)*envelope);
    this.root.position.y=0;
    for(const shard of this.shards) {
      shard.mesh.position.copy(shard.center).addScaledVector(shard.direction,amount);shard.mesh.rotation.set(0,0,0);
      if(breakage>0){
        const travel=smooth(breakage),radius=(.24+(shard.row===0?.24:.05))*travel;
        shard.mesh.position.addScaledVector(shard.direction,radius);
        shard.mesh.position.y=Math.max(.07,shard.center.y+(shard.row===0?.26:.15)*Math.sin(breakage*Math.PI)-breakage*breakage*(shard.center.y-.07));
        shard.mesh.rotation.set(travel*(shard.row===0?1.4:-.65),travel*(shard.sector%2?1:-1)*.7,travel*Math.sin(shard.sector)*.8);
      }
    }
    this.ornaments.scale.setScalar(1-smooth(Math.min(1,breakage*12)));this.glow.visible=crack||pulse;
    this.energy.emissiveIntensity=reduced?.4:.5+.12*Math.sin(this.time*2.2);
    this.glow.scale.setScalar((1-breakage)*.97);this.glow.scale.y*=1.55;
    this.actor.updateMatrixWorld(true);
  }
  /** Exportable clips use the exact same evaluator as the live egg. */
  exportClips() {
    const result:T.AnimationClip[]=[];
    for(const [name,motion,duration] of [["Egg_Incubate","incubating",8],["Egg_Crack","crack",1],["Egg_Hatch","burst",1.5]] as const) {
      this.time=0;this.phaseAt=0;this.phase=motion;const times:number[]=[],pos=new Map<T.Object3D,number[]>(),rot=new Map<T.Object3D,number[]>(),scales=new Map<T.Object3D,number[]>();
      const nodes=[this.root,this.glow,this.ornaments,...this.shards.map(s=>s.mesh)];for(const n of nodes){pos.set(n,[]);rot.set(n,[]);scales.set(n,[]);}
      for(let i=0;i<=Math.ceil(duration*30);i++){this.update(i?1/30:0);times.push(i/30);for(const n of nodes){pos.get(n)!.push(...n.position);rot.get(n)!.push(...n.quaternion);scales.get(n)!.push(...n.scale);}}
      const tracks:T.KeyframeTrack[]=[];for(const n of nodes){tracks.push(new T.VectorKeyframeTrack(`${n.name}.position`,times,pos.get(n)!));tracks.push(new T.QuaternionKeyframeTrack(`${n.name}.quaternion`,times,rot.get(n)!));tracks.push(new T.VectorKeyframeTrack(`${n.name}.scale`,times,scales.get(n)!));}
      result.push(new T.AnimationClip(name,duration,tracks).optimize());
    }
    this.time=0;this.phaseAt=0;this.phase="still";this.update(0);return result;
  }
  dispose(){this.actor.traverse(o=>{if((o as T.Mesh).isMesh)(o as T.Mesh).geometry.dispose();});this.materials.forEach(m=>m.dispose());this.actor.removeFromParent();}
}
