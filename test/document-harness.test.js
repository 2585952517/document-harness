const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { runHarness } = require('../src/documentHarness');

const repoRoot = path.resolve(__dirname, '..');
const harnessPath = path.join(repoRoot, 'harness.yaml');

function makeTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'document-harness-'));
  const projectDir = path.join(dir, 'example_project');

  fs.mkdirSync(path.join(projectDir, 'miss_md'), { recursive: true });
  fs.mkdirSync(path.join(projectDir, 'no_miss'), { recursive: true });

  fs.writeFileSync(path.join(projectDir, 'example.py'), '# empty\n');
  fs.writeFileSync(path.join(projectDir, 'miss_md', 'example.py'), '# empty\n');
  fs.writeFileSync(path.join(projectDir, 'no_miss', 'example.py'), '# empty\n');
  fs.writeFileSync(path.join(projectDir, 'no_miss', 'example_design.md'), '# empty\n');

  return { dir, projectDir, lockPath: path.join(dir, 'document-harness.lock') };
}

test('reports concise missing files and writes lock entries with promission content', () => {
  const { projectDir, lockPath } = makeTempProject();

  const output = runHarness({ harnessPath, projectDir, lockPath });

  assert.deepEqual(output, {
    missing: [
      {
        path: 'example_project/example_design.md',
        promission: {
          desc: '描述对应的实现的详细设计',
          verify: '对应设计和代码实现一致',
        },
      },
      {
        path: 'example_project/miss_md/example_design.md',
        promission: {
          desc: '描述对应的实现的详细设计',
          verify: '对应设计和代码实现一致',
        },
      },
    ],
  });

  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  assert.equal(lock.version, 1);
  assert.equal(Object.keys(lock.roots).length, 3);
  assert.equal(
    lock.roots['example_project/no_miss/example.py'].items[0].exists,
    true,
  );
  assert.deepEqual(
    lock.roots['example_project/example.py'].items[0].promission.desc,
    {
      content: '描述对应的实现的详细设计',
      status: 'pending',
    },
  );
});

test('uses lock result and preserves promission status when root hash is unchanged', () => {
  const { projectDir, lockPath } = makeTempProject();

  runHarness({ harnessPath, projectDir, lockPath });

  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  lock.roots['example_project/example.py'].items[0].promission.desc.status = 'done';
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  fs.writeFileSync(path.join(projectDir, 'example_design.md'), '# added later\n');

  const output = runHarness({ harnessPath, projectDir, lockPath });
  const nextLock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

  assert.equal(
    nextLock.roots['example_project/example.py'].items[0].promission.desc.status,
    'done',
  );
  assert.deepEqual(
    output.missing.map((item) => item.path),
    ['example_project/example_design.md', 'example_project/miss_md/example_design.md'],
  );
});

test('recomputes a root entry after its hash changes', () => {
  const { projectDir, lockPath } = makeTempProject();

  runHarness({ harnessPath, projectDir, lockPath });
  fs.writeFileSync(path.join(projectDir, 'example_design.md'), '# added later\n');
  fs.appendFileSync(path.join(projectDir, 'example.py'), 'print("changed")\n');

  const output = runHarness({ harnessPath, projectDir, lockPath });
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

  assert.deepEqual(
    output.missing.map((item) => item.path),
    ['example_project/miss_md/example_design.md'],
  );
  assert.equal(lock.roots['example_project/example.py'].items[0].exists, true);
  assert.equal(
    lock.roots['example_project/example.py'].items[0].promission.desc.status,
    'pending',
  );
});

test('indexes files once instead of checking required files per root', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'document-harness-many-'));
  const projectDir = path.join(dir, 'example_project');
  const lockPath = path.join(dir, 'document-harness.lock');
  const rootCount = 2000;

  fs.mkdirSync(projectDir, { recursive: true });

  for (let index = 0; index < rootCount; index += 1) {
    const name = `file_${String(index).padStart(4, '0')}`;
    fs.writeFileSync(path.join(projectDir, `${name}.py`), '# empty\n');

    if (index % 2 === 0) {
      fs.writeFileSync(path.join(projectDir, `${name}_design.md`), '# design\n');
    }
  }

  const originalExistsSync = fs.existsSync;
  let existsSyncCalls = 0;

  fs.existsSync = (...args) => {
    existsSyncCalls += 1;
    return originalExistsSync(...args);
  };

  try {
    const output = runHarness({ harnessPath, projectDir, lockPath });

    assert.equal(output.missing.length, rootCount / 2);
    assert.ok(
      existsSyncCalls <= 1,
      `expected required-file checks to use the file index, got ${existsSyncCalls} existsSync calls`,
    );
  } finally {
    fs.existsSync = originalExistsSync;
  }
});
