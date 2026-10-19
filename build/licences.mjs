// Writes ../licenses.txt after each build: every open-source package esbuild
// bundled into app.js (from meta.json, so the list can't fall behind), with
// its full licence text, plus the fonts' licence. Linked from About → Credits.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const meta = JSON.parse(readFileSync('meta.json', 'utf8'));
const version = readFileSync('../src/app.jsx', 'utf8').match(/const VERSION = '([^']+)'/)[1];
const names = new Set();
for (const out of Object.values(meta.outputs))
  for (const [file, i] of Object.entries(out.inputs)) {
    const m = file.match(/node_modules\/((?:@[^/]+\/)?[^/]+)\//);
    if (m && i.bytesInOutput > 0) names.add(m[1]);
  }
const parts = [...names].sort().map((name) => {
  const dir = join('node_modules', name);
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const files = readdirSync(dir).filter((f) => /^(LICEN[CS]E|NOTICE)/i.test(f));
  if (!files.some((f) => /^LICEN/i.test(f))) throw new Error(`No licence file for ${name}`);
  return { name, version: pkg.version, licence: pkg.license, home: pkg.homepage || `https://www.npmjs.com/package/${name}`, texts: files.map((f) => readFileSync(join(dir, f), 'utf8').trim()) };
});
const rule = '='.repeat(72);
const text = [
  `Metronome ${version} — licences`,
  '',
  'Metronome is free and open source: https://github.com/Hubert-BitScribbles/Metronome',
  'Its own code is under the MIT licence (in the repository). The names "Metronome"',
  'and "bitScribbles" and the logos are not covered by it. The clicks are made in',
  'the browser by Metronome itself; there are no sound files.',
  '',
  'It is built with these open-source components, each under its own licence:',
  '',
  ...parts.map((p) => `  ${p.name} ${p.version} (${p.licence}) — ${p.home}`),
  '  Fonts: Space Grotesk, Inter, JetBrains Mono and Caveat (OFL-1.1)',
  '',
  ...parts.flatMap((p) => [rule, `${p.name} ${p.version}`, rule, '', ...p.texts.flatMap((x) => [x, ''])]),
  rule, 'Fonts: Space Grotesk, Inter, JetBrains Mono and Caveat (fonts/OFL.txt)', rule, '',
  readFileSync('../fonts/OFL.txt', 'utf8').trim(), '',
].join('\n');
// A byte-order mark, so browsers read it as UTF-8 whatever the server says.
writeFileSync('../licenses.txt', '﻿' + text);
console.log(`licenses.txt: ${parts.map((p) => p.name).join(', ')}, fonts`);
