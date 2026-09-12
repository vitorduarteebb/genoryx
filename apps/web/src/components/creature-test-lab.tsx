"use client";
import { useEffect,useState } from "react";
import { CreatureGxrFigure } from "./creature-gxr-figure";
import { visualFixture } from "../lib/creature-visual-fixtures";
import type { CreatureVisualState,CreatureVisualContext } from "../lib/creature-visual-contract";
import { creaturePreviewStats } from "../lib/creature-preview-renderer";
import { CreatureVisualController } from "../lib/creature-visual-controller";
import * as T from "three";
import { CreatureAppearanceLab } from "./creature-appearance-lab";

const states:CreatureVisualState[]=["IDLE","WALK","RUN","ATTACK","CLAW_SWIPE","TAIL_WHIP","CAST","HIT","DEFEND","STATUS","DEATH","VICTORY","HATCH"];
export function CreatureTestLab() {
  const [index,setIndex]=useState(2),[stage,setStage]=useState<"BABY"|"YOUNG"|"ADULT">("ADULT"),[state,setState]=useState<CreatureVisualState>("IDLE"),[key,setKey]=useState(0),[grid,setGrid]=useState(false);
  const [context,setContext]=useState<CreatureVisualContext>("PROFILE"),[stats,setStats]=useState({...creaturePreviewStats}),[report,setReport]=useState(""),[busy,setBusy]=useState(false);
  useEffect(()=>{const timer=setInterval(()=>setStats({...creaturePreviewStats}),500);return()=>clearInterval(timer);},[]);
  async function audit(){setBusy(true);setReport("Validando…");const rows=[];try{
    for(let i=0;i<30;i++){
      const life=(["BABY","YOUNG","ADULT"] as const)[i%3];const dna=visualFixture(i,life),before=JSON.stringify(dna);
      const actor=await CreatureVisualController.create({chassis:dna,lifeStage:life,creatureId:`qa-${i}`,context:"BATTLE"});let finite=true,minY=0,maxPosition=0;
      for(const action of states){actor.play(action,i);for(let t=0;t<18;t++){actor.update(.09);actor.actor.traverse(o=>{finite&&=[...o.position,...o.quaternion,...o.scale].every(Number.isFinite);maxPosition=Math.max(maxPosition,o.position.length());});}}
      const box=new T.Box3().setFromObject(actor.actor);minY=box.min.y;
      rows.push({combination:i,lifeStage:life,bones:actor.bones.size,clips:actor.capabilities.length,finite,minimumBoundsY:minY,maximumLocalPosition:maxPosition,dnaUnchanged:JSON.stringify(dna)===before,pass:finite&&actor.bones.size===12&&maxPosition<5&&JSON.stringify(dna)===before});actor.dispose();
      setReport(`Validadas ${i+1}/30`);await new Promise(resolve=>setTimeout(resolve,0));
    }
    setReport(JSON.stringify({status:rows.every(r=>r.pass)?"PASS":"FAIL",scope:"30 expressed DNA fixtures distributed across BABY/YOUNG/ADULT, each tested in 13 states. Transform/binding/identity validation; visual clipping review remains separate.",rows},null,2));
  }catch(e){setReport(JSON.stringify({status:"FAIL",error:String(e)},null,2));}finally{setBusy(false);}}
  return <main style={{background:"#0c141b",minHeight:"100vh",color:"#dae5e6",padding:28,fontFamily:"system-ui"}}>
    <p style={{color:"#87c2be",letterSpacing:4}}>GENORYX / CREATURE LAB</p><h1 style={{fontSize:28}}>Genética, vida e movimento</h1>
    <p>Ferramenta local. Os exemplos abaixo são fixtures de apresentação; não geram criaturas ou DNA no jogo.</p>
    <div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:20}}>
      <label>Combinação <select aria-label="Combinação" value={index} onChange={e=>setIndex(+e.target.value)}>{Array.from({length:30},(_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label>
      <label>Idade <select aria-label="Idade" value={stage} onChange={e=>setStage(e.target.value as typeof stage)}>{["BABY","YOUNG","ADULT"].map(v=><option key={v}>{v}</option>)}</select></label>
      <label>Contexto <select aria-label="Contexto" value={context} onChange={e=>setContext(e.target.value as CreatureVisualContext)}>{["PROFILE","MARKET","BREEDING","BATTLE","HATCH","WORLD","CARD"].map(v=><option key={v}>{v}</option>)}</select></label>
      <label>Movimento <select aria-label="Movimento" value={state} onChange={e=>{setState(e.target.value as CreatureVisualState);setKey(k=>k+1);}}>{states.map(v=><option key={v}>{v}</option>)}</select></label>
      <button onClick={()=>setKey(k=>k+1)}>Reproduzir</button><button onClick={()=>setGrid(v=>!v)}>{grid?"Mostrar exemplar":"Testar 12 previews"}</button><button disabled={busy} onClick={()=>void audit()}>Validar 30 combinações</button>
    </div>
    <div style={{display:"flex",justifyContent:"center",background:"radial-gradient(ellipse,#20383c,transparent 70%)",marginTop:20}}><CreatureGxrFigure chassis={visualFixture(index,stage)} lifeStage={stage} creatureId={`fixture-${index}`} context={context} animationState={state} animationKey={key} size={580} /></div>
    <pre data-testid="performance" style={{fontSize:12}}>{JSON.stringify(stats,null,2)}</pre>
    <CreatureAppearanceLab />
    {grid?<section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>{Array.from({length:12},(_,i)=><div key={i} style={{background:"#14212b",borderRadius:12}}><CreatureGxrFigure chassis={visualFixture(i)} context="MARKET" creatureId={`market-${i}`} size={230}/><p style={{padding:8}}>Criatura {i+1}</p></div>)}</section>:null}
    <pre data-testid="audit-report" style={{maxHeight:380,overflow:"auto",fontSize:12,whiteSpace:"pre-wrap"}}>{report}</pre>
    <style>{`select,button{background:#1c303b;color:#e1eded;border:1px solid #436069;border-radius:5px;padding:6px}button:disabled{opacity:.4}`}</style>
  </main>;
}
