import { test } from 'node:test';
import assert from 'node:assert/strict';
import { referenceGeometry, referenceSvg, referencePosition } from '../assets/charts.js';
import fixedReference from '../assets/reference-data.js';
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
test('position uses the reference median band without inventing within-bin ranks',()=>{
 const before=JSON.stringify(fixedReference);
 assert.equal(referencePosition(fixedReference,120),'earlier');
 assert.equal(referencePosition(fixedReference,209.99),'earlier');
 assert.equal(referencePosition(fixedReference,210),'middle');
 assert.equal(referencePosition(fixedReference,239.99),'middle');
 assert.equal(referencePosition(fixedReference,240),'later');
 assert.equal(referencePosition(fixedReference,298),'later');
 assert.equal(JSON.stringify(fixedReference),before);
});
test('position handles midnight, tails and results that cannot be compared',()=>{
 assert.equal(referencePosition(reference(),1439),'earlier');
 assert.equal(referencePosition(reference(),0),'middle');
 assert.equal(referencePosition(reference(),30),'later');
 assert.equal(referencePosition(fixedReference,720),'earlier');
 assert.equal(referencePosition(fixedReference,719.99),'later');
 assert.equal(referencePosition(fixedReference,null),null);
 assert.throws(()=>referencePosition(fixedReference,NaN),/Invalid midpoint/);
});
test('an exact half-sample boundary stays neutral',()=>{
 const r={...reference(),n:4,counts:Array.from({length:48},(_,i)=>i===23||i===25?2:0)};
 for(const m of [1439,0,30]) assert.equal(referencePosition(r,m),'middle');
});
