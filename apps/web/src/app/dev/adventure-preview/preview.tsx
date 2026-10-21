"use client";
import {captureZones,getCaptureZone} from "@nexora/config";
import { useEffect,useRef,useState } from "react";
import { createAdventureWorld,type AdventureWorld,type AdventureHudState } from "../../../lib/adventure-world";
import { emberBabyChassis } from "../../../lib/adventure-chassis";
export function AdventurePreview(){
 const canvas=useRef<HTMLCanvasElement>(null),mini=useRef<HTMLCanvasElement>(null),world=useRef<AdventureWorld|null>(null);
 const [hud,setHud]=useState<AdventureHudState|null>(null);
 const [place,setPlace]=useState("plaza");
 const places:Record<string,{area:"haven"|"verdantis";x:number;z:number;label:string}>={plaza:{area:"haven",x:0,z:4.6,label:"Praça"},market:{area:"haven",x:0,z:-6,label:"Mercado"},village:{area:"haven",x:-8,z:4,label:"Vila"},garden:{area:"haven",x:7,z:5,label:"Jardins"},camp:{area:"verdantis",x:-5,z:18,label:"Acampamento"},ruins:{area:"verdantis",x:5,z:23,label:"Ruínas"}};
 for(const zone of captureZones)places[zone.id]={area:"verdantis",x:zone.x,z:zone.z-1,label:zone.name};
 const habitat=getCaptureZone(hud?.nearby?.zoneId);
 useEffect(()=>{if(!canvas.current)return;const p=places[place];world.current=createAdventureWorld(canvas.current,{startArea:p.area,startAt:p,companion:{chassis:emberBabyChassis(),lifeStage:"BABY"},onHud:setHud,onToast:()=>{},minimap:mini.current});return()=>world.current?.dispose();},[place]);
 return <main style={{position:"fixed",inset:0,background:"#101c1a"}}><canvas aria-label="Mundo GENORYX" ref={canvas} style={{width:"100%",height:"100%"}} onPointerDown={e=>world.current?.tap(e.clientX,e.clientY)}/><nav style={{position:"absolute",top:20,left:24,padding:14,background:"#102320ed",border:"1px solid #879d7355",borderRadius:12,color:"#eee8cc"}}><strong>{hud?.region??"Carregando mundo…"}</strong><div><select aria-label="Local da prévia" value={place} onChange={e=>setPlace(e.target.value)} style={{background:"#18312e",color:"#e9dec0",padding:4,borderRadius:5}}>{Object.entries(places).map(([key,p])=><option key={key} value={key}>{p.label}</option>)}</select> <a href="/dev/tamer-preview">Personalizar treinador</a></div><p style={{fontSize:12}}>WASD ou clique para caminhar</p><button onClick={()=>world.current?.travel("haven")}>Haven</button> <button onClick={()=>world.current?.travel("verdantis")}>Verdantis</button></nav><canvas aria-label="Minimapa" ref={mini} width={240} height={240} style={{position:"absolute",right:24,top:24,width:180,height:180,borderRadius:16,border:"1px solid #a9b68d88"}}/>{habitat?<aside style={{position:"absolute",bottom:24,left:24,maxWidth:440,padding:18,borderRadius:14,background:"#101c24ed",color:"#eee8d6",border:`1px solid ${habitat.color}`}}><strong style={{color:habitat.color}}>{habitat.name}</strong><p>{habitat.label} · níveis {habitat.minLevel}–{habitat.maxLevel}</p><p>Equipe recomendada: nível {habitat.recommendedLevel}</p><p>{habitat.description}</p><small>No jogo, aproxime-se do marco para buscar um encontro e capturar durante o combate.</small></aside>:null}</main>;
}


