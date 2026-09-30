// Per-file commit history from the content repo, when it is a Git checkout.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function findGitRoot(dir) {
  let cur = path.resolve(dir);
  for (;;) {
    if (fs.existsSync(path.join(cur, '.git'))) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) return null;
    cur = parent;
  }
}

// Returns Map<relativePathFromContentDir, [{hash, date, subject, author}]> newest first, or null when not a repo.
export function fileHistories(contentDir, { max = 1000 } = {}) {
  const gitRoot = findGitRoot(contentDir);
  if (!gitRoot) return null;
  const prefix = path.relative(gitRoot, path.resolve(contentDir)).split(path.sep).join('/');
  let out;
  try {
    out = execFileSync('git', ['log', `--max-count=${max}`, '--name-only', '--date=short', '--format=%x1e%h%x1f%ad%x1f%an%x1f%s', '--', prefix || '.'], {
      cwd: gitRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024
    });
  } catch {
    return null;
  }
  const map = new Map();
  for (const block of out.split('\x1e')) {
    if (!block.trim()) continue;
    const [header, ...rest] = block.split('\n');
    const [hash, date, author, subject] = header.split('\x1f');
    for (const line of rest) {
      const f = line.trim();
      if (!f) continue;
      const rel = prefix && f.startsWith(prefix + '/') ? f.slice(prefix.length + 1) : f;
      if (!map.has(rel)) map.set(rel, []);
      map.get(rel).push({ hash, date, author, subject });
    }
  }
  return map;
}
