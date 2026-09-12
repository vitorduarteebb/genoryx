import {mkdir,writeFile} from "node:fs/promises";
import * as T from "three";
import {GLTFExporter} from "three/examples/jsm/exporters/GLTFExporter.js";
import {CreatureMouth,mouthProfiles} from "../src/lib/creature-mouth";
class Reader{result:ArrayBuffer|string|null=null;onloadend:(()=>void)|null=null;readAsArrayBuffer(b:Blob){void b.arrayBuffer().then(x=>{this.result=x;this.onloadend?.();});}readAsDataURL(b:Blob){void b.arrayBuffer().then(x=>{this.result=`data:${b.type};base64,${Buffer.from(x).toString("base64")}`;this.onloadend?.();});}}
Object.assign(globalThis,{FileReader:Reader});
async function main(){const out="apps/web/public/genoryx-art04/mouths";await mkdir(out,{recursive:true});const rows=[];
 for(const [head,profile] of Object.entries(mouthProfiles)){const mouth=new CreatureMouth(head,"EYES_03_AMBER",new T.Color("#73312c")),clip=mouth.exportClip();const b=await new GLTFExporter().parseAsync(mouth.group,{binary:true,animations:[clip]}) as ArrayBuffer;const file=`GXR_MOUTH_${profile.type}.glb`;await writeFile(`${out}/${file}`,Buffer.from(b));rows.push({head,type:profile.type,label:profile.label,file,teeth:mouth.teeth.length,bytes:b.byteLength,animation:clip.name});mouth.dispose();}
 await writeFile(`${out}/manifest.json`,JSON.stringify({version:1,space:"Socket_Head local; runtime projects lip line onto actual deformed head surface",rows},null,2));console.log(JSON.stringify(rows));}
void main().catch(e=>{console.error(e);process.exitCode=1;});
