import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Box3} from 'three';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{rollChassisDna}=require('@nexora/game-engine');
const root='apps/web/public/genoryx-art04',rows=JSON.parse(await readFile(`${root}/new-parts.json`,'utf8')),manifest=JSON.parse(await readFile(`${root}/manifest.json`,'utf8'));
const seen=new Set();for(let seed=0;seed<2000;seed++){const d=rollChassisDna({seed});for(const slot of ['horns','back','tail'])seen.add(d[slot].d);}
for(const row of rows){assert(seen.has(row.gene),`${row.gene} unreachable from genetic generation`);const b=await readFile(`apps/web/public${manifest.assets[row.key].url}`),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');const box=new Box3().setFromObject(g.scene);assert(!box.isEmpty());assert(box.min.y>-.2&&box.max.y<.5,'socket envelope');g.scene.traverse(o=>{if(o.isMesh){const a=o.geometry.attributes.position;for(const v of a.array)assert(Number.isFinite(v));}});}
assert(seen.has('HORNS_NONE'));console.log(`PASS: ${rows.length} GLBs load, finite geometry, socket envelopes; all 9 new alleles generated; hornless preserved.`);
