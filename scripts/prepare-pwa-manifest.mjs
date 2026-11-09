import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/** Keep the HTML prefetched per version, but allow the hosting provider to annotate it. */
export function prepareManifest(manifest) {
  const index = manifest.index;
  if (index !== '/index.html' || !manifest.hashTable?.[index] ||
      !manifest.assetGroups?.some(group => group.installMode === 'prefetch' && group.urls?.includes(index))) {
    throw new Error('Unexpected Angular manifest: index must be hashed and prefetched before preparation.');
  }
  const prepared = structuredClone(manifest);
  delete prepared.hashTable[index];
  return prepared;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = new URL('../dist/Nubisfera/browser/ngsw.json', import.meta.url);
  const manifest = prepareManifest(JSON.parse(await readFile(file, 'utf8')));
  await writeFile(file, JSON.stringify(manifest, null, 2) + '\n');
  console.log('PWA manifest: HTML prefetched without a hash; JS, CSS and other asset hashes preserved.');
}
