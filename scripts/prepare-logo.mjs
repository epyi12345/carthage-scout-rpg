import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const sourcePath = resolve('scripts/assets/logo_ref_heick_games_full.png.base64');
const outputPath = resolve('public/assets/logos/logo_ref_heick_games_full.png');

const encodedLogo = await readFile(sourcePath, 'utf8');
const logoBytes = Buffer.from(encodedLogo.replace(/\s+/g, ''), 'base64');

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, logoBytes);

console.log(`Prepared splash logo: ${outputPath}`);
