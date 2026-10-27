#!/usr/bin/env node
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const template = fileURLToPath(new URL('./template', import.meta.url));

export function scaffold(target, name = basename(resolve(target))) {
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) throw new Error(`Invalid project name "${name}". Use lowercase letters, digits, - . _`);
  const dest = resolve(target);
  if (existsSync(dest) && readdirSync(dest).length) throw new Error(`Directory ${dest} is not empty`);
  cpSync(template, dest, { recursive: true });
  // npm drops .gitignore from published packages, so it ships as _gitignore.
  renameSync(join(dest, '_gitignore'), join(dest, '.gitignore'));
  (function fill(dir) {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) fill(p);
      else writeFileSync(p, readFileSync(p, 'utf8').replaceAll('{{name}}', name));
    }
  })(dest);
  return dest;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const target = process.argv[2];
  if (!target || target.startsWith('-')) {
    console.log('Usage: npm create node-service-starter <project-name>\n   or: npx create-node-service-starter <project-name>');
    process.exit(target ? 0 : 1);
  }
  try {
    scaffold(target);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  console.log(`\nCreated ${target}\n\n  cd ${target}\n  cp .env.example .env\n  npm install\n  npm run dev\n\nThen open http://localhost:3000/health\n`);
}
