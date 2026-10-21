import {buildCreatureFur} from "./creature-fur";
import * as T from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { chassisPaletteRgb } from "@nexora/config";
import { battleActorYaw, battleGroundOffset, detectCanonicalForward, isLevitatingPlan } from "@nexora/game-engine";
import { gxrPalette } from "./gxr-kit";
import { headPoint } from "./creature-anatomy";
import { CreatureMouth, mouthOpening } from "./creature-mouth";
import { splitJawSurface, jawHinge, jawAngle } from "./creature-jaw";
import { CreatureWings } from "./creature-wings";
import { BipedPose, isBipedPlan, buildBipedAnatomy } from "./creature-biped";
import { sampleCreatureLife, smooth } from "./creature-life";
import { contextQuality, sourceClip, visualGrowth, type CreatureVisualInput, type CreatureVisualState } from "./creature-visual-contract";

type Manifest = {
  base: string; assets: Record<string, { url: string }>;
  animationUrl: string; bones: string[];
  serverGeneMapping: Record<string, Record<string, string | null | { front: string | null; rear: string | null }>>;
};
const loader = new GLTFLoader(), assets = new Map<string, Promise<GLTF>>();
let manifestPromise: Promise<Manifest> | undefined;
const textures = new Map<string, T.Texture>();
export function loadCreatureManifest() {
  return manifestPromise ??= fetch("/genoryx-art04/manifest.json").then(r => { if (!r.ok) throw new Error("Catálogo de criaturas indisponível"); return r.json() as Promise<Manifest>; }).catch(e => { manifestPromise = undefined; throw e; });
}
function loadAsset(url: string) {
  let pending = assets.get(url);
  if (!pending) {
    pending = loader.loadAsync(url).catch(e => { assets.delete(url); throw e; }); assets.set(url, pending);
    if (assets.size > 56) assets.delete(assets.keys().next().value!);
  }
  return pending;
}
function mapTexture(index: number, kind: string) {
  const url = `/genoryx-art04/textures/GXR_Skin_${String(index).padStart(2,"0")}_${kind}.png`;
  let texture = textures.get(url);
  if (!texture) { texture = new T.TextureLoader().load(url); texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.repeat.set(5,5); texture.flipY = false; textures.set(url, texture); }
  return texture;
}
function meshes(root: T.Object3D) { const result: T.Mesh[] = []; root.traverse(o => { if ((o as T.Mesh).isMesh) result.push(o as T.Mesh); }); return result; }
export function genomeMask(g:T.BufferGeometry) {
  // Blender changed attribute order between exports. The audited mask is the normalized partition,
  // whereas the exemplar preview color is not. Never use exemplar colors as inherited weights.
  for(const key of ["color","color_1"]) {
    const a=g.getAttribute(key);if(!a)continue;let error=0;
    for(let i=0;i<a.count;i++)error=Math.max(error,Math.abs(a.getX(i)+a.getY(i)+a.getZ(i)-1));
    if(error<.025)return a;
  }
  return undefined;
}
const xyz = new T.Vector3();
const scratch = new T.Color();
function vivify(c: T.Color) {
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  // Linear + ACES apaga o cromado da paleta Unity. Empurra saturação e um pouco de luz, sem estourar.
  const s = hsl.s < 0.07 ? hsl.s : Math.min(1, hsl.s * 1.34 + 0.05);
  const l = Math.min(0.66, hsl.l * 1.14 + (hsl.l < 0.18 ? 0.045 : 0.02));
  return c.setHSL(hsl.h, s, l);
}
function rgb(id: string | undefined, fallback: readonly number[]) {
  const c = id && chassisPaletteRgb[id] || fallback;
  return vivify(new T.Color().setRGB(c[0], c[1], c[2], T.SRGBColorSpace));
}
/** Os packs usam prefixo de exportador (Portable_, Export_, Art03_) e sufixo .001 do Blender. O papel é o miolo. */
function roleName(material?: T.Material | null) {
  return (material?.name ?? "BODY_PRIMARY").replace(/^(?:Portable|Export|Art03)\d*_/, "").replace(/\.\d+$/, "");
}
type Palette = { primary: T.Color; secondary: T.Color; tertiary: T.Color; eye: T.Color; core: T.Color };
/** Cor de papel não-pele. Devolve null quando o papel é pele, que o chamador pinta com máscara e padrão. */
function paintRole(name: string, out: T.Color, pal: Palette) {
  if (/CATCHLIGHT|HIGHLIGHT|Highlight/.test(name)) return out.setRGB(.90,.95,1);
  if (/IRIS/.test(name)) return /LIMBAL/.test(name) ? out.setRGB(.02,.03,.05) : out.copy(pal.eye).multiplyScalar(/INNER/.test(name)?1:.62);
  if (/PUPIL|EyeSurface|EYE_SOCKET/.test(name)) return out.setRGB(.008,.013,.019);
  if (name === "EYE") return out.setRGB(.003,.006,.012);
  if (/BEZEL/.test(name)) return out.copy(pal.secondary).lerp(pal.primary,.35);
  if (/CORE|ACCENT|Ember|[Ff]issure/.test(name)) return out.copy(pal.core);
  if (/HORN|[Kk]eratin/.test(name)) return out.copy(pal.secondary).lerp(pal.primary,.30);
  if (/BACK|Obsidian|[Ss]cute/.test(name)) return out.copy(pal.primary).lerp(pal.secondary,.42);
  return null;
}
function patternWeight(kind: string, p: T.Vector3) {
  const { x,y,z } = p, f = 25;
  if (kind === "PATTERN_STRIPES") return smooth((Math.sin(z*f + .6*Math.sin(y*10))-.05)/.55);
  if (kind === "PATTERN_VEINS") return (1-smooth(Math.abs(Math.sin(x*21+Math.sin(z*19)+y*8))/.15))*.8;
  if (kind === "PATTERN_CRACKS") return (1-smooth(Math.abs(Math.sin(x*18+z*15)*Math.sin(y*22-z*17))/.09))*.7;
  if (kind === "PATTERN_GENESIS") return smooth((Math.sin(x*f)*Math.sin(y*f)*Math.sin(z*f)-.26)/.3);
  if (kind === "PATTERN_SCALES") return smooth((Math.sin(z*40+Math.floor(y*30)*.7)-.65)/.35)*.24;
  return 0;
}
function skinType(input: CreatureVisualInput) {
  const limb = input.chassis?.limbs.d;
  if (limb === "LIMBS_02_ARMORED" || limb === "LIMBS_05_HEAVY") return 2;
  if (limb === "LIMBS_03_DRACONIC" || input.chassis?.pattern.d === "PATTERN_SCALES") return 1;
  return limb === "LIMBS_04_AGILE" ? 3 : 0;
}

