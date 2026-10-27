import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scaffold } from './cli.js';

test('scaffold copies the template, renames _gitignore and fills the name', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'cnss-')), 'my-api');
  scaffold(dir);
  assert.ok(existsSync(join(dir, '.gitignore')));
  assert.ok(!existsSync(join(dir, '_gitignore')));
  assert.equal(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).name, 'my-api');
  assert.ok(existsSync(join(dir, 'src/server.ts')));
  assert.ok(!readFileSync(join(dir, 'src/app.ts'), 'utf8').includes('{{name}}'));
});

test('refuses a non-empty directory and bad names', () => {
  const base = mkdtempSync(join(tmpdir(), 'cnss-'));
  writeFileSync(join(base, 'x'), '1');
  assert.throws(() => scaffold(base, 'ok'), /not empty/);
  assert.throws(() => scaffold(join(base, 'sub'), 'Bad Name'), /Invalid project name/);
});
