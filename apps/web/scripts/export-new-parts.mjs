import * as T from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {readFile,writeFile} from 'node:fs/promises';
class Reader { readAsArrayBuffer(b){b.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});} }
globalThis.FileReader=Reader;
const root='apps/web/public/genoryx-art04';
const manifest=JSON.parse(await readFile(`${root}/manifest.json`,'utf8'));
const catalog={horns:['HORNS_06_ANTLERS','HORNS_07_SABER','HORNS_08_CORAL'],back:['BACK_06_SAIL','BACK_07_PETALS','BACK_08_SHIELDS'],tail:['TAIL_06_CLUB','TAIL_07_FAN','TAIL_08_FORKED']};
const labels=['Galhada ancestral','Sabres recurvados','Coroa coralina','Vela dorsal','Pétalas laminadas','Escudos sobrepostos','Cauda de clava','Cauda de leque','Cauda bifurcada'];
function material(name){const m=new T.MeshStandardMaterial({color:0xffffff,roughness:.48});m.name=name;return m;}
const mats={horn:material('HORN_Keratin'),back:material('BACK_Scute'),skin:material('BODY_PRIMARY'),accent:material('CORE_ACCENT')};
function mesh(g,geo,mat){const m=new T.Mesh(geo,mat);m.name=mat.name;g.add(m);return m;}
function ell(g,p,s,mat){const m=mesh(g,new T.SphereGeometry(1,12,8),mat);m.position.set(...p);m.scale.set(...s);return m;}
// Tapered organic tubes; curved centerline and continuous normals, closed ends.
function branch(g,points,r,mat){const c=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),geo=new T.TubeGeometry(c,16,r,8,false),a=geo.getAttribute('position');for(let i=0;i<=16;i++){const center=c.getPointAt(i/16), taper=Math.max(.015,Math.pow(1-i/16,.7));for(let j=0;j<=8;j++){const k=i*9+j,v=new T.Vector3().fromBufferAttribute(a,k).sub(center).multiplyScalar(taper).add(center);a.setXYZ(k,v.x,v.y,v.z);}}geo.computeVertexNormals();mesh(g,geo,mat);ell(g,points[0],[r,r,r],mat);}
function blade(g,start,end,width,mat){const a=new T.Vector3(...start),b=new T.Vector3(...end),mid=a.clone().lerp(b,.48),side=new T.Vector3(width,0,0),ridge=mid.clone().add(new T.Vector3(0,.026,.014));const pts=[a,mid.clone().add(side),b,mid.clone().sub(side),ridge];const geo=new T.BufferGeometry().setFromPoints(pts);geo.setIndex([0,1,4,1,2,4,2,3,4,3,0,4,0,3,2,0,2,1]);geo.computeVertexNormals();mesh(g,geo,mat);}
function make(slot,n,side=1){const g=new T.Group();
 if(slot==='horns'){
 ell(g,[0,0,0],[.055,.028,.052],mats.skin);
 if(n===0){branch(g,[[0,0,0],[side*.025,.13,-.04],[side*.08,.28,-.10],[side*.10,.36,-.17]],.037,mats.horn);for(let k=0;k<3;k++)branch(g,[[side*.02,.09+k*.065,-.02-k*.035],[side*(.085+k*.018),.16+k*.065,.005-k*.04],[side*(.11+k*.023),.21+k*.065,-.02-k*.035]],.019,mats.horn);}
 if(n===1){branch(g,[[0,0,0],[side*.07,.10,-.015],[side*.13,.16,.045],[side*.10,.24,.14],[side*.04,.32,.16]],.048,mats.horn);for(let k=0;k<4;k++)ell(g,[side*.017*k,.022+k*.022,-.004],[.046-k*.004,.009,.043-k*.004],mats.horn);}
 if(n===2){for(let k=0;k<4;k++){const x=(k-1.5)*.033;branch(g,[[0,0,0],[x,.08,-.025],[x*1.5,.16+(k%2)*.06,-.07]],.024,mats.horn);branch(g,[[x,.085,-.025],[x+side*.04,.12,-.015],[x+side*.055,.17,-.035]],.012,mats.horn);}}
 }else if(slot==='back'){
 for(let k=0;k<5;k++){const z=.12-k*.085;
 ell(g,[0,-.015,z],[.08,.026,.055],mats.skin);
 if(n===0){blade(g,[0,0,z+.04],[0,.22+Math.sin(k/4*Math.PI)*.12,z-.075],.025,mats.back);branch(g,[[0,.005,z],[0,.12,z-.02],[0,.23+Math.sin(k/4*Math.PI)*.11,z-.075]],.012,mats.horn);}
 if(n===1)for(const s of [-1,1]){blade(g,[0,0,z],[s*.17,.13,z-.12],.055,mats.back);blade(g,[s*.06,.04,z-.035],[s*.13,.12,z-.10],.014,mats.accent);}
 if(n===2){ell(g,[0,.012,z],[.15,.055,.075],mats.back);blade(g,[0,.04,z+.05],[0,.16,z-.055],.042,mats.horn);}}
 }else{
 branch(g,[[0,0,0],[0,-.035,-.12],[.02,.015,-.26],[.02,.085,-.40]],.072,mats.skin);
 if(n===0){ell(g,[.02,.075,-.36],[.11,.10,.13],mats.back);for(const s of [-1,1])for(let k=0;k<3;k++)branch(g,[[s*.065,.075,-.30-k*.045],[s*.13,.11,-.32-k*.045],[s*.16,.12,-.34-k*.045]],.026,mats.horn);}
 if(n===1)for(let k=-3;k<=3;k++){blade(g,[.02,.06,-.31],[k*.065,.14+Math.abs(k)*.018,-.53+Math.abs(k)*.02],.038,mats.back);branch(g,[[.02,.06,-.31],[k*.032,.10,-.41],[k*.065,.14+Math.abs(k)*.018,-.53+Math.abs(k)*.02]],.009,mats.horn);}
 if(n===2)for(const s of [-1,1]){branch(g,[[.02,.045,-.30],[s*.075,.08,-.40],[s*.12,.18,-.50],[s*.09,.25,-.51]],.037,mats.skin);ell(g,[s*.10,.22,-.51],[.023,.04,.025],mats.accent);}
 }if(slot==='back'){for(const child of g.children){child.position.y-=.065;child.position.z+=.14;}}return g;}
