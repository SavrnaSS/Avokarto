import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(filename, overrides = {}) {
  const loadedModule = { exports: {} };
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../${filename}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  runInNewContext(outputText, {
    module: loadedModule, exports: loadedModule.exports, URLSearchParams, URL, process: { env: {} },
    require(name) {
      if (name in overrides) return overrides[name];
      if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`, overrides);
      return require(name);
    },
  });
  return loadedModule.exports;
}

const { classifySource, withShareRef, TRAFFIC_SOURCES } = load('lib/storeTraffic.ts');

test('a share tag beats the referrer, so WhatsApp visits are credited without one', () => {
  assert.equal(classifySource('?ref=whatsapp', '', 'shop.test'), 'whatsapp');
  assert.equal(classifySource('?utm_source=IG', 'https://www.google.com/', 'shop.test'), 'instagram');
  assert.equal(classifySource('?ref=yt', '', 'shop.test'), 'youtube');
  assert.equal(classifySource('?ref=newsletter', '', 'shop.test'), 'other');
});

test('referrer hosts map to their network; own-site and missing referrers are direct', () => {
  assert.equal(classifySource('', 'https://l.instagram.com/?u=x', 'shop.test'), 'instagram');
  assert.equal(classifySource('', 'https://m.facebook.com/', 'shop.test'), 'facebook');
  assert.equal(classifySource('', 'https://www.google.co.in/', 'shop.test'), 'google');
  assert.equal(classifySource('', 'https://web.whatsapp.com/', 'shop.test'), 'whatsapp');
  assert.equal(classifySource('', 'https://youtu.be/abc', 'shop.test'), 'youtube');
  assert.equal(classifySource('', 'https://blog.example.org/post', 'shop.test'), 'other');
  assert.equal(classifySource('', 'https://shop.test/some-product', 'SHOP.test'), 'direct');
  assert.equal(classifySource('', '', 'shop.test'), 'direct');
  assert.equal(classifySource('', 'not a url', 'shop.test'), 'direct');
});

test('lookalike hosts are not mistaken for a network', () => {
  assert.equal(classifySource('', 'https://notfacebook.com/', 'shop.test'), 'other');
  assert.equal(classifySource('', 'https://instagram.com.evil.example/', 'shop.test'), 'other');
});

test('every classification is a value the events API and database accept', () => {
  const inputs = [['?ref=wa', ''], ['', 'https://fb.me/x'], ['', 'https://example.com'], ['', '']];
  for (const [search, referrer] of inputs) assert.ok(TRAFFIC_SOURCES.includes(classifySource(search, referrer, 'shop.test')));
});

test('share links get a ref tag that replaces any existing one and keeps the path', () => {
  assert.equal(withShareRef('https://shop.test/store/meera/scarf', 'whatsapp'), 'https://shop.test/store/meera/scarf?ref=whatsapp');
  assert.equal(withShareRef('https://shop.test/?ref=ig&x=1', 'whatsapp'), 'https://shop.test/?ref=whatsapp&x=1');
  assert.equal(withShareRef('/relative', 'whatsapp'), '/relative');
});
