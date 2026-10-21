import * as T from "three";
import { parseCharacterAppearance,characterSkinToneRgb,characterHairColorRgb } from "@nexora/config";
import { DIRS,dirAngle,type IsoDir } from "../iso/projection";
import { groundPixelOffset,paintGroundShadow } from "./sprite-contact";

export function createTamerModel(coatColor?:string,appearance?:unknown,role?:string){
 const a=parseCharacterAppearance(appearance);
 const color=(rgb:number[])=>"#"+rgb.map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("");
 const coats:Record<string,string>={chest_01:"#225967",chest_02:"#694783",chest_novice_tamer:"#326e79",chest_field_explorer:"#4d7044",chest_genesis_researcher:"#dde3d8",chest_breeder:"#956d57",chest_adventurer:"#9b4840"};
 coatColor??=coats[a.chestId];
 const root=new T.Group(),materials:T.Material[]=[],geometries:T.BufferGeometry[]=[];
 const mat=(color:string,roughness=.75)=>{const m=new T.MeshStandardMaterial({color,roughness});materials.push(m);return m;};
 const coat=mat(coatColor),leather=mat("#382e2b"),boots=mat(a.bootsId.includes("reinforced")?"#1a2228":a.bootsId.includes("leather")?"#3a2a22":"#202b31"),skin=mat(color(characterSkinToneRgb[a.skinTone])),gold=mat("#d7b86d",.4),hair=mat(color(characterHairColorRgb[a.hairColor])),white=mat("#e0dfce"),black=mat("#1d272b"),pants=mat(a.legsId.includes("genesis")?"#4a5a62":a.legsId.includes("breeder")?"#6a5344":a.legsId.includes("reinforced")?"#2e3840":"#3a454c");
 const add=(parent:T.Object3D,g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0)=>{geometries.push(g);const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;};
 const ell=(x:number,y:number,z:number)=>new T.SphereGeometry(1,16,12).scale(x,y,z);
 const torso=new T.Group();torso.position.y=.78;root.add(torso);
 add(torso,new T.CylinderGeometry(.23,.18,.47,12),coat,0,.17,0);
 add(torso,new T.CylinderGeometry(.19,.24,.24,12),coat,0,-.16,0);
 add(torso,new T.CylinderGeometry(.194,.194,.055,12),leather,0,-.05,0);
 add(torso,new T.BoxGeometry(.075,.065,.032),gold,0,-.05,.192);
 for(let i=0;i<4;i++)add(torso,ell(.009,.009,.006),gold,.018,.08+i*.07,.217-i*.006);
 add(torso,new T.TorusGeometry(.186,.008,5,24),gold,0,-.08,0).rotation.x=Math.PI/2;
 add(torso,ell(.245,.055,.16),leather,0,.39,0);
 add(torso,new T.BoxGeometry(.056,.40,.032),leather,-.065,.17,.187).rotation.z=-.32;
 add(torso,ell(.05,.06,.024),gold,.13,.26,.18);
 add(torso,ell(.026,.035,.025),mat("#53d7cb",.3),.13,.265,.20);
 if(a.backId!=="back_none"||role==="MERCHANT"||role==="ADVENTURER")add(torso,ell(.14,.18,.09),leather,0,.12,-.20);
 const cape=a.capeId!=="cape_none"||role==="RESEARCHER"?add(torso,new T.CylinderGeometry(.17,.30,a.capeId==="cape_genesis_mantle"?.64:.45,12,1,true,Math.PI*.5,Math.PI),coat,0,.02,-.06):undefined;
 if(role==="MERCHANT"){add(torso,ell(.12,.15,.075),gold,-.22,-.10,.02);add(torso,new T.BoxGeometry(.25,.14,.035),leather,0,.1,.20);}
 if(role==="GUARD"){add(torso,new T.SphereGeometry(.25,12,8,0,Math.PI*2,0,Math.PI*.5),boots,0,.22,0);add(root,new T.CylinderGeometry(.02,.025,1.35,8),leather,.42,.68,.05);add(root,new T.ConeGeometry(.07,.18,8),gold,.42,1.4,.05);}
 if(role==="RESEARCHER"||role==="BREEDER")add(torso,new T.BoxGeometry(.20,.26,.035),white,0,.17,.20);
 const head=new T.Group();head.position.y=1.32;root.add(head);
 add(head,ell(.073,.10,.075),skin,0,-.12,0);
 add(head,ell(a.faceId==="face_02"?.18:a.faceId==="face_03"?.145:.163,a.faceId==="face_04"?.21:.19,.145),skin,0,.035,0);
 add(head,new T.SphereGeometry(.175,16,12,0,Math.PI*2,0,Math.PI*.55),hair,0,.075,-.01);
 for(let i=0;i<5;i++)add(head,ell(.036,.044,.065),hair,-.105+i*.05,.142-(i%2)*.012,.09).rotation.z=-.28;
 if(/messy|hair_02|curly/.test(a.hairId))for(let i=0;i<9;i++)add(head,ell(.05,.055,.06),hair,Math.cos(i*2.4)*.13,.18+Math.sin(i)*.02,Math.sin(i*2.4)*.1);
 if(/tied|long|medium/.test(a.hairId))add(head,ell(.10,a.hairId.includes("long")?.24:.14,.075),hair,0,-.03,-.15);
 if(a.beardId==="beard_short")add(head,ell(.11,.072,.06),hair,0,-.09,.095);
 if(role==="GUARD")add(head,new T.SphereGeometry(.19,16,10,0,Math.PI*2,0,Math.PI*.58),boots,0,.085,0);
 const pupils:T.Mesh[]=[];const irises:Record<string,string>={teal:"#36a6a4",brown:"#754627",blue:"#4794cf",green:"#6ea14a",gray:"#86979e",amber:"#dba33d",violet:"#9a62c4"};const iris=mat(irises[a.eyeColor]);
 for(const side of [-1,1]){
  add(head,ell(.035,.052,.028),skin,side*.155,.022,0);
  add(head,ell(.042,.023,.018),white,side*.063,.04,.129);
  pupils.push(add(head,ell(.017,.019,.012),iris,side*.062,.04,.144));add(head,ell(.008,.012,.007),black,side*.062,.04,.152);
  add(head,new T.BoxGeometry(.065,.014,.02),hair,side*.061,.08,.136).rotation.z=-side*.1;
 }
 add(head,ell(.025,.038,.036),skin,0,.003,.145);
 add(head,ell(.039,.008,.008),leather,0,-.062,.128);
 const legs:T.Group[]=[],arms:T.Group[]=[];
 for(const side of [-1,1]){
  const leg=new T.Group();leg.position.set(side*.115,.67,0);root.add(leg);legs.push(leg);
  add(leg,ell(.095,.19,.10),pants,0,-.14,0);
  add(leg,ell(.075,.175,.082),boots,0,-.40,0);
  add(leg,ell(.087,.07,.135),boots,0,-.605,.04);
  add(leg,ell(.09,.063,.10),a.legsId.includes("reinforced")?gold:leather,0,-.28,.033);
  const arm=new T.Group();arm.position.set(side*.25,1.06,0);root.add(arm);arms.push(arm);
  add(arm,new T.SphereGeometry(1,8,6).scale(.095,.055,.12),gold,0,0,0);
  add(arm,ell(.075,.15,.075),coat,side*.015,-.13,0);
  add(arm,ell(.065,.12,.065),leather,side*.025,-.31,.025);
  add(arm,ell(.061,.068,.055),a.glovesId==="gloves_none"?skin:leather,side*.025,-.425,.039);
  add(arm,new T.CylinderGeometry(.067,.069,.023,12),gold,side*.025,-.365,.03);
  for(let finger=0;finger<3;finger++)add(arm,ell(.015,.033,.024),a.glovesId==="gloves_none"?skin:leather,side*.025-.031+finger*.028,-.476,.051);
  add(arm,ell(.024,.038,.025),a.glovesId==="gloves_none"?skin:leather,side*.076,-.435,.07);
 }
 root.scale.x=a.bodyType==="body_a"?1.12:a.bodyType==="body_b"?.9:1;
 return {root,pose(phase:number,moving:boolean){
  const stride=moving?Math.sin(phase)*.38:0;
  torso.scale.y=1+(moving?0:Math.sin(phase)*.012);head.rotation.y=moving?0:Math.sin(phase)*.07;
  if(cape)cape.rotation.x=Math.sin(phase)*.06;
  pupils.forEach(p=>p.scale.y=!moving&&phase>5.65&&phase<6.05?.1:1);
  legs.forEach((leg,i)=>{const sign=i?1:-1;leg.rotation.x=stride*sign;leg.position.y=.67+(moving?Math.max(0,Math.sin(phase)*sign)*.035:0);});
  // Translate the model so the lowest boot stays on the same ground plane.
  root.position.y=0;root.updateMatrixWorld(true);const min=Math.min(...legs.map(leg=>new T.Box3().setFromObject(leg).min.y));root.position.y=-min;
  arms.forEach((arm,i)=>{arm.rotation.x=-stride*(i?1:-1)*.8;});torso.rotation.z=moving?Math.sin(phase)*.025:0;
 },dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}

export function bakeTamer(coatColor?:string,allDirections=true,appearance?:unknown,role?:string,previewScale=1){
 const model=createTamerModel(coatColor,appearance,role),scene=new T.Scene();scene.add(model.root);
 scene.add(new T.HemisphereLight("#fff4df","#314a53",2));const light=new T.DirectionalLight("#ffead0",2.7);light.position.set(-3,5,4);scene.add(light);
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(192*previewScale,296*previewScale,false);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
 const camera=new T.OrthographicCamera(-.68,.68,1.05,-1.05,.1,12);camera.position.set(3,2.7,3);camera.lookAt(0,.75,0);camera.updateMatrixWorld(true);
 const offset=groundPixelOffset(camera,96,148,{x:.5,y:.92});
 const atlas={} as Record<IsoDir,{idle:HTMLCanvasElement[];walk:HTMLCanvasElement[]}>;
 try{
  for(const dir of allDirections?DIRS:["S"] as const){
   model.root.rotation.y=dirAngle(dir);
   const frames=(moving:boolean)=>Array.from({length:moving?8:12},(_,i)=>{
    model.pose(i/(moving?8:12)*Math.PI*2,moving);renderer.render(scene,camera);
    const frame=document.createElement("canvas");frame.width=96*previewScale;frame.height=148*previewScale;const ctx=frame.getContext("2d")!;ctx.scale(previewScale,previewScale);
    paintGroundShadow(ctx,48,148*.92,17,5);ctx.drawImage(renderer.domElement,offset.x,offset.y,96,148);return frame;
   });
   atlas[dir]={idle:frames(false),walk:allDirections?frames(true):[]};
  }
  return atlas;
 }finally{model.dispose();renderer.dispose();renderer.forceContextLoss();}
}
