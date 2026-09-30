// Install-ready single files and zips for folder artefacts.
import fs from 'node:fs';
import path from 'node:path';
import { zipSync } from 'fflate';

export function buildZip(artifact) {
  const files = {};
  const entryName = artifact.entryFile;
  for (const f of artifact.files) {
    const data = f.path === entryName ? Buffer.from(artifact.installText, 'utf8') : fs.readFileSync(f.absPath);
    files[f.path] = [new Uint8Array(data), { mtime: new Date(`${artifact.updated || '2026-01-01'}T00:00:00Z`) }];
  }
  return zipSync(files, { level: 6 });
}

export function writeDownloads(model, outDir) {
  const dir = path.join(outDir, 'downloads');
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const a of model.artifacts) {
    fs.writeFileSync(path.join(dir, a.downloadName), a.installText);
    n++;
    if (a.isFolder) { fs.writeFileSync(path.join(dir, `${a.id}.zip`), buildZip(a)); n++; }
  }
  return n;
}
