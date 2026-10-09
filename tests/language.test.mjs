import { test } from 'node:test';
import assert from 'node:assert/strict';
import { languageFromSearch, languageUrl } from '../assets/language.js';

test('direct language links select German or English, with a safe English default',()=>{
  assert.equal(languageFromSearch('?lang=de'),'de');
  assert.equal(languageFromSearch('?lang=DE'),'de');
  for(const search of ['', '?lang=en', '?lang=fr', '?lang=', '?other=de']) {
    assert.equal(languageFromSearch(search),'en');
  }
});
test('switching languages preserves the project path, existing parameters and anchor',()=>{
  const href='https://example.org/chronotypeTool/index.html?event=student&lang=en#questionnaire';
  const german=languageUrl(href,'de');
  assert.equal(german,'https://example.org/chronotypeTool/index.html?event=student&lang=de#questionnaire');
  assert.equal(languageFromSearch(new URL(german).search),'de');
  assert.equal(languageUrl(german,'en'),href);
});
test('a bookmarked selection survives a fresh URL read without storing answers',()=>{
  const url=new URL(languageUrl('https://example.org/chronotypeTool/','de'));
  assert.deepEqual([...url.searchParams],[['lang','de']]);
  assert.equal(languageFromSearch(url.search),'de');
  assert.equal(languageUrl(url.href,'unsupported'),'https://example.org/chronotypeTool/?lang=en');
});
