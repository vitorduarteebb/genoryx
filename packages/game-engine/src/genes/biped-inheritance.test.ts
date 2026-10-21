import {describe,it,expect} from "vitest";
import {generateCreatureBlueprint,blueprintFromParents} from "./generate";
describe("existing body-plan inheritance reaches biped presentation",()=>{
 it("generates biped Florune and preserves both body plans in mixed breeding",()=>{
  const biped=generateCreatureBlueprint({seed:120,speciesKey:"florune",origin:"WILD"});
  const quad=generateCreatureBlueprint({seed:121,speciesKey:"pyron",origin:"WILD"});
  expect(biped.bodyPlanExpressed).toBe("BIPED");expect(quad.bodyPlanExpressed).toBe("QUADRUPED");
  const before=JSON.stringify([biped,quad]),plans=new Set<string>();
  for(let seed=1;seed<=64;seed++){const child=blueprintFromParents(seed,biped,quad,0,0,0);plans.add(child.bodyPlanExpressed);expect(child).toEqual(blueprintFromParents(seed,biped,quad,0,0,0));}
  expect(plans).toEqual(new Set(["BIPED","QUADRUPED"]));expect(JSON.stringify([biped,quad])).toBe(before);
 });
});
