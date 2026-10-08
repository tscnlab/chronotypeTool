import { scoreMctq, formatTime } from '../assets/scoring.js';
let seed=20261008;
const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
const integer=(min,max)=>Math.floor(random()*(max-min+1))+min;
const rows=[];
for(let i=0;i<512;i++){
  const wp=integer(0,1439),fp=integer(0,1439),wl=integer(0,90),fl=integer(0,90),wd=integer(180,840),fd=integer(180,840);
  const input={workDays:integer(1,6),shiftWork:false,work:{prep:formatTime(wp),latency:wl,wake:formatTime(wp+wl+wd)},free:{prep:formatTime(fp),latency:fl,wake:formatTime(fp+fl+fd)},freeWake:i%9===0?'alarm':'natural'};
  const r=scoreMctq(input);
  rows.push({case_id:i+1,work_days:input.workDays,prep_w:input.work.prep,latency_w:wl,wake_w:input.work.wake,prep_f:input.free.prep,latency_f:fl,wake_f:input.free.wake,alarm_f:input.freeWake==='alarm',js_onset_w:r.work.onset,js_duration_w:r.work.duration,js_onset_f:r.free.onset,js_duration_f:r.free.duration,js_midpoint_f:r.free.midpoint,js_weekly:r.weekly,js_msfsc:r.msfsc});
}
// Synthetic development cases only. Stream to R without creating data files.
console.log(JSON.stringify(rows));