export class CreatureVisualController {
  readonly actor = new T.Group();
  readonly bones = new Map<string, T.Bone>();
  readonly capabilities: string[] = [];
  readonly mixer: T.AnimationMixer;
  readonly clips = new Map<string, T.AnimationClip>();
  readonly bounds = new T.Box3();
  canonicalForward = { x: 0, z: 1 };
  groundOffset = 0;
  private restBones = new Map<T.Bone,{position:T.Vector3;quaternion:T.Quaternion;scale:T.Vector3}>();
  private action?: T.AnimationAction;
  private state: CreatureVisualState = "IDLE";
  private stateAt = 0; private elapsed = 0; private commandKey: string | number | undefined;
  private morphs: Array<{ mesh: T.Mesh; breath?: number; blink?: number }> = [];
  private contacts: Array<{ mesh: T.SkinnedMesh; indices: number[] }> = [];
  private footBones: T.Bone[] = [];
  private restHeight = 1;
  private aura?: T.Points;
  private mouth?:CreatureMouth;
  private lowerJawMeshes:T.Mesh[]=[];
  private jawSeams:T.Vector3[][]=[];
  private jawGroup?:T.Group;
  private biped?:BipedPose;
  private wings?:CreatureWings;
  private get maturity(){return this.growth.stage==="BABY"?0:this.growth.stage==="YOUNG"?.5:1;}
  private readonly ownedGeometries = new Set<T.BufferGeometry>();
  private readonly ownedMaterials = new Set<T.Material>();
  private readonly growth;
  private readonly floating;
  private modular: boolean;
  private constructor(readonly root: T.Object3D, readonly input: CreatureVisualInput, animations: T.AnimationClip[], modular: boolean) {
    this.modular = modular; this.growth = visualGrowth(input.lifeStage ?? input.chassis?.growthStage);
    this.floating = isLevitatingPlan(input.bodyPlan);
    this.actor.add(root);
    root.traverse(o => { if ((o as T.Bone).isBone) {const b=o as T.Bone;this.bones.set(o.name,b);this.restBones.set(b,{position:b.position.clone(),quaternion:b.quaternion.clone(),scale:b.scale.clone()});} });
    for (const name of ["Front_L_Foot","Front_R_Foot","Rear_L_Foot","Rear_R_Foot"]) {
      const foot = this.bones.get(name); if (foot) this.footBones.push(foot);
    }
    this.mixer = new T.AnimationMixer(root);
    for (const original of animations) {
      const clip = original.clone();
      const idle = /idle/i.test(clip.name);
      if (idle && modular) clip.tracks = clip.tracks.filter(t => /^(Head|Tail)\./.test(t.name));
      if (idle) clip.tracks = clip.tracks.filter(t => !/(^|\.)(Root|Armature|Hips|Body)\.position$/.test(t.name));
      // Life channels use an independent clock, including across attacks and state changes.
      clip.tracks = clip.tracks.filter(t => !t.name.includes("morphTargetInfluences"));
      this.clips.set(clip.name,clip); this.capabilities.push(clip.name);
    }
    this.mixer.addEventListener("finished", () => { if (!["DEATH","KO"].includes(this.state)) this.play("IDLE"); });
  }
  static async create(input: CreatureVisualInput) {
    const modular = !!input.chassis || !input.modelUrl;
    if (!modular) {
      const url = input.modelUrl!.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}${input.modelUrl}` : input.modelUrl!;
      const source = await loadAsset(url); const root = cloneSkeleton(source.scene);
      const c = new CreatureVisualController(root,input,source.animations,false); c.prepare(false); return c;
    }
    const manifest = await loadCreatureManifest();
    const [base, motions] = await Promise.all([loadAsset(manifest.assets[manifest.base].url),loadAsset(manifest.animationUrl)]);
    const root = cloneSkeleton(base.scene); root.updateMatrixWorld(true);
    const c = new CreatureVisualController(root,input,motions.animations,true);
    const expression = (category: string) => {
      const allele = input.chassis?.[category as keyof typeof input.chassis] as { d?: string; r1?: string } | undefined;
      const id = allele?.d || allele?.r1;
      // Missing old presentation data gets a neutral base, never a generated phenotype.
      const defaults: Record<string,string> = { head:"HEAD_01_SMOOTH",eyes:"EYES_01_PREDATOR",horns:"HORNS_NONE",back:"BACK_NONE",tail:"TAIL_01_SHORT",core:"CORE_01_EMBER",limbs:"LIMBS_01_SOFT" };
      return manifest.serverGeneMapping[category]?.[id ?? defaults[category]];
    };
    const attach = async (id: string | null | undefined, socketName: string) => {
      if (!id) return;
      if(id==="GXR_BACK_03_WINGS"){
        const socket=root.getObjectByName(socketName);if(!socket)throw new Error(`Socket ausente: ${socketName}`);
        c.wings=new CreatureWings(socket,c.maturity);c.wings.meshes.forEach(m=>c.ownedGeometries.add(m.geometry));c.wings.materials.forEach(m=>c.ownedMaterials.add(m));return;
      }
      const entry = manifest.assets[id]; if (!entry) throw new Error(`Peça ausente: ${id}`);
      const socket = root.getObjectByName(socketName); if (!socket) throw new Error(`Socket ausente: ${socketName}`);
      const part = cloneSkeleton((await loadAsset(entry.url)).scene); socket.add(part); part.updateMatrixWorld(true);
      if(socketName === "Socket_Head") c.refineHead(part,socket);
    };
    const horns = expression("horns") as string | null;
    await Promise.all([
      attach(expression("head") as string,"Socket_Head"), attach(expression("eyes") as string,"Socket_Head"),
      attach(expression("back") as string,"Socket_Back"), attach(expression("tail") as string,"Socket_Tail"),
      attach(expression("core") as string,"Socket_Core_L"),
      attach(horns ? horns+"_L" : null,"Socket_Horn_L"), attach(horns ? horns+"_R" : null,"Socket_Horn_R"),
    ]);
    const faceSocket=root.getObjectByName("Socket_Head");
    if(faceSocket)for(const name of ["Socket_Horn_L","Socket_Horn_R"]) {
      const horn=root.getObjectByName(name);if(!horn?.parent)continue;
      const p=faceSocket.worldToLocal(horn.getWorldPosition(new T.Vector3()));
      p.set(...headPoint(p.x,p.y,p.z,input.chassis?.head.d??"HEAD_01_SMOOTH",input.chassis?.eyes.d??"EYES_01_PREDATOR"));
      horn.position.copy(horn.parent.worldToLocal(faceSocket.localToWorld(p)));
    }
    const limbs = expression("limbs") as { front: string | null; rear: string | null };
    for (const region of ["front","rear"] as const) {
      const id = limbs?.[region]; if (!id) continue;
      const donor = cloneSkeleton((await loadAsset(manifest.assets[id].url)).scene); donor.updateMatrixWorld(true);
      const skins = meshes(donor).filter(m => (m as T.SkinnedMesh).isSkinnedMesh) as T.SkinnedMesh[];
      // GLTFLoader splits a two-leg mesh into several skinned material primitives.
      if (skins.length < 2) throw new Error(`Par de patas inválido: ${id}`);
      for (const mesh of skins) {
        const bones = mesh.skeleton.bones.map(b => { const bone = c.bones.get(b.name); if (!bone) throw new Error(`Osso ausente: ${b.name}`); return bone; });
        const bind = mesh.bindMatrix.clone(), inverses = mesh.skeleton.boneInverses.map(i => i.clone());
        root.attach(mesh); mesh.bind(new T.Skeleton(bones,inverses),bind);
      }
      for (const side of ["L","R"]) { const old = root.getObjectByName(`Mesh_${region === "front" ? "Front" : "Rear"}_${side}`); if (old) old.visible = false; }
    }
    if(isBipedPlan(input.bodyPlan)){
      const anatomy=buildBipedAnatomy(root,c.bones,input.chassis?.limbs.d,c.maturity);anatomy.meshes.forEach(m=>c.ownedGeometries.add(m.geometry));anatomy.materials.forEach(m=>c.ownedMaterials.add(m));
      c.biped=new BipedPose(c.bones,root,c.maturity);
    }
    for(const {mesh,source} of buildCreatureFur(root,input.chassis?.pattern.d??"")){
      c.ownedGeometries.add(mesh.geometry);c.ownedMaterials.add(mesh.material as T.Material);
      if(c.lowerJawMeshes.includes(source))c.lowerJawMeshes.push(mesh);
    }
    c.prepare(true);c.makeMouth(); return c;
  }
  private refineHead(part:T.Object3D,socket:T.Object3D) {
    const head=this.input.chassis?.head.d??"HEAD_01_SMOOTH",eyes=this.input.chassis?.eyes.d??"EYES_01_PREDATOR";
    socket.updateWorldMatrix(true,true);
    for(const mesh of meshes(part)) {
      let g=mesh.geometry.clone();mesh.geometry=g;this.ownedGeometries.add(g);
      const toSocket=socket.matrixWorld.clone().invert().multiply(mesh.matrixWorld),back=toSocket.clone().invert();
      const isHead=/HeadSurface/.test(mesh.name)||/HeadSurface/.test(mesh.parent?.name??"");
      let lower:T.BufferGeometry|undefined;
      if(isHead){
        mesh.userData.articulatedJaw=true;
        const split=splitJawSurface(g,toSocket);g=split.upper;lower=split.lower;mesh.geometry=g;
        this.ownedGeometries.add(g);this.ownedGeometries.add(lower);this.jawSeams.push(split.seam);
        const mandible=new T.Mesh(lower,mesh.material);mandible.name=mesh.name+"_Mandible";
        mandible.position.copy(mesh.position);mandible.quaternion.copy(mesh.quaternion);mandible.scale.copy(mesh.scale);
        mandible.userData.articulatedJaw=true;mesh.parent?.add(mandible);this.lowerJawMeshes.push(mandible);
      }
      for(const geometry of lower?[g,lower]:[g]) {
      const g=geometry;
      const p=g.getAttribute("position"),original=p.clone(),v=new T.Vector3();
      const warp=(point:T.Vector3)=>{point.applyMatrix4(toSocket);point.set(...headPoint(point.x,point.y,point.z,head,eyes));return point.applyMatrix4(back);};
      for(let i=0;i<p.count;i++){warp(v.fromBufferAttribute(original,i));p.setXYZ(i,v.x,v.y,v.z);}
      for(const morph of g.morphAttributes.position??[]) for(let i=0;i<p.count;i++) {
        v.fromBufferAttribute(morph,i);if(g.morphTargetsRelative)v.add(new T.Vector3().fromBufferAttribute(original,i));warp(v);
        if(g.morphTargetsRelative)v.sub(new T.Vector3().fromBufferAttribute(p,i));morph.setXYZ(i,v.x,v.y,v.z);
      }
      g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
      }
    }
  }
  private makeMouth() {
    const socket=this.root.getObjectByName("Socket_Head");if(!socket)return;this.root.updateMatrixWorld(true);
    const head=this.input.chassis?.head.d??"HEAD_01_SMOOTH",eyes=this.input.chassis?.eyes.d??"EYES_01_PREDATOR";
    const skin=meshes(socket).filter(m=>/HeadSurface/.test(m.name)||/HeadSurface/.test(m.parent?.name??""));
    const ray=new T.Raycaster(),direction=new T.Vector3(0,0,-1).transformDirection(socket.matrixWorld);
    const surface=(x:number,y:number,z:number)=>{
      const p=new T.Vector3(...headPoint(x,y,z,head,eyes));const origin=socket.localToWorld(new T.Vector3(p.x,p.y,2));ray.set(origin,direction);
      const hit=ray.intersectObjects(skin,false)[0];return hit?socket.worldToLocal(hit.point.clone()):p;
    };
    const palette=gxrPalette(this.input.chassis,this.input.element);this.mouth=new CreatureMouth(head,eyes,rgb(this.input.chassis?.primaryColorId,palette.primary),surface);socket.add(this.mouth.group);
    const hinge=jawHinge(head,eyes);this.jawGroup=new T.Group();this.jawGroup.name="AnatomicalMandible";this.jawGroup.position.copy(hinge);socket.add(this.jawGroup);socket.updateWorldMatrix(true,true);
    for(const mesh of this.lowerJawMeshes)this.jawGroup.attach(mesh);
    const material=new T.MeshStandardMaterial({color:"#180c13",roughness:.88,side:T.DoubleSide});this.ownedMaterials.add(material);
    for(const seam of this.jawSeams){
      if(seam.length<3)continue;const points=seam.map(p=>new T.Vector3(...headPoint(p.x,p.y,p.z,head,eyes)));
      const center=points.reduce((a,p)=>a.add(p),new T.Vector3()).divideScalar(points.length),positions:number[]=[];
      for(let i=0;i<points.length;i++)positions.push(...center,...points[i],...points[(i+1)%points.length]);
      for(const lower of [false,true]){const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();this.ownedGeometries.add(g);const cap=new T.Mesh(g,material);cap.name=lower?"JawInnerFloor":"MouthInnerRoof";socket.add(cap);if(lower)this.jawGroup.attach(cap);}
    }
  }
  private prepare(recolor: boolean) {
    this.root.updateMatrixWorld(true);
    const pal = gxrPalette(this.input.chassis,this.input.element), dna = this.input.chassis;
    const primary = rgb(dna?.primaryColorId,pal.primary), secondary = rgb(dna?.secondaryColorId,pal.secondary);
    const tertiary = rgb(dna?.patternColorId,pal.accent), eye = rgb(dna?.eyeColorId,pal.accent), core = rgb(dna?.coreColorId,pal.accent);
    const palette: Palette = { primary, secondary, tertiary, eye, core };
    const local = new T.Matrix4().copy(this.root.matrixWorld).invert();
    const materialPool = new Map<string,T.Material>();
    for (const mesh of meshes(this.root)) {
      if(!this.ownedGeometries.has(mesh.geometry))mesh.geometry = mesh.geometry.clone(); this.ownedGeometries.add(mesh.geometry);
      if(this.biped&&(mesh as T.SkinnedMesh).isSkinnedMesh&&/BODY_BASE/.test(mesh.name)){
        const index=(mesh as T.SkinnedMesh).skeleton.bones.findIndex(b=>b.name==="Body"),j=mesh.geometry.getAttribute("skinIndex"),w=mesh.geometry.getAttribute("skinWeight");
        if(index>=0&&j&&w)for(let i=0;i<j.count;i++){j.setXYZW(i,index,0,0,0);w.setXYZW(i,1,0,0,0);}
      }
      if(this.biped&&(mesh as T.SkinnedMesh).isSkinnedMesh){
        const limb=mesh.name.match(/(Front|Rear)_[LR]/)?.[0],skeleton=(mesh as T.SkinnedMesh).skeleton,j=mesh.geometry.getAttribute("skinIndex");
        if(limb&&j){const upper=skeleton.bones.findIndex(b=>b.name===limb),foot=skeleton.bones.findIndex(b=>b.name===limb+"_Foot");
          if(upper>=0)for(let i=0;i<j.count;i++)for(let k=0;k<4;k++){const old=j.getComponent(i,k);if(old!==upper&&old!==foot)j.setComponent(i,k,upper);}
        }
      }
      const blink = mesh.morphTargetDictionary?.Blink, breath = mesh.morphTargetDictionary?.Breath;
      if (blink !== undefined || breath !== undefined) this.morphs.push({mesh,blink,breath});
      if (!recolor) {
        const copies = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map(m => { const copy = m.clone(); this.ownedMaterials.add(copy); return copy; }); mesh.material = copies.length === 1 ? copies[0] : copies; continue;
      }
      const original = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const roles = original.map(m => roleName(m));
      const positions = mesh.geometry.getAttribute("position"), mask = genomeMask(mesh.geometry);
      const colors = new Float32Array(positions.count*3), matrix = local.clone().multiply(mesh.matrixWorld);
      const skinMorph = blink !== undefined ? mesh.geometry.morphAttributes.position?.[blink] : undefined;
      // Grupo de material é faixa do índice, não de vértice. Sem este mapa todo vértice herdava o primeiro material
      // e o olho inteiro (16 materiais) era pintado como pele.
      const roleOf = new Uint8Array(positions.count);
      if (roles.length > 1) {
        const index = mesh.geometry.index;
        for (const g of mesh.geometry.groups) {
          const slot = Math.min(g.materialIndex ?? 0, roles.length-1), end = g.start + g.count;
          if (index) for (let k=g.start;k<end&&k<index.count;k++) roleOf[index.getX(k)] = slot;
          else for (let k=g.start;k<end&&k<positions.count;k++) roleOf[k] = slot;
        }
      }
      const pattern = dna?.pattern.d ?? "PATTERN_NONE";
      for (let i=0;i<positions.count;i++) {
        const name = roles[roleOf[i]] ?? "BODY_PRIMARY";
        xyz.fromBufferAttribute(positions,i);
        if (skinMorph) { const delta = new T.Vector3().fromBufferAttribute(skinMorph,i); mesh.geometry.morphTargetsRelative ? xyz.add(delta) : xyz.copy(delta); }
        xyz.applyMatrix4(matrix);
        if (!paintRole(name,scratch,palette)) {
          scratch.copy(/SECONDARY/.test(name) ? secondary : primary);
          // Exported GENOME_MASK: normalize quantized channels before mixing the three inherited colors.
          if (mask) {
            const r=mask.getX(i),g=mask.getY(i),b=mask.getZ(i),sum=Math.max(.0001,r+g+b);
            scratch.setRGB((primary.r*r+secondary.r*g+tertiary.r*b)/sum,(primary.g*r+secondary.g*g+tertiary.g*b)/sum,(primary.b*r+secondary.b*g+tertiary.b*b)/sum);
          }
          scratch.lerp(tertiary,patternWeight(pattern,xyz)*.55);
        }
        colors.set([scratch.r,scratch.g,scratch.b],i*3);
      }
      mesh.geometry.setAttribute("color",new T.BufferAttribute(colors,3));
      const assignedMaterials = original.map((_old,slot) => {
        const name=roles[slot], skin=/BODY|TAIL/.test(name), glow=/IRIS/.test(name)&&!/LIMBAL/.test(name)?"iris":/CORE|ACCENT|Ember|[Ff]issure/.test(name)?"core":"";
        const fur=/FUR/.test(name);
        const key=`${fur}:${skin}:${glow}:${/CATCHLIGHT|HIGHLIGHT|Highlight/.test(name)}`;
        let m=materialPool.get(key);
        if (!m) { const mat=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:skin?.58:.42,metalness:0,side:T.DoubleSide});
          if(fur)mat.roughness=.96;
          if (skin&&!fur&&!this.input.chassis?.pattern.d.startsWith("PATTERN_FUR_")) { mat.normalMap=mapTexture(skinType(this.input),"Normal"); mat.normalScale.set(.48,.48); mat.roughnessMap=mapTexture(skinType(this.input),"Roughness"); }
          if (glow) { mat.emissive.copy(glow==="iris"?eye:core); mat.emissiveIntensity=glow==="iris"?.38:.28;mat.roughness=.25; }
          mat.name=key; m=mat;materialPool.set(key,m);this.ownedMaterials.add(m);
        } return m;
      });
      mesh.material = assignedMaterials.length === 1 ? assignedMaterials[0] : assignedMaterials;
      if ((mesh as T.SkinnedMesh).isSkinnedMesh && /Front_|Rear_|BODY_BASE/.test(mesh.name)) {
        const order=Array.from({length:positions.count},(_,i)=>i).sort((a,b)=>positions.getY(a)-positions.getY(b));
        this.contacts.push({mesh:mesh as T.SkinnedMesh,indices:order.slice(0,10)});
      }
      mesh.frustumCulled=false;
    }
    this.mergeRigidMeshes();
    if (this.modular) { this.root.scale.setScalar(this.growth.scale); const head=this.bones.get("Head"); if (head) head.scale.multiplyScalar(this.growth.head); }
    this.biped?.apply("IDLE",0,0,true);
    this.applyMaturation();
    this.root.updateMatrixWorld(true);
    this.bounds.setFromObject(this.root);
    this.restHeight=Math.max(.3,this.bounds.getSize(new T.Vector3()).y);
    const headBone=this.bones.get("Head"), hips=this.bones.get("Body")??this.bones.get("Root");
    if (headBone && hips) {
      const headPos=headBone.getWorldPosition(new T.Vector3()), hipPos=hips.getWorldPosition(new T.Vector3());
      this.canonicalForward=detectCanonicalForward({x:headPos.x,z:headPos.z},{x:hipPos.x,z:hipPos.z});
    }
    this.actor.rotation.y = this.input.teamSide ? battleActorYaw(this.canonicalForward, this.input.teamSide) : this.input.facing ?? -.25;
    this.plantOnGround();
    this.bounds.setFromObject(this.actor);
    this.makeAura(core);
    this.play(this.input.animationState ?? "IDLE",this.input.animationKey);
  }
  private plantOnGround() {
    this.actor.position.x=0; this.actor.position.z=0; this.actor.position.y=0;
    this.actor.updateMatrixWorld(true);
    let min=Infinity;
    if (this.footBones.length) {
      for (const bone of this.footBones) { if(this.biped&&bone.name.startsWith("Front"))continue;bone.getWorldPosition(xyz); min=Math.min(min,xyz.y); }
    } else if (this.contacts.length) {
      for (const {mesh,indices} of this.contacts) {
        if (!mesh.visible) continue; mesh.skeleton.update();
        for (const i of indices) { mesh.getVertexPosition(i,xyz); xyz.applyMatrix4(mesh.matrixWorld); min=Math.min(min,xyz.y); }
      }
    } else {
      this.bounds.setFromObject(this.actor); min=this.bounds.min.y;
    }
    if (!Number.isFinite(min)) min=0;
    this.groundOffset=battleGroundOffset(min,this.floating,this.restHeight);
    this.actor.position.y=this.groundOffset;
    this.actor.updateMatrixWorld(true);
  }
  private mergeRigidMeshes() {
    const groups=new Map<string,{parent:T.Object3D;material:T.Material;meshes:T.Mesh[]}>();
    for (const mesh of meshes(this.root)) {
      if ((mesh as T.SkinnedMesh).isSkinnedMesh || mesh.morphTargetInfluences || mesh.userData.articulatedJaw || !mesh.parent || !mesh.visible) continue;
      const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
      if (Array.isArray(mesh.material)&&mesh.material.length>1) continue;
      // Only siblings: do not merge across animated sockets or bones.
      const key=mesh.parent.uuid+material.uuid+Object.keys(mesh.geometry.attributes).sort().join();const group=groups.get(key)??{parent:mesh.parent,material,meshes:[]};group.meshes.push(mesh);groups.set(key,group);
    }
    for (const group of groups.values()) {
      if (group.meshes.length<2) continue;
      const geometries=group.meshes.map(m=>{const g=m.geometry.clone();g.applyMatrix4(m.matrix);return g;});
      const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;
      this.ownedGeometries.add(merged);const mesh=new T.Mesh(merged,group.material);mesh.name="Merged_"+group.parent.name;group.parent.add(mesh);group.meshes.forEach(m=>m.removeFromParent());
    }
  }
  private makeAura(color:T.Color) {
    const aura=this.input.chassis?.aura.d ?? this.input.aura; const count=contextQuality[this.input.context??"PROFILE"].aura;
    if(!aura||aura==="AURA_NONE"||aura==="NONE"||!count||this.input.reducedMotion)return;
    const pos=new Float32Array(count*3);for(let i=0;i<count;i++){const a=i/count*Math.PI*2;pos.set([Math.cos(a)*.42,.1+(i%6)*.07,Math.sin(a)*.50],i*3);}
    const g=new T.BufferGeometry();g.setAttribute("position",new T.BufferAttribute(pos,3));const m=new T.PointsMaterial({color,size:.016,transparent:true,opacity:.30,depthWrite:false});
    this.ownedGeometries.add(g);this.ownedMaterials.add(m);this.aura=new T.Points(g,m);this.actor.add(this.aura);
  }
  play(state:CreatureVisualState,key?:string|number) {
    if(this.state===state&&this.commandKey===key&&this.action)return;
    this.state=state;this.commandKey=key;this.stateAt=this.elapsed;
    let name=sourceClip[state];if(state==="HATCH")name="GXR_Roar";
    let clip=name?this.clips.get(name):undefined;
    if(!clip&&!this.modular)clip=[...this.clips.values()].find(c=>c.name.toLowerCase().includes(state.toLowerCase()));
    if(!clip)clip=this.clips.get("GXR_Idle")??[...this.clips.values()].find(c=>/idle/i.test(c.name));
    if(!clip)return;
    const next=this.mixer.clipAction(clip);const looping=["IDLE","BATTLE_IDLE","WALK","RUN","DEATH","KO","DEFEND","STATUS"].includes(state);
    if(next!==this.action){next.reset().setEffectiveWeight(1).setEffectiveTimeScale(state==="HATCH"?.75:1);next.setLoop(looping?T.LoopRepeat:T.LoopOnce,looping?Infinity:1);next.clampWhenFinished=true;next.play();if(this.action)next.crossFadeFrom(this.action,.2,false);this.action=next;}
    else if(!looping)next.reset().play();
  }
  update(dt:number) {
    this.elapsed+=Math.min(Math.max(dt,0),.10);
    for(const [bone,rest] of this.restBones){bone.position.copy(rest.position);bone.quaternion.copy(rest.quaternion);bone.scale.copy(rest.scale);}
    if(!this.input.reducedMotion)this.mixer.update(dt);
    const age=this.elapsed-this.stateAt,dead=this.state==="DEATH"||this.state==="KO";
    const jaw=mouthOpening(this.state,age,this.input.reducedMotion);this.mouth?.update(jaw);
    if(this.jawGroup)this.jawGroup.rotation.x=jawAngle(jaw);
    const life=sampleCreatureLife(this.elapsed,this.input.visualSeed??this.input.creatureId??JSON.stringify(this.input.chassis),this.input.lifeStage??this.input.chassis?.growthStage,this.input.temperament,this.input.reducedMotion);
    const head=this.bones.get("Head"),body=this.bones.get("Body"),tail=this.bones.get("Tail");
    if(this.modular) {
      if(this.biped){for(const [bone,rest] of this.restBones){bone.position.copy(rest.position);bone.quaternion.copy(rest.quaternion);bone.scale.copy(rest.scale);}this.root.updateMatrixWorld(true);this.biped.apply(this.state,this.elapsed,age,!!this.input.reducedMotion);}
      if(head){head.scale.setScalar(this.growth.head);head.rotateY(life.yaw);head.rotateX(life.pitch);}
      if(tail)tail.rotateY(life.tail);
      if(dead&&body){const w=smooth(age/1.1);body.rotateZ(-1.18*w);body.position.y-=.16*w;}
      if(this.state==="DEFEND"&&head)head.rotateX(.12*Math.sin(Math.min(age/1.1,1)*Math.PI)**2);
      if(this.state==="STATUS"&&head)head.rotateZ(.035*Math.sin(age*10)*Math.sin(Math.min(age/1.4,1)*Math.PI)**2);
      if((this.state==="DEFEND"&&age>1.1)||(this.state==="STATUS"&&age>1.4))this.play("IDLE");
    }
    this.applyMaturation();this.wings?.update(this.elapsed,this.state,!!this.input.reducedMotion);
    for(const b of this.morphs){if(!b.mesh.morphTargetInfluences)continue;if(b.breath!==undefined)b.mesh.morphTargetInfluences[b.breath]=dead?life.breath*(1-smooth(age/.8)):life.breath;if(b.blink!==undefined)b.mesh.morphTargetInfluences[b.blink]=dead?smooth(age/.75):life.blink;}
    if(this.aura){this.aura.rotation.y=this.elapsed*.08;(this.aura.material as T.PointsMaterial).opacity=dead?0:.24+.05*Math.sin(this.elapsed*.8);}
    this.plantOnGround();
    this.bounds.setFromObject(this.actor);
  }
  private applyMaturation(){
    if(!this.modular)return;
    const m=this.maturity;
    if(!this.biped){
      this.bones.get("Body")?.scale.multiply(new T.Vector3(1+.10*m,1+.14*m,1+.08*m));
      for(const region of ["Front","Rear"])for(const side of ["L","R"])this.bones.get(`${region}_${side}`)?.scale.multiply(new T.Vector3(1+.09*m,1+.17*m,1+.09*m));
    }
    for(const name of ["Socket_Horn_L","Socket_Horn_R"]){const socket=this.root.getObjectByName(name);socket?.scale.setScalar(.62+.48*m);}
  }
  dispose(){this.mouth?.dispose();this.mixer.stopAllAction();this.mixer.uncacheRoot(this.root);this.ownedGeometries.forEach(g=>g.dispose());this.ownedMaterials.forEach(m=>m.dispose());this.root.traverse(o=>{if((o as T.SkinnedMesh).isSkinnedMesh)(o as T.SkinnedMesh).skeleton.dispose();});this.actor.removeFromParent();}
}
