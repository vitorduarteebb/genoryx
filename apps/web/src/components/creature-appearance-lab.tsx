"use client";

import { chassisHorns,chassisBacks,chassisTails } from "@nexora/config";

import {furProfiles} from "../lib/creature-fur";

import { useState } from "react";

import { headProfiles,eyeProfiles } from "../lib/creature-anatomy";

import { CreatureGxrFigure } from "./creature-gxr-figure";

import { visualFixture } from "../lib/creature-visual-fixtures";

import { GenesisEggVisual,type EggMotion } from "./genesis/genesis-egg-visual";

import { GenesisReveal } from "./genesis/genesis-reveal";

import { mouthProfiles } from "../lib/creature-mouth";

export function CreatureAppearanceLab() {

 const [horns,setHorns]=useState("HORNS_NONE"),[back,setBack]=useState("BACK_NONE"),[tail,setTail]=useState("TAIL_02_CURVED");

 const [coat,setCoat]=useState("PATTERN_FUR_SHAGGY");

 const [roar,setRoar]=useState(0);

 const [head,setHead]=useState("HEAD_05_URSINE"),[eyes,setEyes]=useState("EYES_02_AZURE"),[eggMotion,setEggMotion]=useState<EggMotion>("incubating"),[hatch,setHatch]=useState(false),[replay,setReplay]=useState(0);

 const dna={...visualFixture(14),limbs:{d:"LIMBS_01_SOFT",r1:"LIMBS_01_SOFT",r2:"LIMBS_01_SOFT"},pattern:{d:coat,r1:coat,r2:coat},horns:{d:horns,r1:horns,r2:horns},back:{d:back,r1:back,r2:back},tail:{d:tail,r1:tail,r2:tail},head:{d:head,r1:head,r2:head},eyes:{d:eyes,r1:eyes,r2:eyes},primaryColorId:"bark",secondaryColorId:"bone",patternColorId:"magma",eyeColorId:"amber",coreColorId:"ember"};

 return <section style={{borderTop:"1px solid #39535e",marginTop:28,paddingTop:20}}>

  <h2 style={{fontSize:24}}>Cor, anatomia e ovos 3D</h2>

  <div style={{display:"flex",gap:20,flexWrap:"wrap",marginTop:16}}>
   <label>Pelagem <select aria-label="Pelagem" value={coat} onChange={e=>setCoat(e.target.value)}><option value="PATTERN_NONE">Pele lisa</option>{Object.entries(furProfiles).map(([id,p])=><option key={id} value={id}>{p.label}</option>)}</select></label>

   <label>Cabeça <select aria-label="Tipo de cabeça" value={head} onChange={e=>setHead(e.target.value)}>{Object.entries(headProfiles).map(([id,p])=><option key={id} value={id}>{p.label}</option>)}</select></label>

   <label>Olhos <select aria-label="Tipo de olhos" value={eyes} onChange={e=>setEyes(e.target.value)}>{Object.entries(eyeProfiles).map(([id,p])=><option key={id} value={id}>{p.label}</option>)}</select></label>

   <label>Chifres <select aria-label="Chifres" value={horns} onChange={e=>setHorns(e.target.value)}>{chassisHorns.map(id=><option key={id}>{id}</option>)}</select></label>

   <label>Dorsal <select aria-label="Dorsal" value={back} onChange={e=>setBack(e.target.value)}>{chassisBacks.map(id=><option key={id}>{id}</option>)}</select></label>

   <label>Cauda <select aria-label="Cauda" value={tail} onChange={e=>setTail(e.target.value)}>{chassisTails.map(id=><option key={id}>{id}</option>)}</select></label>

  </div>

  <div style={{display:"flex",justifyContent:"center"}}><CreatureGxrFigure chassis={dna} context="PROFILE" lifeStage="ADULT" size={500} animationState={roar?"CAST":"IDLE"} animationKey={roar}/></div>

  <button onClick={()=>setRoar(v=>v+1)} style={{marginBottom:16}}>Testar rugido e mandíbula</button>

  <h3 style={{fontSize:22,marginBottom:12}}>Quatro bocas com presas</h3>

  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:28}}>{Object.entries(mouthProfiles).map(([id,m])=><article key={id} style={{background:"#14232e",borderRadius:12,textAlign:"center",padding:8}}><CreatureGxrFigure chassis={{...dna,head:{d:id,r1:id,r2:id}}} context="CARD" size={230}/><p>{m.label}</p><small>{m.count*2} dentes · mandíbula animada</small><p><a href={`/genoryx-art04/mouths/GXR_MOUTH_${m.type}.glb`} download>Baixar boca GLB</a></p></article>)}</div>

  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:8}}>{["COMMON","REFINED","RARE","EXCEPTIONAL","GENESIS"].map(grade=><article key={`${grade}-${replay}`} style={{background:"radial-gradient(ellipse at center,#243e4a,#0b121c)",textAlign:"center",borderRadius:14}}><GenesisEggVisual hints={{eggId:`lab-${grade}`,genesisGrade:grade}} motion={eggMotion} size={250}/><p>{grade}</p><a href={`/genoryx-art04/eggs/GXR_EGG_${grade}.glb`} download style={{fontSize:12,color:"#7de1d8"}}>Baixar GLB animado</a></article>)}</div>

  <div style={{display:"flex",gap:12,marginTop:20,flexWrap:"wrap"}}><label>Fase do ovo <select aria-label="Fase do ovo" value={eggMotion} onChange={e=>setEggMotion(e.target.value as EggMotion)}>{["incubating","ready","pulse","crack","burst","still"].map(m=><option key={m}>{m}</option>)}</select></label><button onClick={()=>setReplay(x=>x+1)}>Repetir ovos</button><button onClick={()=>setHatch(v=>!v)}>Testar nascimento completo</button></div>

  {hatch?<GenesisReveal key={replay} payload={{creatureId:"lab-hatch",revealStatus:"READY_TO_REVEAL",speciesName:"Ignis • demonstração",generation:1,bodyPlan:"QUADRUPED",temperament:"PROUD",mutation:null,rareExpression:true,chassis:dna,element:"FIRE",genesisGrade:"EXCEPTIONAL",visual:{status:"READY",lifeStage:"BABY",url:null,imageHash:null,canConfirm:true}}} onConfirm={async()=>setHatch(false)}/>:null}

 </section>;

}

