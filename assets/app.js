import { scoreMctq, sleepPeriod, formatTime } from './scoring.js';
import { clockSvg, referenceSvg } from './charts.js';
import reference from './reference-data.js';

let lang = 'en', step = 0, result = null, busy = false, requestId = 0;
const answers = { workDays: null, shiftWork: null, work: { prep: '', latency: '', wake: '' }, free: { prep: '', latency: '', wake: '' }, freeWake: '' };
const t = (en,de) => lang === 'de' ? de : en;
const $ = sel => document.querySelector(sel);
const esc = value => String(value ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const duration = mins => mins == null ? '—' : `${Math.floor(Math.round(mins)/60)} ${t('h','Std.')} ${Math.round(mins)%60 ? `${Math.round(mins)%60} ${t('min','Min.')}` : ''}`.trim();
const labels = () => [t('Your week','Deine Woche'),t('Scheduled days','Pflichttage'),t('Free days','Freie Tage'),t('Your result','Dein Ergebnis')];
const errors = {
  days: ['Choose the number of scheduled days in your usual week.','Wähle die Anzahl der Tage mit Verpflichtungen pro Woche.'],
  shift: ['Please tell us whether you work rotating or night shifts.','Bitte gib an, ob du in Wechsel- oder Nachtschichten arbeitest.'],
  time: ['Please enter both clock times in the 24-hour format.','Bitte gib beide Uhrzeiten im 24-Stunden-Format ein.'],
  latency: ['Enter the minutes it takes to fall asleep (0–240).','Gib die Dauer bis zum Einschlafen in Minuten an (0–240).'],
  duration: ['These times imply no sleep or more than 16 hours. Check the times and minutes to fall asleep.','Diese Angaben ergeben keinen Schlaf oder mehr als 16 Stunden. Bitte prüfe die Uhrzeiten und die Einschlafdauer.'],
  freeWake: ['Please choose how you usually wake on free days.','Bitte wähle, wie du an freien Tagen normalerweise aufwachst.'],
  unknown: ['Something went wrong. Your answers are still here; please try again.','Etwas ist schiefgelaufen. Deine Antworten sind noch da. Bitte versuche es erneut.'],
};
function errorText(code){return t(...(errors[code]||errors.unknown));}
let worker;
try { worker = new Worker(new URL('./scoring-worker.js', import.meta.url), {type:'module'}); } catch {}
function calculate() {
  if(!worker) return Promise.resolve(scoreMctq(answers));
  return new Promise((resolve,reject)=>{
    const id=++requestId;
    const cleanup=()=>{clearTimeout(timer);worker?.removeEventListener('message',handler);worker?.removeEventListener('error',fallback);};
    const fallback=()=>{cleanup();worker?.terminate();worker=null;try{resolve(scoreMctq(answers));}catch(e){reject(e);}};
    const handler=({data})=>{if(data.id!==id)return;cleanup();data.error?reject({code:data.error}):resolve(data.result);};
    const timer=setTimeout(fallback,4000);
    worker.addEventListener('message',handler);worker.addEventListener('error',fallback,{once:true});
    worker.postMessage({id,answers});
  });
}
function translateStatic() {
  document.documentElement.lang=lang;
  document.title=t('Chronotype lab — TUM','Chronotyp-Labor — TUM');
  $('#tum-logo').src=`assets/tum-${lang}.png`;$('#tum-logo').alt=t('Technical University of Munich','Technische Universität München');
  $('.wordmark-title').innerHTML=`${t('Chronotype lab','Chronotyp-Labor')}<small>${t('Discover your natural rhythm','Entdecke deinen Rhythmus')}</small>`;
  $('.wordmark').setAttribute('aria-label',t('Chronotype lab home','Chronotyp-Labor Startseite'));
  $('.skip-link').textContent=t('Skip to questionnaire','Zum Fragebogen');
  $('.language-switch').setAttribute('aria-label',t('Language','Sprache'));
  document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.language===lang));
  $('#mode-badge').textContent=t('No sign-in needed','Ohne Anmeldung');
  $('.intro-panel .eyebrow').textContent=t('One campus. Many body clocks.','Ein Campus. Viele innere Uhren.');
  $('.intro-panel h1').innerHTML=t('What’s your<br>natural <em>rhythm?</em>','Was ist dein<br>natürlicher <em>Rhythmus?</em>');
  $('.intro-copy').innerHTML=t('A few questions about your sleep.<br>A little insight into your inner clock.','Ein paar Fragen zu deinem Schlaf.<br>Ein Einblick in deine innere Uhr.');
  $('.intro-footer').innerHTML=`<span>${t('About 3 minutes','Etwa 3 Minuten')}</span><span>${t('Based on the MCTQ','Auf Basis des MCTQ')}</span>`;
  $('.form-footnote').textContent=t('Think of your usual sleep over the past few weeks, rather than an unusually late night or a holiday. Use local clock times.','Denke an deinen üblichen Schlaf in den letzten Wochen, nicht an eine besonders lange Nacht oder den Urlaub. Verwende lokale Uhrzeiten.');
  $('.site-footer>span').textContent=t('A little science. A lot of different rhythms.','Ein bisschen Wissenschaft. Viele verschiedene Rhythmen.');
  $('.site-footer a').textContent=t('The science & data','Wissenschaft & Daten');
  $('#privacy-button').textContent=t('Privacy','Datenschutz');
  $('#privacy-dialog').innerHTML=`<button class="close-button" id="close-privacy" aria-label="${t('Close privacy information','Datenschutzhinweise schließen')}">×</button><div class="eyebrow">${t('Only on your device','Nur auf deinem Gerät')}</div><h2 id="privacy-title">${t('Your sleep. Your data.','Dein Schlaf. Deine Daten.')}</h2><p>${t('Your answers and result are calculated and held only in this tab. They are not sent to a server or saved by the app. Reloading the page clears them.','Deine Antworten und dein Ergebnis werden nur in diesem Tab berechnet und vorgehalten. Sie werden weder an einen Server gesendet noch von der App gespeichert. Wenn du die Seite neu lädst, werden sie gelöscht.')}</p><p>${t('No account is required. The app has no database, cookies, browser storage, analytics, or tracking. The comparison uses a fixed, aggregated reference sample. Your result is never added to it.','Du brauchst kein Konto. Die App verwendet keine Datenbank, Cookies, Browserspeicher, Analyse- oder Trackingdienste. Der Vergleich verwendet eine feste, zusammengefasste Referenzstichprobe. Dein Ergebnis wird ihr nicht hinzugefügt.')}</p><p>${t('The website host receives normal connection information, such as your IP address, when serving the page. It does not receive your questionnaire answers or result.','Beim Laden der Seite erhält der Hosting-Anbieter übliche Verbindungsinformationen wie deine IP-Adresse. Er erhält weder deine Antworten noch dein Ergebnis.')}</p><p><a href="methods.html#data-and-deployment">${t('How the app handles your data','So geht die App mit deinen Daten um')}</a></p>`;
  $('#close-privacy').onclick=()=>$('#privacy-dialog').close();
  $('#questionnaire').setAttribute('aria-label',t('Chronotype questionnaire','Chronotyp-Fragebogen'));
  $('#result').setAttribute('aria-label',t('Your chronotype result','Dein Chronotyp-Ergebnis'));
  $('#step-nav').setAttribute('aria-label',t('Questionnaire progress','Fortschritt im Fragebogen'));
}
function choice(name,value,label,checked,day=false){return `<label><input class="choice-input" type="radio" name="${name}" value="${value}" ${checked?'checked':''}><span class="${day?'day-choice':'option-content'}">${day?'':'<span class="radio-circle" aria-hidden="true"></span>'}${label}</span></label>`;}
function timeFields(kind) {
  const a=answers[kind];
  return `<div class="field"><label class="field-label" for="prep">${t('When do you try to fall asleep?','Wann versuchst du einzuschlafen?')}</label><input id="prep" name="prep" class="time-input" type="time" step="60" value="${esc(a.prep)}" required><p class="field-hint">${t('When you are ready to sleep — not when you get into bed.','Wenn du bereit bist zu schlafen – nicht, wenn du ins Bett gehst.')}</p></div><div class="input-row"><div class="field"><label class="field-label" for="latency">${t('Minutes to fall asleep','Minuten bis zum Einschlafen')}</label><div class="number-wrap"><input id="latency" name="latency" class="number-input" type="number" inputmode="numeric" min="0" max="240" step="1" placeholder="—" value="${esc(a.latency)}" required><span class="input-unit">${t('minutes','Minuten')}</span></div></div><div class="field"><label class="field-label" for="wake">${t('When do you wake up?','Wann wachst du auf?')}</label><input id="wake" name="wake" class="time-input" type="time" step="60" value="${esc(a.wake)}" required></div></div><div class="sleep-preview"><span>${t('That makes your usual sleep','Das ergibt eine Schlafdauer von')}</span><strong id="duration-preview">—</strong></div>`;
}
function renderForm(focus=false) {
  $('#questionnaire').hidden=false;$('#result').hidden=true;
  $('#step-nav').innerHTML=labels().map((label,i)=>`<div class="step-item ${i===step?'active':i<step?'done':''}" ${i===step?'aria-current="step"':''}><span class="step-number">0${i+1}</span>${label}</div>`).join('');
  let content='';
  if(step===0) content=`<div class="section-kicker">${t('First, the shape of your week','Zuerst: deine typische Woche')}</div><h2 class="form-title" tabindex="-1">${t('Let’s start with your week.','Beginnen wir mit deiner Woche.')}</h2><p class="form-description">${t('Classes, work, early commitments. Your schedule helps us make sense of your sleep.','Uni, Arbeit, frühe Termine. Dein Zeitplan hilft uns, deinen Schlaf einzuordnen.')}</p><fieldset><legend>${t('How many days a week follow a schedule?','An wie vielen Tagen pro Woche hast du feste Verpflichtungen?')}</legend><div class="days-picker">${Array.from({length:8},(_,i)=>choice('workDays',i,i,answers.workDays===i,true)).join('')}</div><p class="field-hint">${t('Count days when classes, work, or other duties set your sleep times.','Zähle Tage, an denen Uni, Arbeit oder andere Pflichten deine Schlafzeiten bestimmen.')}</p></fieldset><fieldset><legend>${t('Do you work rotating or night shifts?','Arbeitest du in Wechsel- oder Nachtschichten?')}</legend><div class="option-grid">${choice('shiftWork','false',t('No, I don’t','Nein'),answers.shiftWork===false)}${choice('shiftWork','true',t('Yes, I do','Ja'),answers.shiftWork===true)}</div></fieldset><div class="soft-note"><span class="note-icon" aria-hidden="true">◷</span><span>${t('There’s no ideal chronotype. Earlier and later are simply different ways to be.','Es gibt keinen idealen Chronotyp. Früh und spät sind einfach unterschiedliche Rhythmen.')}</span></div>`;
  if(step===1) content=`<div class="section-kicker">${t('On days with commitments','An Tagen mit Verpflichtungen')}</div><h2 class="form-title" tabindex="-1">${t('When the alarm has a say.','Wenn der Wecker mitbestimmt.')}</h2><p class="form-description">${t('Think of a typical night before a scheduled day. Tell us when you actually wake, even if you stay in bed a little longer.','Denke an eine typische Nacht vor einem Tag mit Verpflichtungen. Gib an, wann du aufwachst, auch wenn du noch liegen bleibst.')}</p>${timeFields('work')}`;
  if(step===2) content=`<div class="section-kicker">${t('On days without commitments','An Tagen ohne Verpflichtungen')}</div><h2 class="form-title" tabindex="-1">${t('When the day is yours.','Wenn der Tag dir gehört.')}</h2><p class="form-description">${t('Think of your usual sleep before a free day. A free day needn’t be a weekend.','Denke an deinen üblichen Schlaf vor einem freien Tag. Das muss kein Wochenende sein.')}</p>${timeFields('free')}<fieldset><legend>${t('How do you usually wake on free days?','Wie wachst du an freien Tagen normalerweise auf?')}</legend><div class="stack-options">${choice('freeWake','natural',t('Naturally, without an alarm or someone waking me','Von selbst, ohne Wecker oder geweckt zu werden'),answers.freeWake==='natural')}${choice('freeWake','alarm',t('With an alarm','Mit einem Wecker'),answers.freeWake==='alarm')}${choice('freeWake','other',t('Someone or something else wakes me','Jemand oder etwas anderes weckt mich'),answers.freeWake==='other')}</div></fieldset>`;
  if(step===3) content=`<div class="section-kicker">${t('One last look','Ein letzter Blick')}</div><h2 class="form-title" tabindex="-1">${t('Ready to meet your rhythm?','Bereit für deinen Rhythmus?')}</h2><p class="form-description">${t('We’ll calculate your sleep midpoint and account for extra sleep on free days.','Wir berechnen deine Schlafmitte und berücksichtigen zusätzlichen Schlaf an freien Tagen.')}</p><div class="review-row"><span>${t('Your week','Deine Woche')}</span><strong>${answers.workDays} ${t('scheduled','Pflichttage')} · ${7-answers.workDays} ${t('free','freie Tage')}</strong></div><div class="review-row"><span>${t('Scheduled-day sleep','Schlaf vor Pflichttagen')}</span><strong>${formatTime(sleepPeriod(answers.work).onset)}–${answers.work.wake}</strong></div><div class="review-row"><span>${t('Free-day sleep','Schlaf vor freien Tagen')}</span><strong>${formatTime(sleepPeriod(answers.free).onset)}–${answers.free.wake}</strong></div><div class="review-row"><span>${t('Waking on free days','Aufwachen an freien Tagen')}</span><strong>${answers.freeWake==='natural'?t('Naturally','Von selbst'):answers.freeWake==='alarm'?t('With an alarm','Mit Wecker'):t('External interruption','Von außen geweckt')}</strong></div><p class="privacy-preview">${t('Your answers and result stay in this tab. Nothing is sent or saved, and no account is needed.','Deine Antworten und dein Ergebnis bleiben in diesem Tab. Es wird nichts gesendet oder gespeichert. Du brauchst kein Konto.')}</p>`;
  $('#form-content').innerHTML=`<form id="sleep-form" class="step-slide" novalidate>${content}<div id="form-error" class="form-error" role="alert" hidden></div><div class="form-actions">${step>0?`<button class="secondary-button" type="button" id="back-button">${t('Back','Zurück')}</button>`:''}<button class="primary-button" type="submit">${step===3?t('Reveal my rhythm','Meinen Rhythmus entdecken'):t('Continue','Weiter')}</button></div></form>`;
  $('#back-button')?.addEventListener('click',()=>{step--;renderForm(true);});
  $('#sleep-form').addEventListener('input',syncInput);$('#sleep-form').addEventListener('change',syncInput);
  $('#sleep-form').addEventListener('submit',onNext);
  updateClock();if(focus)$('.form-title').focus({preventScroll:true});
}
function syncInput(e) {
  const {name,value}=e.target;
  if(name==='workDays')answers.workDays=Number(value);
  else if(name==='shiftWork')answers.shiftWork=value==='true';
  else if(['prep','wake','latency'].includes(name))answers[step===1?'work':'free'][name]=name==='latency'?(value===''?'':Number(value)):value;
  else if(name==='freeWake')answers.freeWake=value;
  updateClock();
}
function updateClock() {
  let period=null;try{if(step>0)period=sleepPeriod(answers[step===1?'work':'free']);}catch{}
  $('#sleep-clock').innerHTML=clockSvg(period,lang);
  $('#clock-caption').textContent=period?t('Your sleep, around the clock','Dein Schlaf im Tagesverlauf'):t('A 24-hour view of your sleep','Dein Schlaf auf einer 24-Stunden-Uhr');
  if($('#duration-preview'))$('#duration-preview').textContent=period?duration(period.duration):'—';
}
async function onNext(e){
  e.preventDefault();if(busy)return;
  try{
    if(step===0){if(answers.workDays===null)throw {code:'days'};if(answers.shiftWork===null)throw {code:'shift'};if(answers.shiftWork||answers.workDays===0||answers.workDays===7){result=await calculate();renderResult(true);return;}}
    if(step===1)sleepPeriod(answers.work);
    if(step===2){sleepPeriod(answers.free);if(!answers.freeWake)throw {code:'freeWake'};}
    if(step<3){step++;renderForm(true);return;}
    busy=true;const button=$('#sleep-form .primary-button');button.disabled=true;button.textContent=t('Finding your rhythm…','Dein Rhythmus wird berechnet…');
    result=await calculate();
    renderResult(true);
  }catch(error){const el=$('#form-error');if(el){el.hidden=false;el.textContent=errorText(error.code);el.setAttribute('tabindex','-1');el.focus();}}
  finally{busy=false;if($('#sleep-form .primary-button')){$('#sleep-form .primary-button').disabled=false;}}
}
function reasonCopy(reason){
  const copy={shift:[t('Your schedule needs a different lens.','Dein Zeitplan braucht einen anderen Blick.'),t('Rotating and night shifts need the MCTQ Shift questionnaire. This event version cannot give a reliable chronotype estimate for your schedule.','Für Wechsel- und Nachtschichten wird der MCTQ Shift benötigt. Diese Veranstaltungsversion kann für deinen Zeitplan keinen verlässlichen Chronotyp schätzen.')],schedule:[t('We need both kinds of day.','Wir brauchen beide Arten von Tagen.'),t('This event version needs usual sleep on both scheduled and free days. With zero or seven scheduled days, we won’t guess a chronotype.','Diese Veranstaltungsversion benötigt üblichen Schlaf vor Pflicht- und freien Tagen. Bei null oder sieben Pflichttagen schätzen wir keinen Chronotyp.')],alarm:[t('Your alarm changes the picture.','Dein Wecker verändert das Bild.'),t('A free-day alarm can cut sleep short. MCTQ cannot estimate your chronotype from these answers. Your sleep summary is still shown below.','Ein Wecker an freien Tagen kann deinen Schlaf verkürzen. Der MCTQ kann daraus keinen Chronotyp schätzen. Deine Schlafübersicht findest du trotzdem unten.')],other:[t('Your free-day sleep is interrupted.','Dein Schlaf wird auch an freien Tagen unterbrochen.'),t('For this estimate, we need free-day sleep that ends naturally. Someone or something waking you makes that estimate uncertain.','Für diese Schätzung muss dein Schlaf an freien Tagen von selbst enden. Wenn du von jemandem oder etwas geweckt wirst, ist die Schätzung unsicher.') ]};return copy[reason];
}
function resultExplanation() {
  let details='';
  if(result.eligible){
    const correction=`−${Math.round(result.correction)} ${t('min','Min.')}`;
    details=`<p class="insight-intro">${t('Your chronotype is described by the middle of your sleep. It is not a recommended bedtime or wake-up time.','Dein Chronotyp wird durch die Mitte deines Schlafs beschrieben. Er ist keine Empfehlung für eine Einschlaf- oder Aufwachzeit.')}</p>
      <dl class="calculation-list">
        <div><dt>${t('Free-day sleep midpoint','Schlafmitte an freien Tagen')}</dt><dd>${formatTime(result.free.midpoint)}</dd></div>
        <div><dt>${t('Correction for extra sleep','Korrektur für zusätzlichen Schlaf')}</dt><dd>${correction}</dd></div>
        <div class="calculation-total"><dt>${t('Your corrected midpoint','Deine korrigierte Schlafmitte')}</dt><dd>${formatTime(result.msfsc)}</dd></div>
      </dl>
      <p class="insight-note">${result.correction>0?t('You sleep longer on free days. The correction accounts for extra sleep relative to your weekly average.','Du schläfst an freien Tagen länger. Die Korrektur berücksichtigt zusätzlichen Schlaf im Vergleich zu deinem Wochenschnitt.'):t('You do not sleep longer on free days, so no sleep-debt correction is applied.','Du schläfst an freien Tagen nicht länger. Daher wird keine Schlafdefizit-Korrektur angewendet.')}</p>
      <p class="rounding-note">${t('Displayed times are rounded to the nearest minute.','Die angezeigten Zeiten sind auf die nächste Minute gerundet.')}</p>`;
  } else {
    details=`<p class="insight-intro">${t('This short questionnaire needs usual sleep on both scheduled and free days, with natural waking on free days.','Dieser kurze Fragebogen benötigt übliche Schlafzeiten an Pflicht- und freien Tagen sowie natürliches Aufwachen an freien Tagen.')}</p>${result.free?`<dl class="calculation-list"><div><dt>${t('Observed free-day midpoint','Beobachtete Schlafmitte an freien Tagen')}</dt><dd>${formatTime(result.free.midpoint)}</dd></div></dl><p class="insight-note">${t('This describes the sleep you reported. It is not a corrected chronotype estimate. Your sleep durations are shown below.','Dieser Wert beschreibt deinen angegebenen Schlaf. Er ist keine korrigierte Chronotyp-Schätzung. Deine Schlafdauer findest du unten.')}</p>`:`<p class="insight-note">${t('You can read about the method and the schedules it supports in the science notes.','In den wissenschaftlichen Hinweisen erfährst du mehr über die Methode und die dafür geeigneten Zeitpläne.')}</p>`}`;
  }
  return `<article class="insight-card"><div class="section-kicker">${t('Understanding your result','Dein Ergebnis verstehen')}</div><h2>${t('Your time, explained.','Deine Zeit, erklärt.')}</h2>${details}<a class="science-link" href="methods.html">${t('Explore the science','Mehr über die Wissenschaft')}</a><p class="private-note">${t('Just for you. Your answers and result stay in this tab and are not saved.','Nur für dich. Deine Antworten und dein Ergebnis bleiben in diesem Tab und werden nicht gespeichert.')}</p></article>`;
}
function referencePanel() {
  if (!reference) return `<article class="reference-card"><div class="section-kicker">${t('Reference sample','Referenzstichprobe')}</div><h2>${(result.eligible?t('Your MSFsc is ready.','Dein MSFsc steht fest.'):t('About the reference.','Über die Referenz.'))}</h2><p class="reference-note">${t('The reference data are unavailable. Your personal result is calculated independently.','Die Referenzdaten sind nicht verfügbar. Dein persönliches Ergebnis wird unabhängig davon berechnet.')}</p><a class="science-link" href="reference.html">${t('About the reference data','Über die Referenzdaten')}</a><details class="calculation-details"><summary>${t('How your result is calculated','So wird dein Ergebnis berechnet')}</summary>${resultExplanation()}</details></article>`;
  const table=reference.counts.map((count,i)=>`<tr><td>${formatTime(720+i*30)}–${formatTime(750+i*30)}</td><td>${count}</td></tr>`).join('');
  return `<article class="reference-card">
    <div class="reference-top"><div class="section-kicker">${t('A fixed reference sample','Eine feste Referenzstichprobe')}</div><span class="reference-count">n = ${reference.n}</span></div>
    <h2>${t('Your rhythm in context.','Dein Rhythmus im Vergleich.')}</h2>
    <p class="reference-intro">${result.eligible?t('See how your corrected sleep midpoint sits alongside the rhythms in our reference sample.','Sieh, wo deine korrigierte Schlafmitte im Vergleich zu den Rhythmen unserer Referenzstichprobe liegt.'):t('These are the rhythms in the reference sample. No personal marker is shown because your MSFsc could not be estimated.','Dies sind die Rhythmen der Referenzstichprobe. Es wird keine persönliche Markierung angezeigt, da dein MSFsc nicht geschätzt werden konnte.')}</p>
    <figure class="reference-figure">${referenceSvg(reference,result.eligible?result.msfsc:null,lang,window.matchMedia('(max-width:760px)').matches)}<figcaption><strong>B</strong> ${t('MSF','MSF')}<sub>sc</sub> ${t('in the reference sample','in der Referenzstichprobe')}</figcaption></figure>
    <div class="reference-key"><span><i class="key-bar"></i>${t('Reference records','Referenzdaten')}</span>${result.eligible?`<span><i class="key-marker"></i>${t('Your MSF','Dein MSF')}<sub>sc</sub> ${formatTime(result.msfsc)}</span>`:''}</div>
    <p class="reference-note">${t('Fixed µMCTQ reference. Each bar spans 30 minutes. This sample is not a population norm. Your result is not added to it.','Feste µMCTQ-Referenz. Jeder Balken umfasst 30 Minuten. Diese Stichprobe ist keine Bevölkerungsnorm. Dein Ergebnis wird nicht hinzugefügt.')}</p>
    <div class="reference-links"><a href="reference.html">${t('About the reference','Über die Referenz')}</a><details class="reference-table"><summary>${t('View counts','Häufigkeiten anzeigen')}</summary><div class="reference-table-scroll"><table><caption>${t('30-minute intervals, from noon to the next noon','30-Minuten-Intervalle, von Mittag bis zum nächsten Mittag')}</caption><thead><tr><th scope="col">MSF<sub>sc</sub></th><th scope="col">${t('Count','Anzahl')}</th></tr></thead><tbody>${table}</tbody></table></div></details></div>
    <details class="calculation-details"><summary>${result.eligible?t('How your MSFsc is calculated','So wird dein MSFsc berechnet'):t('About your result','Über dein Ergebnis')}</summary>${resultExplanation()}</details>
  </article>`;
}
function renderResult(focus=false){
  $('#questionnaire').hidden=true;$('#result').hidden=false;
  const reason=result.eligible?null:reasonCopy(result.reason);
  $('#result').innerHTML=`
    <div class="result-heading"><div><div class="eyebrow">${t('Your personal rhythm','Dein persönlicher Rhythmus')}</div><h1 tabindex="-1">${t('Every body has its own time.','Jeder Mensch hat seine eigene Zeit.')}</h1><p>${t('An insight into your sleep timing, based on the MCTQ.','Ein Einblick in deine Schlafzeiten auf Basis des MCTQ.')}</p></div><span class="pill">${t('MCTQ · sleep-timing core','MCTQ · Kernfragen zu Schlafzeiten')}</span></div>
    <div class="result-grid">
      <article class="score-card"><div class="eyebrow">${result.eligible?t('Your MSFsc','Dein MSFsc'):t('No chronotype estimate','Keine Chronotyp-Schätzung')}</div>
      ${result.eligible?`<div class="score-value">${formatTime(result.msfsc)}</div><div class="score-unit">${t('Corrected sleep midpoint · MSF','Korrigierte Schlafmitte · MSF')}<sub>sc</sub></div><p class="score-explainer">${t('The middle of your free-day sleep, adjusted for extra sleep after scheduled days. A clock time that describes your rhythm.','Die Mitte deines Schlafs an freien Tagen, korrigiert für zusätzlichen Schlaf nach Pflichttagen. Eine Uhrzeit, die deinen Rhythmus beschreibt.')}</p><figure class="clock-figure"><div class="sleep-clock">${clockSvg(result.free,lang,result.msfsc)}</div><figcaption><strong>A</strong> ${t('Free-day sleep & corrected midpoint','Schlaf an freien Tagen & korrigierte Mitte')}</figcaption></figure>`:`<h2>${reason[0]}</h2><p class="score-explainer" style="max-width:100%">${reason[1]}</p>`}
      </article>
      ${referencePanel()}
    </div>
    ${result.work?`<div class="metrics-row"><div class="metric"><div class="metric-label">${t('Scheduled-day sleep','Schlaf vor Pflichttagen')}</div><div class="metric-value">${duration(result.work.duration)}</div><div class="metric-note">${formatTime(result.work.onset)}–${formatTime(result.work.wake)}</div></div><div class="metric"><div class="metric-label">${t('Free-day sleep','Schlaf vor freien Tagen')}</div><div class="metric-value">${duration(result.free.duration)}</div><div class="metric-note">${formatTime(result.free.onset)}–${formatTime(result.free.wake)}</div></div><div class="metric"><div class="metric-label">${t('Weekly average sleep','Schlaf im Wochenschnitt')}</div><div class="metric-value">${duration(result.weekly)}</div><div class="metric-note">${t('Weighted by your scheduled days','Gewichtet nach deinen Pflichttagen')}</div></div></div>`:''}
    <div class="result-bottom" style="margin-top:24px"><p>${t('Your score is a continuous measure, not a diagnosis or a fixed “owl” or “lark” label.','Dein Wert ist ein kontinuierliches Maß, keine Diagnose und kein festes Etikett als „Eule“ oder „Lerche“.')} <a href="methods.html">${t('How it works','So funktioniert es')}</a></p><button class="secondary-button" id="edit-answers">${t('Review my answers','Meine Antworten prüfen')}</button></div>`;
  $('#edit-answers').onclick=()=>{step=0;renderForm(true);};
  if(focus){$('#result h1').focus({preventScroll:true});window.scrollTo({top:0,behavior:'smooth'});}
}
document.querySelectorAll('[data-language]').forEach(b=>b.onclick=()=>{lang=b.dataset.language;translateStatic();if($('#result').hidden)renderForm();else renderResult();});
window.matchMedia('(max-width:760px)').addEventListener('change',()=>{if(!$('#result').hidden)renderResult();});
$('#privacy-button').onclick=()=>$('#privacy-dialog').showModal();
$('#privacy-dialog').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});
translateStatic();renderForm();

// Progressive enhancement: read-only access to the same visible result for supported browsers.
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_chronotype_result',title:'Read the displayed chronotype result',description:'Read the current visible MCTQ result without submitting any data.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({visible:!$('#result').hidden,result:$('#result').hidden?null:result})})).catch(()=>{});}catch{}}
