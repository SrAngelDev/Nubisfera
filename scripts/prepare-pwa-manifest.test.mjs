import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareManifest } from './prepare-pwa-manifest.mjs';

const fixture = () => ({ index: '/index.html', timestamp: 123,
  assetGroups: [{ name: 'app', installMode: 'prefetch', urls: ['/index.html', '/main-123.js', '/styles-123.css'] }],
  hashTable: { '/index.html': 'html-hash', '/main-123.js': 'js-hash', '/styles-123.css': 'css-hash' }
});

test('only removes the transformable HTML hash, preserving prefetch and all other integrity hashes', () => {
  const original = fixture(); const prepared = prepareManifest(original);
  assert.deepEqual(prepared.hashTable, { '/main-123.js': 'js-hash', '/styles-123.css': 'css-hash' });
  assert.deepEqual(prepared.assetGroups, original.assetGroups);
  assert.equal(prepared.timestamp, original.timestamp);
  assert.equal(original.hashTable['/index.html'], 'html-hash');
});

test('fails the build instead of silently producing an unexpected or uncached entry point', () => {
  assert.throws(() => prepareManifest({ ...fixture(), index: '/other.html' }));
  assert.throws(() => prepareManifest({ ...fixture(), assetGroups: [] }));
  assert.throws(() => prepareManifest({ ...fixture(), hashTable: {} }));
});
