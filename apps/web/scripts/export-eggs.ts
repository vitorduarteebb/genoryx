import { mkdir,writeFile } from "node:fs/promises";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { EggVisualController } from "../src/lib/egg-visual-controller";
class NodeFileReader {
 result:ArrayBuffer|string|null=null;onloadend:(()=>void)|null=null;
 readAsArrayBuffer(blob:Blob){void blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}
 readAsDataURL(blob:Blob){void blob.arrayBuffer().then(b=>{this.result=`data:${blob.type};base64,${Buffer.from(b).toString("base64")}`;this.onloadend?.();});}
}
Object.assign(globalThis,{FileReader:NodeFileReader});
async function main(){
 const out=process.argv[2]??"apps/web/public/genoryx-art04/eggs";await mkdir(out,{recursive:true});const report=[];
 for(const grade of ["COMMON","REFINED","RARE","EXCEPTIONAL","GENESIS"]){
  const egg=new EggVisualController({hints:{eggId:`asset-${grade}`,genesisGrade:grade},motion:"still",progress:0});
  const animations=egg.exportClips();const data=await new GLTFExporter().parseAsync(egg.actor,{binary:true,animations,onlyVisible:false});
  const name=`GXR_EGG_${grade}.glb`;await writeFile(`${out}/${name}`,Buffer.from(data as ArrayBuffer));
  report.push({grade,style:egg.style,file:name,bytes:(data as ArrayBuffer).byteLength,shards:egg.shards.length,clips:animations.map(c=>({name:c.name,duration:c.duration}))});egg.dispose();
 }
 await writeFile(`${out}/manifest.json`,JSON.stringify({version:1,units:"meters",up:"Y",source:"EggVisualController",serverGenetics:"unchanged; public grade controls shell style",assets:report},null,2));console.log(JSON.stringify(report));
}
void main().catch(e=>{console.error(e);process.exitCode=1;});
