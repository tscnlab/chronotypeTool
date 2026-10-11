// General adult guidance. No treatment or bedtime is inferred from MSFsc.
export function sleepAdviceHtml(lang, shiftWork = false) {
  const t = (en, de) => lang === 'de' ? de : en;
  const icons = {
    daylight: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    evening: '<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>',
    sleep: '<path d="M3 19V7m18 12V9M3 15h18M6 11h4M6 8h4m3 3h8"/>',
    rhythm: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    nutrition: '<path d="M4 3v5a3 3 0 0 0 6 0V3M7 3v18M19 21V3c-4 3-4 9 0 9"/>',
    exercise: '<circle cx="15" cy="4" r="2"/><path d="m6 10 5-3 4 4 5 1M11 7l-2 7 5 2 1 5M9 14l-4 6"/>'
  };
  const tips = [
    { id: 'daylight', source: 1,
      title: t('Get some daylight', 'Tagsüber ins Tageslicht'),
      text: t('Spend time outdoors during the day, for example on your way to class or during a break. Daylight helps your body clock keep track of the day.', 'Geh tagsüber nach draußen, zum Beispiel auf dem Weg zur Uni oder in einer Pause. Tageslicht hilft deiner inneren Uhr, sich am Tag-Nacht-Wechsel zu orientieren.') },
    { id: 'evening', source: 1,
      title: t('Turn the lights down in the evening', 'Abends das Licht dimmen'),
      text: t('Dim room lights and screens in the three hours before bed. Keep your bedroom dark while you sleep, with enough light to move around safely if you get up.', 'Dimme Raumbeleuchtung und Bildschirme in den drei Stunden vor dem Schlafengehen. Halte dein Schlafzimmer beim Schlafen dunkel. Wenn du nachts aufstehst, brauchst du genug Licht, um dich sicher zu bewegen.') },
    { id: 'sleep', source: 2,
      title: t('Leave enough time for sleep', 'Genug Zeit zum Schlafen'),
      text: t('Adults should regularly get at least seven hours of sleep. Many need more. When planning your night, allow time to fall asleep as well.', 'Erwachsene sollten regelmäßig mindestens sieben Stunden schlafen. Viele brauchen mehr. Plane auch die Zeit ein, die du zum Einschlafen brauchst.') },
    { id: 'rhythm', source: 3,
      title: t('Keep sleep times fairly regular', 'Möglichst regelmäßig schlafen'),
      text: t('Aim for bedtimes and wake-up times you can keep on most days. If you have missed sleep, catching up can help. Don’t shorten your sleep just to lower your social jetlag.', 'Versuche, Schlafens- und Aufstehzeiten an den meisten Tagen ähnlich zu halten. Nach zu wenig Schlaf kann Nachholen helfen. Kürze deinen Schlaf nicht, nur um den sozialen Jetlag zu senken.') },
    { id: 'nutrition', source: 4,
      title: t('Food, drinks and sleep', 'Essen, Trinken und Schlaf'),
      text: t('Avoid large meals in the few hours before bed. A light snack is fine if you’re hungry. Caffeine can affect sleep for up to eight hours, so try moving coffee or energy drinks earlier.', 'Vermeide große Mahlzeiten in den Stunden vor dem Schlafengehen. Bei Hunger ist ein kleiner Snack in Ordnung. Koffein kann den Schlaf bis zu acht Stunden beeinflussen. Trinke Kaffee oder Energydrinks deshalb eher früher.') },
    { id: 'exercise', source: 5,
      title: t('Find time to move', 'Bewegung einplanen'),
      text: t('Aim for 150–300 minutes of moderate activity, such as brisk walking, each week, or 75–150 minutes of vigorous activity. Add strength exercises on at least two days. Start small and build up.', 'Strebe pro Woche 150–300 Minuten Bewegung mit mittlerer Intensität an, etwa zügiges Gehen, oder 75–150 Minuten mit hoher Intensität. Ergänze Kraftübungen an mindestens zwei Tagen. Fang klein an und steigere dich langsam.') }
  ];
  const shown = shiftWork ? tips.filter(tip => ['sleep', 'nutrition', 'exercise'].includes(tip.id)) : tips;
  return `<section class="sleep-advice" aria-labelledby="advice-title">
    <div class="advice-heading"><h2 id="advice-title">${t('Looking after your sleep', 'Was deinem Schlaf helfen kann')}</h2><p>${shiftWork
      ? t('Night and rotating shifts need different advice about light and sleep timing. An occupational health or sleep specialist can help you plan around your shifts.', 'Bei Nacht- und Wechselschichten müssen Licht und Schlafzeiten anders geplant werden. Eine betriebsärztliche oder schlafmedizinische Beratung kann dich dabei unterstützen.')
      : t('General recommendations for adults with daytime schedules. Your MSFsc does not tell you when you should go to bed.', 'Allgemeine Empfehlungen für Erwachsene mit einem Tagesrhythmus ohne Schichtarbeit. Dein MSFsc gibt keine Schlafenszeit vor.')}</p></div>
    <div class="advice-grid${shiftWork ? ' advice-grid-single' : ''}">${shown.map(tip => `<article class="advice-tip"><span class="advice-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icons[tip.id]}</svg></span><div><h3>${tip.title}</h3><p>${tip.text}</p><a class="advice-source-link" href="#advice-source-${tip.source}">${t('Evidence', 'Quelle')} [${tip.source}]</a></div></article>`).join('')}</div>
    <div class="advice-footer"><p>${t('If sleep problems persist or you often feel very sleepy during the day, talk to a healthcare professional.', 'Wenn Schlafprobleme anhalten oder du tagsüber oft sehr schläfrig bist, lass dich ärztlich beraten.')}</p><details class="advice-sources"><summary>${t('Where this advice comes from', 'Worauf diese Empfehlungen beruhen')}</summary><p>${t('Research consensus papers and public health guidance. These are general habits, not a treatment plan based on your score.', 'Die Hinweise beruhen auf wissenschaftlichen Konsenspapieren und Gesundheitsempfehlungen. Es sind allgemeine Hinweise, kein aus deinem Wert abgeleiteter Behandlungsplan.')}</p><ol>
      <li id="advice-source-1">Brown et al. (2022). <a href="https://doi.org/10.1371/journal.pbio.3001571" target="_blank" rel="noopener noreferrer">${t('Daytime, evening and nighttime light', 'Licht am Tag, am Abend und in der Nacht')}</a>. <em>PLOS Biology.</em></li>
      <li id="advice-source-2">Watson et al. (2015). <a href="https://doi.org/10.5664/jcsm.4758" target="_blank" rel="noopener noreferrer">${t('Recommended amount of sleep for adults', 'Empfohlene Schlafdauer für Erwachsene')}</a>. <em>Journal of Clinical Sleep Medicine.</em></li>
      <li id="advice-source-3">Sletten et al. (2023). <a href="https://doi.org/10.1016/j.sleh.2023.07.016" target="_blank" rel="noopener noreferrer">${t('The importance of sleep regularity', 'Die Bedeutung regelmäßiger Schlafzeiten')}</a>. <em>Sleep Health.</em></li>
      <li id="advice-source-4">NHLBI / NIH. <a href="https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits" target="_blank" rel="noopener noreferrer">${t('Healthy sleep habits: meals and caffeine', 'Gesunde Schlafgewohnheiten: Mahlzeiten und Koffein')}</a>.</li>
      <li id="advice-source-5">WHO (2020). <a href="https://www.who.int/publications/i/item/9789240015128" target="_blank" rel="noopener noreferrer">${t('Guidelines on physical activity and sedentary behaviour', 'Leitlinien zu körperlicher Aktivität und sitzendem Verhalten')}</a>.</li>
    </ol><a href="methods.html#sleep-advice">${t('Evidence and scope', 'Evidenz und Geltungsbereich')}</a></details></div>
  </section>`;
}