let label=0;const rows=[];
for(const [slot,ids] of Object.entries(catalog))for(let n=0;n<ids.length;n++){
 const gene=ids[n],id=`GXR_${gene}`,name=labels[label++];manifest.serverGeneMapping[slot][gene]=id;
 for(const side of slot==='horns'?[-1,1]:[1]){const key=id+(slot==='horns'?(side===-1?'_L':'_R'):''),g=make(slot,n,side);g.name=key;const data=await new GLTFExporter().parseAsync(g,{binary:true});await writeFile(`${root}/parts/${key}.glb`,Buffer.from(data));let triangles=0,meshes=0;g.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});manifest.assets[key]={id:key,category:slot,label:name,url:`/genoryx-art04/parts/${key}.glb`,bytes:data.byteLength,triangles,meshes};rows.push({gene,key,name,triangles});}
}
await writeFile(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
let config=await readFile('packages/config/src/chassis.ts','utf8');for(const [slot,ids] of Object.entries(catalog)){const array='chassis'+({horns:'Horns',back:'Backs',tail:'Tails'}[slot]);config=config.replace(new RegExp(`(export const ${array} = \\[)([\\s\\S]*?)(\\] as const;)`),(all,a,b,c)=>a+b+ids.filter(id=>!b.includes(id)).map(id=>`  "${id}",\n`).join('')+c);}await writeFile('packages/config/src/chassis.ts',config);await writeFile(`${root}/new-parts.json`,JSON.stringify(rows,null,2)+'\n');console.log(rows);
