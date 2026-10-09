import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreMctq, sleepPeriod, correctedMidpoint, formatTime, socialJetlagDifference } from '../assets/scoring.js';
const base=()=>({workDays:5,shiftWork:false,work:{prep:'23:00',latency:30,wake:'07:00'},free:{prep:'00:30',latency:30,wake:'10:00'},freeWake:'natural'});
test('five scheduled days: 7.5 h work sleep, 9 h free sleep, 05:30 midpoint corrected to 04:58',()=>{
 const r=scoreMctq(base());assert.equal(r.work.duration,450);assert.equal(r.free.duration,540);assert.equal(r.free.midpoint,330);assert.ok(Math.abs(r.weekly-475.714285714)<1e-6);assert.ok(Math.abs(r.msfsc-297.857142857)<1e-6);assert.equal(formatTime(r.msfsc),'04:58');
});
test('rOpenSci documented example: correction',()=>assert.ok(Math.abs(correctedMidpoint(240,360,420,6.29*60)-218.7)<1e-10));
test('rOpenSci documented example: correction across midnight',()=>assert.equal(correctedMidpoint(60,330,540,405),1432.5));
test('no correction if free-day sleep is shorter',()=>assert.equal(correctedMidpoint(225,540,300,510),225));
test('no correction if durations are equal',()=>assert.equal(correctedMidpoint(300,480,480,480),300));
test('alarm means no chronotype',()=>{const a=base();a.freeWake='alarm';const r=scoreMctq(a);assert.equal(r.msfsc,null);assert.equal(r.reason,'alarm');assert.equal(r.free.duration,540);});
test('other external waking is excluded',()=>{const a=base();a.freeWake='other';assert.equal(scoreMctq(a).eligible,false);});
test('shift schedules are explicitly unsupported',()=>assert.equal(scoreMctq({workDays:5,shiftWork:true}).reason,'shift'));
test('zero and seven scheduled days do not invent missing sections',()=>{for(const workDays of [0,7])assert.equal(scoreMctq({workDays,shiftWork:false}).reason,'schedule');});
test('sleep onset crosses midnight correctly',()=>{const r=sleepPeriod({prep:'23:50',latency:20,wake:'08:00'});assert.equal(r.onset,10);assert.equal(r.duration,470);assert.equal(r.midpoint,245);});
test('daytime sleep is preserved',()=>{const r=sleepPeriod({prep:'08:00',latency:15,wake:'16:00'});assert.equal(r.duration,465);assert.equal(r.midpoint,727.5);});
test('latency greater than the sleep interval is rejected, not wrapped into 24 h',()=>assert.throws(()=>sleepPeriod({prep:'23:00',latency:180,wake:'01:00'}),/duration/));
test('malformed times and non-numeric latency are rejected',()=>{for(const prep of ['24:00','9:00','12:60','',null])assert.throws(()=>sleepPeriod({prep,latency:0,wake:'08:00'}),/time/);for(const latency of ['',null,'30',-1,241,Infinity,1.5])assert.throws(()=>sleepPeriod({prep:'23:00',latency,wake:'08:00'}),/latency/);});
test('days and explicit shift answer are required',()=>{for(const workDays of [null,'5',-1,8,3.5])assert.throws(()=>scoreMctq({...base(),workDays}),/days/);assert.throws(()=>scoreMctq({...base(),shiftWork:null}),/shift/);});
test('display rounds only the final value and wraps at midnight',()=>assert.equal(formatTime(1439.9),'00:00'));
test('social jetlag uses uncorrected midpoints: 03:15 to 05:30 is 2 h 15 min',()=>{
 const r=scoreMctq(base());
 assert.equal(r.work.midpoint,195);
 assert.equal(r.socialJetlag,135);
 assert.equal(r.socialJetlagSigned,135);
 assert.notEqual(r.socialJetlag,r.msfsc-r.work.midpoint);
});
test('social jetlag keeps direction when free-day sleep is earlier',()=>{
 const a=base(); a.free={prep:'21:00',latency:30,wake:'05:00'};
 const r=scoreMctq(a);
 assert.equal(r.socialJetlag,120);assert.equal(r.socialJetlagSigned,-120);
});
test('social jetlag is zero for matching midpoints',()=>{
 const a=base(); a.free={...a.work};
 const r=scoreMctq(a);assert.equal(r.socialJetlag,0);assert.equal(r.socialJetlagSigned,0);
});
test('shorter-interval social jetlag crosses midnight in either direction',()=>{
 assert.equal(socialJetlagDifference(1410,30),60);
 assert.equal(socialJetlagDifference(30,1410),-60);
 assert.equal(socialJetlagDifference(1155,150),435);
 assert.equal(socialJetlagDifference(270,1410),-300);
});
test('exact 12-hour ties retain the raw sign and fractions are not rounded',()=>{
 assert.equal(socialJetlagDifference(0,720),720);
 assert.equal(socialJetlagDifference(720,0),-720);
 assert.equal(socialJetlagDifference(195.5,330),134.5);
});
test('reported social jetlag remains available with alarm or external waking',()=>{
 for(const freeWake of ['alarm','other']) {
   const r=scoreMctq({...base(),freeWake});
   assert.equal(r.msfsc,null);assert.equal(r.socialJetlag,135);
 }
});
test('social jetlag is unavailable for unsupported schedules',()=>{
 for(const input of [{workDays:5,shiftWork:true},{workDays:0,shiftWork:false},{workDays:7,shiftWork:false}]) {
   const r=scoreMctq(input);assert.equal(r.socialJetlag,null);assert.equal(r.socialJetlagSigned,null);
 }
});
test('social jetlag rejects missing or out-of-range clock minutes',()=>{
 for(const value of [null,NaN,Infinity,-1,1440,'300']) assert.throws(()=>socialJetlagDifference(value,330),/time/);
});
