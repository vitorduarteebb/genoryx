"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./genesis/use-reduced-motion";
import { visualIdentity, type CreatureVisualInput } from "../lib/creature-visual-contract";
import type { mountCreaturePreview } from "../lib/creature-preview-renderer";

export type CreatureGxrFigureProps = CreatureVisualInput & { size?:number;className?:string;label?:string };
export function CreatureGxrFigure(props:CreatureGxrFigureProps) {
  const {size=220,className="",label="Criatura GENORYX",context=size>=300?"PROFILE":"MARKET",animationState="IDLE",animationKey}=props;
  const reducedMotion=useReducedMotion();const canvas=useRef<HTMLCanvasElement>(null);
  const handle=useRef<ReturnType<typeof mountCreaturePreview>|null>(null);const current=useRef(props);current.current=props;
  const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
  const identity=visualIdentity(props);
  const battle=context==="BATTLE";
  useEffect(()=>{
    let cancelled=false;setStatus("loading");
    void import("../lib/creature-preview-renderer").then(({mountCreaturePreview})=>{
      if(cancelled||!canvas.current)return;
      handle.current=mountCreaturePreview(canvas.current,{...current.current,context,reducedMotion:props.reducedMotion??reducedMotion},()=>{if(!cancelled)setStatus("ready");},()=>{if(!cancelled)setStatus("error");});
    }).catch(()=>{if(!cancelled)setStatus("error");});
    return()=>{cancelled=true;handle.current?.dispose();handle.current=null;};
  },[identity,context,reducedMotion,props.reducedMotion,props.facing,props.teamSide]);
  useEffect(()=>{handle.current?.play(animationState,animationKey);},[animationState,animationKey]);
  return <div className={`gx-gxr ${className}`} data-visual-context={context} data-visual-status={status} data-visual-state={animationState} data-team={props.teamSide??undefined}
    style={{position:"relative",display:"grid",placeItems:battle?"end center":"center",width:size,maxWidth:"100%",aspectRatio:"1",flexShrink:0,alignSelf:"end"}}>
    {battle?null:<span className="gx-gxr__shadow" aria-hidden style={{position:"absolute",width:"55%",height:"9%",bottom:"17%",borderRadius:"50%",background:"radial-gradient(ellipse,rgba(0,0,0,.36),transparent 72%)"}} />}
    <canvas ref={canvas} role="img" aria-label={label} style={{display:"block",position:"relative",width:"100%",height:"100%"}} />
    {status!=="ready"?<span role={status==="error"?"status":undefined} style={{position:"absolute",fontSize:10,letterSpacing:".12em",color:"#9ab8ba",textAlign:"center"}}>{status==="error"?"Prévia 3D indisponível":"Preparando criatura…"}</span>:null}
  </div>;
}
