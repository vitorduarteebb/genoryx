import * as T from "three";
/** Paired skeletal spars support curved, scalloped membranes. No genome mutation. */
export class CreatureWings {
 readonly meshes:T.Mesh[]=[];
 readonly materials:T.MeshStandardMaterial[]=[];
 private joints:T.Group[]=[];
 constructor(socket:T.Object3D,maturity:number){
  const membrane=new T.MeshStandardMaterial({color:"white",side:T.DoubleSide,roughness:.72});membrane.name="Art04_BODY";
  const spar=new T.MeshStandardMaterial({color:"white",roughness:.5});spar.name="Art04_HORN";
  this.materials.push(membrane,spar);
  const add=(parent:T.Object3D,g:T.BufferGeometry,m:T.MeshStandardMaterial,name:string)=>{const mesh=new T.Mesh(g,m);mesh.name=name;parent.add(mesh);this.meshes.push(mesh);};
  for(const side of [-1,1]){
   const joint=new T.Group();joint.name=`DevelopedWing_${side}`;joint.position.set(side*.10,.02,0);joint.scale.setScalar(.56+.44*maturity);socket.add(joint);this.joints.push(joint);
   const wrist=new T.Vector3(side*.31,.32,-.04);
   const tips=[new T.Vector3(side*.77,.56,-.06),new T.Vector3(side*.87,.32,-.25),new T.Vector3(side*.71,.12,-.43),new T.Vector3(side*.42,-.02,-.48),new T.Vector3(side*.08,-.03,-.31)];
   const tube=(points:T.Vector3[],radius:number,name:string)=>add(joint,new T.TubeGeometry(new T.CatmullRomCurve3(points),18,radius,7,false),spar,name);
   tube([new T.Vector3(),new T.Vector3(side*.16,.19,.02),wrist,tips[0]],.016,"Wing_LeadingArm");
   for(let k=0;k<tips.length;k++)tube([wrist,wrist.clone().lerp(tips[k],.55).add(new T.Vector3(0,.025,.035)),tips[k]],k===0?.010:.007,"Wing_Finger");
   for(let k=0;k<tips.length-1;k++){
    const pos:number[]=[],uv:number[]=[],colors:number[]=[],idx:number[]=[];const n=12;
    for(let r=0;r<=n;r++)for(let c=0;c<=n;c++){
     const u=c/n,v=r/n,edge=tips[k].clone().lerp(tips[k+1],u);
     edge.lerp(wrist,.15*Math.sin(Math.PI*u));
     const p=wrist.clone().lerp(edge,v);p.z+=.055*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
     pos.push(...p);uv.push(u,v);const secondary=.35+.50*v;colors.push(1-secondary,secondary,0);
     if(r<n&&c<n){const a=r*(n+1)+c;idx.push(a,a+1,a+n+1,a+1,a+n+2,a+n+1);}
    }
    const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));g.setAttribute("color",new T.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();add(joint,g,membrane,"Wing_Membrane");
   }
  }
 }
 update(time:number,state:string,reduced:boolean){
  const active=/CAST|VICTORY|ATTACK|CLAW/.test(state),dead=/DEATH|KO/.test(state);
  this.joints.forEach((joint,i)=>{const sign=i===0?-1:1;const flex=reduced||dead?0:Math.sin(time*(active?3.4:1.35))*(active?.13:.035);joint.rotation.z=sign*(.08+flex);joint.rotation.y=sign*(.20+(active?-.10:0));});
 }
}
