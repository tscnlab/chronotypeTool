import { formatTime, wrap } from './scoring.js';
const point = (m, r, c = 180) => [c + r * Math.sin(m / 720 * Math.PI), c - r * Math.cos(m / 720 * Math.PI)];
const arc = (start, duration, r) => {
  const a = point(start, r), b = point(start + duration, r);
  return `M ${a.join(' ')} A ${r} ${r} 0 ${duration > 720 ? 1 : 0} 1 ${b.join(' ')}`;
};
export function clockSvg(period, lang = 'en', midpoint = null) {
  const de = lang === 'de';
  const ticks = Array.from({length:48}, (_,i) => {
    const p=point(i*30,i%2===0?140:145),q=point(i*30,150);
    return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${i%6===0?'#98c6ea':'#366487'}" stroke-width="${i%6===0?2:1}"/>`;
  }).join('');
  const labels = [0,6,12,18].map(h=>{const p=point(h*60,166);return `<text x="${p[0]}" y="${p[1]+4}" text-anchor="middle" fill="#c4d9ec" font-size="12">${String(h).padStart(2,'0')}</text>`;}).join('');
  let highlight = `<circle cx="180" cy="180" r="121" fill="none" stroke="#396784" stroke-width="14" stroke-dasharray="2 8"/>`;
  if(period){const p=point(period.onset+period.duration,121);highlight=`<path d="${arc(period.onset,period.duration,121)}" fill="none" stroke="#98c6ea" stroke-width="16" stroke-linecap="round"/><circle cx="${p[0]}" cy="${p[1]}" r="6" fill="white"/>`;}
  if(midpoint!==null){const p=point(midpoint,121);highlight+=`<line x1="180" y1="180" x2="${p[0]}" y2="${p[1]}" stroke="#e37222" stroke-width="2"/><circle cx="${p[0]}" cy="${p[1]}" r="7" fill="#e37222"/>`;}
  const title=period?`${de?'Schlaf':'Sleep'} ${formatTime(period.onset)}–${formatTime(period.wake)}`:(de?'24-Stunden-Uhr. Noch keine Schlafzeiten eingegeben.':'24-hour clock. No sleep times entered yet.');
  return `<svg viewBox="0 0 360 360" role="img" aria-label="${title}"><title>${title}</title><circle cx="180" cy="180" r="121" fill="none" stroke="#24516f" stroke-width="16"/>${ticks}${labels}${highlight}<g class="clock-center"><text x="180" y="173" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="33" letter-spacing="-1">${period?formatTime(period.onset):'24'}<tspan font-size="14" fill="#a9c7df">${period?'':(de?' Std.':' h')}</tspan></text><text x="180" y="198" text-anchor="middle" fill="#a9c7df" font-size="11" letter-spacing="1">${period?(de?'EINSCHLAFZEIT':'SLEEP ONSET'):(de?'DEIN TAGESRHYTHMUS':'YOUR DAILY RHYTHM')}</text></g></svg>`;
}

// Keep clock times continuous across midnight. The reference bins cover noon to
// the following noon; the view includes every occupied bin and the personal marker.
export function referenceGeometry(reference, midpoint = null) {
  if (!reference || reference.binMinutes !== 30 || reference.startMinute !== 720 ||
      !Array.isArray(reference.counts) || reference.counts.length !== 48 ||
      reference.counts.some(n => !Number.isInteger(n) || n < 0) ||
      reference.counts.reduce((a,b) => a+b,0) !== reference.n || reference.n < 1) {
    throw new Error('Invalid reference distribution');
  }
  if (midpoint !== null && !Number.isFinite(midpoint)) throw new Error('Invalid midpoint');
  const marker = midpoint === null ? null : 720 + wrap(midpoint - 720);
  const occupied = reference.counts.flatMap((n,i) => n ? [i] : []);
  let first = Math.max(0, Math.min(...occupied) - 2);
  let last = Math.min(48, Math.max(...occupied) + 3);
  if (marker !== null) {
    first = Math.min(first, Math.max(0, Math.floor((marker-720)/30)-1));
    last = Math.max(last, Math.min(48, Math.floor((marker-720)/30)+2));
  }
  const min = 720 + first * 30, max = 720 + last * 30;
  return { min, max, marker, bins: reference.counts.map((count,i) => ({start:720+i*30,count})).slice(first,last) };
}

