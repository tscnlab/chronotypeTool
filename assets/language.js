// Language is shareable in the URL; questionnaire answers never enter the URL.
export function languageFromSearch(search) {
  return new URLSearchParams(search).get('lang')?.toLowerCase() === 'de' ? 'de' : 'en';
}

export function languageUrl(href, language) {
  const url = new URL(href);
  url.searchParams.set('lang', language === 'de' ? 'de' : 'en');
  return url.href;
}
