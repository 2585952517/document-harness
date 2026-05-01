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
    '.claude-plugin/INSTALL.md',
    '.claude-plugin/marketplace.json',
    '.opencode/INSTALL.md',
    '.opencode/plugins/document-harness.mjs',
    'agents/maintainer.md',
    'memory/project-understanding.md',
    'skills/document-harness/SKILL.md',
    'skills/harness-author/SKILL.md',
    'skills/promission-supervisor/SKILL.md',
  ]) {
    assert.ok(fs.existsSync(path.join(repoRoot, filePath)), `${filePath} should exist`);
  }
});

test('keeps plugin identity metadata synchronized across supported agents', () => {
  const codexPlugin = readJson('.codex-plugin/plugin.json');
  const claudePlugin = readJson('.claude-plugin/plugin.json');
  const claudeMarketplace = readJson('.claude-plugin/marketplace.json');
  const geminiExtension = readJson('gemini-extension.json');
  const packageJson = readJson('package.json');

  const manifests = [codexPlugin, claudePlugin, geminiExtension, packageJson];

  for (const manifest of manifests) {
    assert.equal(manifest.name, 'document-harness');
    assert.equal(manifest.version, '0.1.0');
    assert.deepEqual(manifest.author, { name: 'whereslow' });
    assert.match(manifest.description, /Document Harness/i);
    assert.match(manifest.description, /promission/i);
    assert.equal(manifest.homepage, 'https://github.com/whereslow/document-harness');
    assert.equal(manifest.repository, 'https://github.com/whereslow/document-harness');
    assert.equal(manifest.license, 'MIT');
    assert.ok(manifest.keywords.includes('skills'));
    assert.ok(manifest.keywords.includes('promission'));
  }

  assert.equal(packageJson.license, 'MIT');
  assert.equal(codexPlugin.interface.displayName, 'Document Harness');
  assert.equal(claudeMarketplace.name, 'document-harness');
  assert.equal(claudeMarketplace.owner.name, 'whereslow');
  assert.deepEqual(claudeMarketplace.plugins, [
    {
      name: 'document-harness',
      description: 'Document Harness skills for document contract validation and promission supervision in Claude Code.',
      version: '0.1.0',
      source: './',
      author: { name: 'whereslow' },
    },
  ]);
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

test('harness author does not treat repository examples as the default contract model', () => {
  const authorSkill = read('skills/harness-author/SKILL.md');

  assert.match(authorSkill, /Do not infer Python/i);
  assert.match(authorSkill, /neutral template/i);
  assert.match(authorSkill, /<root-pattern>/);
  assert.match(authorSkill, /<required-name>/);
  assert.doesNotMatch(authorSkill, /Use this shape as the starting point:[\s\S]*"\*\.py"/);
  assert.doesNotMatch(authorSkill, /Use this shape as the starting point:[\s\S]*\*_design/);
  assert.doesNotMatch(authorSkill, /This harness says: every `\*\.py` file is a root/);
  assert.doesNotMatch(authorSkill, /\*\.py/);
  assert.doesNotMatch(authorSkill, /\*_design/);
  assert.doesNotMatch(authorSkill, /sibling design documents/i);
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

test('defines a document harness maintainer subagent for delegated maintenance work', () => {
  const maintainerAgent = read('agents/maintainer.md');

  assert.match(maintainerAgent, /^---\nname: maintainer\n/m);
  assert.match(maintainerAgent, /document-harness\.lock/);
  assert.match(maintainerAgent, /invalid/i);
  assert.match(maintainerAgent, /necessary/i);
  assert.match(maintainerAgent, /move, rename, edit, or remove/i);
  assert.match(maintainerAgent, /create .*companion/i);
  assert.match(maintainerAgent, /update .*document-harness\.lock/i);
});

test('promission supervisor delegates file maintenance decisions to maintainer subagent', () => {
  const supervisorSkill = read('skills/promission-supervisor/SKILL.md');
  const entrypoints = [
    read('CLAUDE.md'),
    read('AGENTS.md'),
    read('GEMINI.md'),
    read('.claude-plugin/INSTALL.md'),
    read('.codex/INSTALL.md'),
    read('.opencode/INSTALL.md'),
    read('.opencode/plugins/document-harness.mjs'),
  ].join('\n');

  assert.match(supervisorSkill, /document-harness:maintainer/);
  assert.match(supervisorSkill, /delegate/i);
  assert.match(supervisorSkill, /invalid .*move, rename, edit, or remove/i);
  assert.match(supervisorSkill, /necessary .*create .*companion/i);
  assert.match(supervisorSkill, /update .*document-harness\.lock/i);
  assert.match(entrypoints, /document-harness:maintainer/);
});

test('promission maintenance uses project memory and harness semantics before changing files', () => {
  const supervisorSkill = read('skills/promission-supervisor/SKILL.md');
  const maintainerAgent = read('agents/maintainer.md');
  const memory = read('memory/project-understanding.md');
  const entrypoints = [
    read('CLAUDE.md'),
    read('AGENTS.md'),
    read('GEMINI.md'),
    read('.claude-plugin/INSTALL.md'),
    read('.codex/INSTALL.md'),
    read('.opencode/INSTALL.md'),
    read('.opencode/plugins/document-harness.mjs'),
  ].join('\n');

  for (const content of [supervisorSkill, maintainerAgent]) {
    assert.match(content, /memory\/project-understanding\.md/);
    assert.match(content, /harness\.yaml/);
    assert.match(content, /target project/i);
    assert.match(content, /project perspective/i);
    assert.match(content, /project essence/i);
    assert.match(content, /update .*memory/i);
    assert.match(content, /read .*harness\.yaml/i);
    assert.match(content, /what .*means/i);
    assert.match(content, /inline .*other file/i);
    assert.match(content, /delete/i);
    assert.match(content, /move/i);
    assert.match(content, /not .*mechanically/i);
    assert.match(content, /before .*change/i);
  }

  assert.match(supervisorSkill, /delegate .*memory/i);
  assert.match(supervisorSkill, /If .*project essence .*changes.*update .*memory/i);
  assert.match(entrypoints, /memory\/project-understanding\.md/);
  assert.match(entrypoints, /project essence/i);

  assert.match(memory, /^# Project Understanding Memory/m);
  assert.match(memory, /Project Essence/);
  assert.match(memory, /Harness Semantics/);
  assert.match(memory, /Maintenance Decisions/);
  assert.match(memory, /Target Project/);
  assert.match(memory, /File Existence Policy/);
  assert.match(memory, /Update this file/);
});
