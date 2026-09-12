import * as T from "three";
import { frameBattleCamera, isLevitatingPlan } from "@nexora/game-engine";
import { CreatureVisualController } from "./creature-visual-controller";
import { EggVisualController } from "./egg-visual-controller";
import { contextQuality, type CreatureVisualInput, type CreatureVisualState } from "./creature-visual-contract";

type Entry = { canvas:HTMLCanvasElement; input:CreatureVisualInput; visible:boolean; disposed:boolean; busy:boolean; controller?:CreatureVisualController|EggVisualController; scene:T.Scene;camera:T.PerspectiveCamera;last:number; rendered:boolean; onReady:()=>void;onError:(message:string)=>void; observer?:IntersectionObserver; resize?:ResizeObserver; };
const entries = new Set<Entry>();let renderer:T.WebGLRenderer|undefined,frame=0,cleanupTimer:ReturnType<typeof setTimeout>|undefined;
export const creaturePreviewStats = { contexts:0, active:0, visible:0, queued:0, frames:0, drawCalls:0, triangles:0, lastFrameMs:0, maximumFrameMs:0 };
function sharedRenderer() {
  if(renderer)return renderer;
  renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:false,powerPreference:"low-power"});
  renderer.setPixelRatio(1);renderer.setClearColor(0x000000,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.outputColorSpace=T.SRGBColorSpace;creaturePreviewStats.contexts=1;return renderer;
}
function sceneFor(input:CreatureVisualInput) {
  const scene=new T.Scene();scene.add(new T.HemisphereLight(0xe8f2ff,0x2a2438,.92));
  const key=new T.DirectionalLight(0xfff1dd,2.15);key.position.set(-2,3,4);scene.add(key);
  const fill=new T.DirectionalLight(0x91caff,.95);fill.position.set(3,1,-2);scene.add(fill);
  const camera=new T.PerspectiveCamera(31,1,.025,40);camera.position.set(1.7,1.02,2.6);camera.lookAt(0,.38,0);
  return {scene,camera};
}
async function ensureLoaded(entry:Entry) {
  if(entry.controller||entry.busy||entry.disposed)return;entry.busy=true;
  try { const controller=entry.input.egg?new EggVisualController(entry.input.egg):await CreatureVisualController.create(entry.input);
    if(entry.disposed){controller.dispose();return;}entry.controller=controller;entry.scene.add(controller.actor);
    controller.update(0);const box=controller.bounds,size=box.getSize(new T.Vector3());
    const context=entry.input.context??"PROFILE", full=context==="PROFILE"||context==="HATCH";
    if (context==="BATTLE" && controller instanceof CreatureVisualController) {
      const framed=frameBattleCamera({height:Math.max(.35,size.y),span:Math.max(size.x,size.z,.4),levitating:isLevitatingPlan(entry.input.bodyPlan)});
      entry.camera.fov=framed.fovDeg;entry.camera.position.set(framed.position.x,framed.position.y,framed.position.z);
      entry.camera.lookAt(framed.target.x,framed.target.y,framed.target.z);
    } else {
      // Keep stage sizes comparable instead of fitting babies back to adult size.
      const h=Math.max(.8,size.y),span=Math.max(1.05,size.x,size.z),distance=Math.max(h,span)*(entry.input.egg?1.75:1.83);
      entry.camera.position.set(distance*.50,h*.70,distance*.86);entry.camera.lookAt(0,h*.45,0);
      if(full)entry.camera.position.multiplyScalar(.96);
    }
    entry.last=performance.now()-100;entry.onReady();wake();
  } catch(e){if(!entry.disposed){entry.visible=false; console.error("Creature preview failed",e);entry.onError(e instanceof Error?e.message:"Não foi possível abrir o modelo");}}finally{entry.busy=false;}
}
function wake(){if(!frame)frame=requestAnimationFrame(tick);}
function tick(now:number) {
  frame=0;if(document.hidden)return;
  const started=performance.now();creaturePreviewStats.active=entries.size;
  const visible=[...entries].filter(e=>e.visible&&!e.disposed);creaturePreviewStats.visible=visible.length;
  const pending=[...entries].filter(e=>e.busy).length;
  const needed=visible.filter(e=>!e.controller&&!e.busy).slice(0,Math.max(0,2-pending));needed.forEach(e=>void ensureLoaded(e));
  const ready=visible.filter(e=>e.controller&&(!e.input.reducedMotion||!e.rendered)&&now-e.last>=1000/contextQuality[e.input.context??"PROFILE"].fps);
  // Fair scheduling: overdue views first, at most two GPU draws per animation frame.
  ready.sort((a,b)=>(now-b.last)*contextQuality[b.input.context??"PROFILE"].fps-(now-a.last)*contextQuality[a.input.context??"PROFILE"].fps);
  creaturePreviewStats.queued=ready.length;
  for(const entry of ready.slice(0,2)) {
    const controller=entry.controller!;const quality=contextQuality[entry.input.context??"PROFILE"];
    const pixels=Math.min(quality.pixels,Math.max(96,Math.round((entry.canvas.clientWidth||240)*Math.min(devicePixelRatio,1.5))));
    const gl=sharedRenderer();gl.setSize(pixels,pixels,false);entry.camera.aspect=1;entry.camera.updateProjectionMatrix();
    controller.update(Math.min(.1,(now-entry.last)/1000));entry.last=now;
    gl.render(entry.scene,entry.camera);
    if(entry.canvas.width!==pixels||entry.canvas.height!==pixels){entry.canvas.width=pixels;entry.canvas.height=pixels;}
    const ctx=entry.canvas.getContext("2d");ctx?.clearRect(0,0,pixels,pixels);ctx?.drawImage(gl.domElement,0,0,pixels,pixels);
    entry.rendered=true;creaturePreviewStats.frames++;creaturePreviewStats.drawCalls=gl.info.render.calls;creaturePreviewStats.triangles=gl.info.render.triangles;
  }
  const cost=performance.now()-started;creaturePreviewStats.lastFrameMs=cost;creaturePreviewStats.maximumFrameMs=Math.max(creaturePreviewStats.maximumFrameMs,cost);
  if(visible.some(e=>!e.input.reducedMotion||!e.rendered))wake();
}
if(typeof document!=="undefined")document.addEventListener("visibilitychange",()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{for(const e of entries)e.last=performance.now();wake();}});
export function mountCreaturePreview(canvas:HTMLCanvasElement,input:CreatureVisualInput,onReady:()=>void,onError:(message:string)=>void) {
  clearTimeout(cleanupTimer);const setup=sceneFor(input);const entry:Entry={canvas,input,...setup,visible:false,disposed:false,busy:false,last:performance.now(),rendered:false,onReady,onError};entries.add(entry);
  entry.observer=new IntersectionObserver(rows=>{entry.visible=!!rows[0]?.isIntersecting;entry.last=performance.now()-100;if(entry.visible)wake();},{rootMargin:"40px",threshold:.01});entry.observer.observe(canvas);
  entry.resize=new ResizeObserver(()=>{entry.rendered=false;if(entry.visible)wake();});entry.resize.observe(canvas);
  return {
    play(state:CreatureVisualState,key?:string|number){entry.input.animationState=state;entry.input.animationKey=key;if(entry.controller instanceof CreatureVisualController)entry.controller.play(state,key);entry.rendered=false;wake();},
    configure(input:CreatureVisualInput){entry.input={...entry.input,...input};if(entry.controller instanceof EggVisualController&&entry.input.egg)entry.controller.configure(entry.input.egg);entry.rendered=false;wake();},
    dispose(){entry.disposed=true;entries.delete(entry);entry.observer?.disconnect();entry.resize?.disconnect();entry.controller?.dispose();
      if(!entries.size){cancelAnimationFrame(frame);frame=0;cleanupTimer=setTimeout(()=>{if(!entries.size){renderer?.dispose();renderer?.forceContextLoss();renderer=undefined;creaturePreviewStats.contexts=0;}},1500);}
    },
  };
}
