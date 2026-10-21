import * as T from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { headPoint } from "./creature-anatomy";

export const jawAngle=(open:number)=>Math.max(0,Math.min(1,open))*.19;
export const jawHinge=(head:string,eyes:string)=>new T.Vector3(...headPoint(0,-.194,.075,head,eyes));

/** Clip every intersecting triangle: upper and lower surfaces share a closed
 * seam at rest but no triangle stretches across the opening. All UV/color
 * channels are interpolated, keeping the genetic material masks intact. */
export function splitJawSurface(source:T.BufferGeometry,toSocket:T.Matrix4){
 const names=Object.keys(source.attributes),sizes=names.map(n=>source.getAttribute(n).itemSize);
 const offsets:number[]=[];let stride=0;for(const size of sizes){offsets.push(stride);stride+=size;}
 const posOffset=offsets[names.indexOf("position")],p=source.getAttribute("position");
 type Vertex={values:number[];point:T.Vector3;side:number};
 const vertex=(i:number):Vertex=>{
  const values:number[]=[];names.forEach(n=>{const a=source.getAttribute(n);for(let j=0;j<a.itemSize;j++)values.push(a.getComponent(i,j));});
  const point=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(toSocket);
  return {values,point,side:point.y+.194};
 };
 const upper:number[]=[],lower:number[]=[],seam:T.Vector3[]=[];
 const mix=(a:Vertex,b:Vertex)=>{const t=a.side/(a.side-b.side),point=a.point.clone().lerp(b.point,t);seam.push(point);return {values:a.values.map((v,i)=>T.MathUtils.lerp(v,b.values[i],t)),point,side:0};};
 const clip=(tri:Vertex[],positive:boolean)=>{
  const out:Vertex[]=[];for(let i=0;i<3;i++){
   const a=tri[i],b=tri[(i+1)%3],inside=positive?a.side>=0:a.side<=0,next=positive?b.side>=0:b.side<=0;
   if(inside)out.push(a);if(inside!==next)out.push(mix(a,b));
  }return out;
 };
 const index=source.index,count=index?.count??p.count;
 for(let i=0;i<count;i+=3){const tri=[0,1,2].map(k=>vertex(index?index.getX(i+k):i+k));
  for(const [positive,dest] of [[true,upper],[false,lower]] as const){const polygon=clip(tri,positive);for(let j=1;j<polygon.length-1;j++)for(const v of [polygon[0],polygon[j],polygon[j+1]])dest.push(...v.values);}
 }
 const geometry=(values:number[])=>{const g=new T.BufferGeometry();names.forEach((name,k)=>{const data:number[]=[];for(let i=0;i<values.length;i+=stride)for(let j=0;j<sizes[k];j++)data.push(values[i+offsets[k]+j]);g.setAttribute(name,new T.Float32BufferAttribute(data,sizes[k]));});const welded=mergeVertices(g,1e-5);g.dispose();welded.computeVertexNormals();return welded;};
 const unique=[...new Map(seam.map(p=>[`${p.x.toFixed(5)},${p.z.toFixed(5)}`,p])).values()];
 const center=unique.reduce((a,p)=>a.add(p),new T.Vector3()).divideScalar(Math.max(1,unique.length));
 unique.sort((a,b)=>Math.atan2(a.z-center.z,a.x-center.x)-Math.atan2(b.z-center.z,b.x-center.x));
 return {upper:geometry(upper),lower:geometry(lower),seam:unique};
}
