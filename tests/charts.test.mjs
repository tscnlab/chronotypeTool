import { test } from 'node:test';
import assert from 'node:assert/strict';
import { referenceGeometry, referenceSvg } from '../assets/charts.js';
const reference=()=>({binMinutes:30,startMinute:720,n:3,counts:Array.from({length:48},(_,i)=>i===23?1:i===24?2:0)});
test('reference preserves midnight adjacency and includes every count',()=>{
 const g=referenceGeometry(reference());
 assert.equal(g.bins.reduce((s,b)=>s+b.count,0),3);
 assert.equal(g.bins.filter(b=>b.count)[1].start-g.bins.filter(b=>b.count)[0].start,30);
});
test('personal result changes the marker and viewport, never the reference counts',()=>{
 const r=reference(), before=JSON.stringify(r);
 for(const m of [0,719.99,720,1439.99]){const g=referenceGeometry(r,m);assert.ok(g.marker>=g.min&&g.marker<=g.max);assert.equal(g.bins.reduce((s,b)=>s+b.count,0),3);}
 assert.equal(JSON.stringify(r),before);
});
test('invalid reference totals fail explicitly',()=>assert.throws(()=>referenceGeometry({...reference(),n:4}),/Invalid/));
test('ineligible result has no personal marker',()=>{
 assert.equal(referenceGeometry(reference(),null).marker,null);
 assert.doesNotMatch(referenceSvg(reference(),null),/You ·/);
 assert.match(referenceSvg(reference(),330,'de'),/Du · 05:30/);
});