// Describe position relative to this sample only. The individual values within
// each bin are unknown, so the bin containing the median remains "middle".
export function referencePosition(reference, midpoint = null) {
  const { marker } = referenceGeometry(reference, midpoint);
  if (marker === null) return null;
  const index = Math.floor((marker - reference.startMinute) / reference.binMinutes);
  const before = reference.counts.slice(0, index).reduce((sum, count) => sum + count, 0);
  const through = before + reference.counts[index];
  if (through < reference.n / 2) return 'earlier';
  if (before > reference.n / 2) return 'later';
  return 'middle';
}

export function referenceSvg(reference, midpoint = null, lang = 'en', compact = false) {
  const de=lang==='de', {min,max,marker,bins}=referenceGeometry(reference,midpoint);
  const width=compact?360:600, height=compact?320:370, left=compact?36:44, right=16, top=50, bottom=102;
  const plotW=width-left-right, plotH=height-top-bottom;
  const peak=Math.max(...bins.map(b=>b.count));
  const tickStep=Math.max(1,Math.ceil(peak/4/5)*5), yMax=Math.ceil(peak/tickStep)*tickStep;
  const x=m=>left+(m-min)/(max-min)*plotW, y=n=>height-bottom-n/yMax*plotH;
  const title=de?`MSFsc-Verteilung der Referenzstichprobe, ${reference.n} Datensätze`:`MSFsc distribution in the reference sample, ${reference.n} records`;
  const markerText=marker===null?'':`${de?'Du':'You'} · ${formatTime(midpoint)}`;
  const ticks=Array.from({length:yMax/tickStep+1},(_,i)=>i*tickStep).map(n=>`<line x1="${left}" x2="${width-right}" y1="${y(n)}" y2="${y(n)}" stroke="#dce7ef"/><text x="${left-10}" y="${y(n)+4}" text-anchor="end" fill="#536d83" font-size="13">${n}</text>`).join('');
  const bars=bins.map(b=>`<rect x="${x(b.start)+1}" y="${y(b.count)}" width="${Math.max(1,30/(max-min)*plotW-2)}" height="${b.count/yMax*plotH}" rx="2" fill="#0065bd"><title>${formatTime(b.start)}–${formatTime(b.start+30)}: ${b.count}</title></rect>`).join('');
  const interval=(max-min)>960||compact?240:120;
  const xTicks=[];for(let m=Math.ceil(min/interval)*interval;m<=max;m+=interval){xTicks.push(`<text x="${x(m)}" y="${height-bottom+25}" text-anchor="middle" fill="#536d83" font-size="14">${formatTime(m)}</text>`);}
  const mx=marker===null?0:x(marker), labelX=Math.max(left+51,Math.min(width-right-51,mx));
  const line=marker===null?'':`<line x1="${mx}" x2="${mx}" y1="${top-8}" y2="${height-bottom+3}" stroke="#e37222" stroke-width="3"/><circle cx="${mx}" cy="${height-bottom}" r="5" fill="#e37222"/><rect x="${labelX-49}" y="9" width="98" height="28" rx="6" fill="#fff1e7"/><text x="${labelX}" y="28" text-anchor="middle" fill="#923e00" font-size="14" font-weight="600">${markerText}</text>`;
  const direction=`<g fill="#003359" font-size="13"><rect x="${left}" y="${height-34}" width="${plotW}" height="28" rx="5" fill="#edf4fa"/><text x="${left+10}" y="${height-15}">← ${de?'Früher / Lerche':'Earlier / lark'}</text><text x="${width-right-10}" y="${height-15}" text-anchor="end">${de?'Später / Eule':'Later / owl'} →</text></g>`;
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}${markerText?`. ${markerText}`:''}"><title>${title}</title><desc>${de?'Balken: Anzahl pro 30 Minuten. Links: früher / Lerche. Rechts: später / Eule.':'Bars show counts in 30-minute intervals. Left: earlier / lark. Right: later / owl.'}${marker===null?'':(de?' Die orange Linie zeigt deinen Wert.':' The orange line marks your result.')}</desc>${ticks}${bars}${xTicks.join('')}${line}<text x="${left}" y="44" fill="#536d83" font-size="13">${de?'Anzahl':'Count'}</text><text x="${width/2}" y="${height-48}" text-anchor="middle" fill="#536d83" font-size="14">MSFsc · ${de?'lokale Uhrzeit':'local clock time'}</text>${direction}</svg>`;
}
