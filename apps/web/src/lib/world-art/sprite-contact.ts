import * as T from "three";
/** Move the projected world origin onto the declared pixel foot pivot. */
export function groundPixelOffset(camera:T.Camera,width:number,height:number,anchor:{x:number;y:number}){
 camera.updateMatrixWorld(true);
 const p=new T.Vector3(0,0,0).project(camera);
 return {x:width*(anchor.x-(p.x+1)/2),y:height*(anchor.y-(1-p.y)/2)};
}
export function paintGroundShadow(ctx:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number){
 ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,"rgba(9,18,15,.46)");g.addColorStop(.5,"rgba(9,18,15,.24)");g.addColorStop(1,"rgba(9,18,15,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
}
