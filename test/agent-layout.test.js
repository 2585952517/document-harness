const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

test('exposes document harness skills through cross-agent repository entrypoints', () => {
  const codexPlugin = readJson('.codex-plugin/plugin.json');
  const claudePlugin = readJson('.claude-plugin/plugin.json');
  const geminiExtension = readJson('gemini-extension.json');
  const packageJson = readJson('package.json');

  assert.equal(codexPlugin.name, 'document-harness');
  assert.equal(codexPlugin.version, '0.1.0');
  assert.equal(codexPlugin.skills, './skills/');
  assert.equal(codexPlugin.interface.displayName, 'Document Harness');

  assert.equal(claudePlugin.name, 'document-harness');
  assert.equal(claudePlugin.version, '0.1.0');
  assert.equal(geminiExtension.name, 'document-harness');
  assert.equal(geminiExtension.version, '0.1.0');
  assert.equal(geminiExtension.contextFileName, 'GEMINI.md');

  assert.equal(packageJson.name, 'document-harness');
  assert.equal(packageJson.type, 'commonjs');
  assert.equal(packageJson.main, '.opencode/plugins/document-harness.mjs');

  for (const filePath of [
    'CLAUDE.md',
    'AGENTS.md',
    'GEMINI.md',
    '.codex/INSTALL.md',
    '.opencode/INSTALL.md',
    '.opencode/plugins/document-harness.mjs',
    'skills/document-harness/SKILL.md',
    'skills/harness-author/SKILL.md',
    'skills/promission-supervisor/SKILL.md',
  ]) {
    assert.ok(fs.existsSync(path.join(repoRoot, filePath)), `${filePath} should exist`);
  }
});

test('agent instructions route harness creation to the authoring skill', () => {
  const agentEntrypoints = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md'];

  for (const filePath of agentEntrypoints) {
    const content = read(filePath);
    assert.match(content, /harness-author/);
    assert.match(content, /harness\.yaml/);
  }

  const authorSkill = read('skills/harness-author/SKILL.md');
  assert.match(authorSkill, /^---\nname: harness-author\n/m);
  assert.match(authorSkill, /Use when .*harness\.yaml/i);
  assert.match(authorSkill, /Ask the user/i);
  assert.match(authorSkill, /Do not require the user to hand-write/i);
  assert.match(authorSkill, /explain/i);
});

test('agent instructions route promission supervision to the dedicated skill', () => {
  const agentEntrypoints = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md'];

  for (const filePath of agentEntrypoints) {
    const content = read(filePath);
    assert.match(content, /promission-supervisor/);
    assert.match(content, /document-harness/);
    assert.match(content, /document-harness\.lock/);
  }

  const supervisorSkill = read('skills/promission-supervisor/SKILL.md');
  assert.match(supervisorSkill, /^---\nname: promission-supervisor\n/m);
  assert.match(supervisorSkill, /Use when .*promission/i);
  assert.match(supervisorSkill, /Do not create missing/);
  assert.match(supervisorSkill, /update only/i);
});
