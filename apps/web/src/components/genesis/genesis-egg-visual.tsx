"use client";
import { useEffect,useRef,useState } from "react";
import type { PublicEggHints } from "../../lib/genesis-presentation";
import type { EggMotion } from "../../lib/egg-visual-controller";
import type { mountCreaturePreview } from "../../lib/creature-preview-renderer";
import { useReducedMotion } from "./use-reduced-motion";
export type { EggMotion } from "../../lib/egg-visual-controller";
export function GenesisEggVisual({hints={},progress=0,motion="incubating",size=210}: {
  hints?:PublicEggHints;progress?:number;motion?:EggMotion;imageUrl?:string|null;size?:number;
}) {
  const canvas=useRef<HTMLCanvasElement>(null),handle=useRef<ReturnType<typeof mountCreaturePreview>|null>(null),reduced=useReducedMotion();
  const [status,setStatus]=useState("loading"),current=useRef({hints,progress,motion,reducedMotion:reduced});current.current={hints,progress,motion,reducedMotion:reduced};
  const identity=JSON.stringify(hints);
  useEffect(()=>{let disposed=false;setStatus("loading");
    void import("../../lib/creature-preview-renderer").then(({mountCreaturePreview})=>{
      if(disposed||!canvas.current)return;
      handle.current=mountCreaturePreview(canvas.current,{egg:current.current,context:size>250?"HATCH":"MARKET",reducedMotion:reduced},()=>{if(!disposed)setStatus("ready");},()=>{if(!disposed)setStatus("error");});
    }).catch(()=>{if(!disposed)setStatus("error");});
    return()=>{disposed=true;handle.current?.dispose();handle.current=null;};
  },[identity,reduced,size]);
  useEffect(()=>handle.current?.configure({egg:current.current}),[motion,progress]);
  return <div data-egg-motion={motion} data-egg-status={status} style={{position:"relative",width:size,maxWidth:"100%",aspectRatio:"1"}}>
    <span aria-hidden style={{position:"absolute",left:"25%",bottom:"12%",width:"50%",height:"8%",background:"radial-gradient(ellipse,#0008,transparent 70%)"}} />
    <canvas ref={canvas} role="img" aria-label={motion==="burst"?"Eclosão do ovo Genesis em 3D":"Ovo Genesis em 3D"} style={{position:"relative",width:"100%",height:"100%",display:"block"}} />
    {status==="error"?<span role="status" style={{position:"absolute",inset:0,display:"grid",placeItems:"center",fontSize:12}}>Prévia 3D indisponível</span>:null}
  </div>;
}
