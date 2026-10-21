export const captureZones = [
 {id:"meadow",name:"Prados do Primeiro Laço",difficulty:"EASY",label:"Fácil",minLevel:1,maxLevel:4,recommendedLevel:1,lifeStage:"BABY",captureMultiplier:1,x:-7,z:9,radius:5,color:"#86ba68",species:["florune","nympha"],description:"Campos abertos para os primeiros encontros. Enfraqueça a criatura antes de lançar uma NexOrb."},
 {id:"brook",name:"Margens de Safira",difficulty:"EASY",label:"Fácil",minLevel:4,maxLevel:7,recommendedLevel:4,lifeStage:"BABY",captureMultiplier:.9,x:8,z:18,radius:5,color:"#62b3bd",species:["nympha","aqualis"],description:"Lagoas e vegetação ribeirinha abrigam criaturas de água."},
 {id:"thicket",name:"Mata das Presas",difficulty:"HARD",label:"Difícil",minLevel:10,maxLevel:14,recommendedLevel:12,lifeStage:"YOUNG",captureMultiplier:.65,x:-9,z:33,radius:6,color:"#7d9858",species:["florune","terranox","sparkyn"],description:"A mata se fecha. Leve uma equipe preparada e reserve suas NexOrbs."},
 {id:"ember",name:"Desfiladeiro das Brasas",difficulty:"HARD",label:"Difícil",minLevel:15,maxLevel:19,recommendedLevel:17,lifeStage:"YOUNG",captureMultiplier:.55,x:9,z:42,radius:6,color:"#ba7955",species:["pyron","drakor","grumak"],description:"Pedra escura e cristais quentes cercam criaturas resistentes e agressivas."},
 {id:"frost",name:"Coroa de Cristal",difficulty:"EXTREME",label:"Extremamente difícil",minLevel:21,maxLevel:24,recommendedLevel:23,lifeStage:"ADULT",captureMultiplier:.35,x:-8,z:53,radius:6,color:"#a2cbd5",species:["cryon","voltaris","lumera"],description:"Um território de criaturas adultas. A captura exige preparo e alvos enfraquecidos."},
 {id:"abyss",name:"Santuário do Eclipse",difficulty:"EXTREME",label:"Extremamente difícil",minLevel:23,maxLevel:25,recommendedLevel:25,lifeStage:"ADULT",captureMultiplier:.25,x:8,z:63,radius:6,color:"#8773b1",species:["noctyr","drakor","lumera"],description:"O extremo da expedição. Criaturas adultas poderosas dominam as ruínas."},
] as const;
export type CaptureZone=(typeof captureZones)[number];
export type CaptureZoneId=CaptureZone["id"];
export function getCaptureZone(id?:string|null):CaptureZone|undefined{return captureZones.find(zone=>zone.id===id);}
