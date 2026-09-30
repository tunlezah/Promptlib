#!/usr/bin/env node
// Clones (or updates) the content repo so `npm run build` can read it. Used by CI and for local work with a Git URL.
//   CONTENT_GIT_URL=https://gitlab.example.com/group/content.git node scripts/fetch-content.js
// In GitLab CI with no URL set it uses CI_JOB_TOKEN and content.host/project from site.config.yml.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadConfig } from './lib/config.js';

const env = process.env;
const cfg = loadConfig();
const target = path.resolve(env.CONTENT_PATH && env.CONTENT_PATH !== 'content-starter' ? env.CONTENT_PATH : '.content-cache/content');
const ref = env.CONTENT_GIT_REF || cfg.content.branch;
const depth = Number(env.CONTENT_CLONE_DEPTH || 0);

function resolveUrl() {
  if (env.CONTENT_GIT_URL) return { url: env.CONTENT_GIT_URL, how: 'CONTENT_GIT_URL' };
  const host = (env.CONTENT_HOST || cfg.content.host || '').replace(/\/$/, '');
  const project = env.CONTENT_PROJECT || cfg.content.project;
  if (!host || !project) throw new Error('Set CONTENT_GIT_URL, or content.host and content.project in site.config.yml (or CONTENT_HOST / CONTENT_PROJECT).');
  const u = new URL(host);
  if (env.CONTENT_DEPLOY_TOKEN) {
    const user = env.CONTENT_DEPLOY_TOKEN_USER || 'gitlab+deploy-token';
    return { url: `${u.protocol}//${encodeURIComponent(user)}:${encodeURIComponent(env.CONTENT_DEPLOY_TOKEN)}@${u.host}/${project}.git`, how: 'deploy token' };
  }
  if (env.CI_JOB_TOKEN) return { url: `${u.protocol}//gitlab-ci-token:${env.CI_JOB_TOKEN}@${u.host}/${project}.git`, how: 'CI_JOB_TOKEN' };
  return { url: `${host}/${project}.git`, how: 'anonymous (public project)' };
}

const redact = (s) => s.replace(/\/\/([^/@]+)@/, '//***@');

try {
  const { url, how } = resolveUrl();
  const git = (a, cwd) => execFileSync('git', a, { cwd, stdio: ['ignore', 'inherit', 'inherit'] });
  if (fs.existsSync(path.join(target, '.git'))) {
    console.log(`Updating ${path.relative(process.cwd(), target)} from ${redact(url)} (${how}), ref ${ref}`);
    git(['remote', 'set-url', 'origin', url], target);
    git(['fetch', '--quiet', ...(depth ? ['--depth', String(depth)] : []), 'origin', ref], target);
    git(['checkout', '--quiet', '--force', 'FETCH_HEAD'], target);
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    console.log(`Cloning ${redact(url)} (${how}), ref ${ref} → ${path.relative(process.cwd(), target)}`);
    git(['clone', '--quiet', ...(depth ? ['--depth', String(depth)] : []), '--branch', ref, url, target]);
  }
  const root = path.join(target, cfg.content.root);
  if (!fs.existsSync(root)) throw new Error(`Cloned, but ${cfg.content.root}/ was not found in the repo. Check content.root in site.config.yml.`);
  console.log(`✔ Content ready. Build with: CONTENT_PATH=${path.relative(process.cwd(), target)} npm run build`);
  if (env.GITHUB_ENV) fs.appendFileSync(env.GITHUB_ENV, `CONTENT_PATH=${target}\n`);
} catch (e) {
  console.error(`✖ ${redact(e.message || String(e))}`);
  process.exit(1);
}
