import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';

// Generate real PNG icons without an extra build dependency.
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(name, data) {
  const type = Buffer.from(name);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([size, type, data, crc]);
}
function icon(size) {
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  const colors = [[244,114,182], [250,204,21], [56,189,248]];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = [15,23,42];
      if (Math.hypot(x / size - .5, y / size - .5) < .34) color = [253,242,248];
      for (let i = 0; i < 3; i++) {
        const cx = [.38,.62,.5][i], cy = [.43,.43,.64][i];
        if (Math.hypot(x / size - cx, y / size - cy) < .105) color = colors[i];
      }
      const offset = y * (size * 4 + 1) + 1 + x * 4;
      pixels.set([...color, 255], offset);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
for (const size of [192, 512]) await writeFile('dist/icon-' + size + '.png', icon(size));

async function walk(directory, prefix = '') {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) paths.push(...await walk(directory + '/' + entry.name, name + '/'));
    else if (name !== 'sw.js') paths.push(name);
  }
  return paths.sort();
}
const paths = await walk('dist');
const hash = createHash('sha256');
for (const path of paths) {
  hash.update(path);
  hash.update(await readFile('dist/' + path));
}
const template = await readFile('public/sw.js', 'utf8');
await writeFile('dist/sw.js', template
  .replace('__BUILD_REVISION__', hash.digest('hex').slice(0, 20))
  .replace('[] /* __PRECACHE__ */', JSON.stringify(paths.map(path => '/' + path))));
console.log('PWA: ' + paths.length + ' resources prepared for offline use.');
