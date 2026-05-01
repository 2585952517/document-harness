const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const LOCK_VERSION = 1;

function runHarness(options = {}) {
  const cwd = options.cwd || process.cwd();
  const harnessPath = path.resolve(cwd, options.harnessPath || 'harness.yaml');
  const projectDir = path.resolve(cwd, options.projectDir || 'example_project');
  const lockPath = path.resolve(cwd, options.lockPath || 'document-harness.lock');

  const harness = compileHarness(parseHarness(fs.readFileSync(harnessPath, 'utf8')));
  const previousLock = readLock(lockPath);
  const fileIndex = indexFiles(projectDir);
  const rootFiles = findRootFiles(projectDir, fileIndex, harness.documentRoot);
  const nextLock = { version: LOCK_VERSION, roots: {} };

  for (const root of rootFiles) {
    const rootKey = projectPath(projectDir, root.relativePath);
    const hash = hashFile(root.absolutePath);
    const previousRoot = previousLock.roots[rootKey];

    if (previousRoot && previousRoot.hash === hash) {
      nextLock.roots[rootKey] = previousRoot;
      continue;
    }

    nextLock.roots[rootKey] = buildRootEntry({
      harness,
      projectDir,
      fileIndex,
      rootRelativePath: root.relativePath,
      hash,
    });
  }

  writeJson(lockPath, nextLock);

  return outputFromLock(nextLock);
}

function parseHarness(source) {
  const lines = cleanYamlLines(source);

  return {
    documentRoot: readTopLevelSequence(lines, 'document_root'),
    documentChains: readDocumentChains(lines),
  };
}

function compileHarness(harness) {
  return {
    documentRoot: harness.documentRoot.map(createPathMatcher),
    documentChains: Object.entries(harness.documentChains).map(([pattern, variants]) => ({
      matcher: createPathMatcher(pattern),
      variants: variants.map((variant) => ({
        ...variant,
        pathMatcher: createPathMatcher(variant.variantRequire.path || '*'),
      })),
    })),
  };
}

function cleanYamlLines(source) {
  return source
    .split(/\r?\n/)
    .map((raw) => {
      const withoutComment = stripComment(raw).trimEnd();
      return {
        indent: withoutComment.match(/^ */)[0].length,
        text: withoutComment.trim(),
      };
    })
    .filter((line) => line.text.length > 0);
}

function stripComment(line) {
  let quote = null;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if ((char === '"' || char === "'") && line[index - 1] !== '\\') {
      quote = quote === char ? null : quote || char;
      continue;
    }

    if (char === '#' && quote === null) {
      return line.slice(0, index);
    }
  }

  return line;
}

function readTopLevelSequence(lines, key) {
  const start = lines.findIndex((line) => line.indent === 0 && line.text === `${key}:`);

  if (start === -1) {
    return [];
  }

  const values = [];

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.indent === 0) {
      break;
    }

    if (line.text.startsWith('- ')) {
      values.push(parseScalar(line.text.slice(2).trim()));
    }
  }

  return values;
}

function readDocumentChains(lines) {
  const start = lines.findIndex(
    (line) => line.indent === 0 && line.text === 'document_chains:',
  );
  const chains = {};

  if (start === -1) {
    return chains;
  }

  for (let index = start + 1; index < lines.length;) {
    const line = lines[index];

    if (line.indent === 0) {
      break;
    }

    const keyValue = splitKeyValue(line.text);
    if (line.indent === 2 && keyValue && keyValue.value === '') {
      const chainKey = parseScalar(keyValue.key);
      let end = index + 1;

      while (end < lines.length && lines[end].indent > line.indent) {
        end += 1;
      }

      chains[chainKey] = parseChainBlock(lines.slice(index + 1, end));
      index = end;
      continue;
    }

    index += 1;
  }

  return chains;
}

function parseChainBlock(lines) {
  const variants = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index];

    if (line.text === 'variant_require:') {
      let end = index + 1;

      while (end < lines.length && lines[end].text !== 'variant_require:') {
        end += 1;
      }

      const variantLines = lines.slice(index, end);
      variants.push({
        variantRequire: parseVariantRequire(variantLines, line.indent),
        documents: parseDocumentHarness(variantLines),
      });
      index = end;
      continue;
    }

    index += 1;
  }

  return variants;
}

function parseVariantRequire(lines, baseIndent) {
  const variantRequire = {};

  for (const line of lines.slice(1)) {
    if (line.text === 'document_harness:') {
      break;
    }

    if (line.indent <= baseIndent) {
      continue;
    }

    const keyValue = splitKeyValue(line.text);
    if (!keyValue || keyValue.value === '') {
      continue;
    }

    if (['name', 'path', 'priority'].includes(keyValue.key)) {
      variantRequire[keyValue.key] = parseScalar(keyValue.value);
    }
  }

  return variantRequire;
}

function parseDocumentHarness(lines) {
  const documents = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.text !== '- document:') {
      continue;
    }

    const document = {};

    for (let next = index + 1; next < lines.length; next += 1) {
      const child = lines[next];

      if (child.indent <= line.indent) {
        break;
      }

      const keyValue = splitKeyValue(child.text);
      if (!keyValue || keyValue.value === '') {
        continue;
      }

      document[keyValue.key] = parseScalar(keyValue.value);
    }

    documents.push(document);
  }

  return documents;
}

function splitKeyValue(text) {
  let quote = null;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if ((char === '"' || char === "'") && text[index - 1] !== '\\') {
      quote = quote === char ? null : quote || char;
      continue;
    }

    if (char === ':' && quote === null) {
      return {
        key: text.slice(0, index).trim(),
        value: text.slice(index + 1).trim(),
      };
    }
  }

  return null;
}

function parseScalar(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }

  return value;
}

function indexFiles(projectDir) {
  const files = listFiles(projectDir).sort();

  return {
    files,
    fileSet: new Set(files),
  };
}

function findRootFiles(projectDir, fileIndex, matchers) {
  return fileIndex.files
    .filter((relativePath) =>
      matchers.some((matcher) => matcher.test(relativePath)),
    )
    .map((relativePath) => ({
      relativePath,
      absolutePath: path.join(projectDir, relativePath),
    }));
}

function listFiles(dir) {
  const files = [];

  function visit(currentDir, prefix = '') {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const relativePath = toPosix(path.join(prefix, entry.name));
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        visit(absolutePath, relativePath);
        continue;
      }

      if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  }

  visit(dir);
  return files;
}

function buildRootEntry({ harness, projectDir, fileIndex, rootRelativePath, hash }) {
  const items = [];
  const variants = matchingChainVariants(harness, rootRelativePath);
  const rootStem = stem(rootRelativePath);

  for (const variant of variants) {
    const seed = variant.seed || rootStem;

    for (const document of variant.documents) {
      const requiredRelativePath = requiredDocumentPath(rootRelativePath, document, seed);
      const requiredKey = projectPath(projectDir, requiredRelativePath);

      items.push({
        path: requiredKey,
        exists: fileIndex.fileSet.has(requiredRelativePath),
        promission: promissionEntries(document),
      });
    }
  }

  return {
    hash,
    items,
  };
}

function matchingChainVariants(harness, rootRelativePath) {
  const selected = [];

  for (const chain of harness.documentChains) {
    if (!chain.matcher.test(rootRelativePath)) {
      continue;
    }

    const variant = selectVariant(chain.variants, rootRelativePath);
    if (variant) {
      selected.push(variant);
    }
  }

  return selected;
}

function selectVariant(variants, rootRelativePath) {
  const rootStem = stem(rootRelativePath);
  const rootDir = toPosix(path.dirname(rootRelativePath));
  const pathCandidates = variants.filter((variant) =>
    variant.pathMatcher.test(rootRelativePath) ||
    variant.pathMatcher.test(rootDir),
  );

  const exactMatches = pathCandidates
    .map((variant) => ({
      ...variant,
      seed: seedFromPattern(variant.variantRequire.name, rootStem, true),
    }))
    .filter((variant) => variant.seed !== null);

  const fallbackMatches = pathCandidates
    .filter((variant) => String(variant.variantRequire.name || '').includes('*'))
    .map((variant) => ({
      ...variant,
      seed: rootStem,
    }));

  const candidates = exactMatches.length > 0 ? exactMatches : fallbackMatches;

  if (candidates.length === 0) {
    return null;
  }

  assertUniquePriorities(candidates);
  return candidates.sort(
    (left, right) =>
      Number(right.variantRequire.priority || 0) - Number(left.variantRequire.priority || 0),
  )[0];
}

function assertUniquePriorities(variants) {
  const seen = new Map();

  for (const variant of variants) {
    const priority = Number(variant.variantRequire.priority || 0);

    if (seen.has(priority)) {
      throw new Error(`duplicate variant priority: ${priority}`);
    }

    seen.set(priority, true);
  }
}

function seedFromPattern(pattern, value, strict) {
  if (!pattern || !String(pattern).includes('*')) {
    return pattern === value ? value : null;
  }

  const [prefix, suffix] = String(pattern).split('*');

  if (value.startsWith(prefix) && value.endsWith(suffix)) {
    return value.slice(prefix.length, value.length - suffix.length);
  }

  return strict ? null : value;
}

function requiredDocumentPath(rootRelativePath, document, seed) {
  const rootDir = path.posix.dirname(rootRelativePath);
  const name = fillTemplate(document.name, seed);
  const type = document.type || '';
  const documentFileName = `${name}${type}`;
  const relativeDir = normalizeDocumentDir(rootDir, document.path || './');

  return toPosix(path.posix.normalize(path.posix.join(relativeDir, documentFileName)));
}

function normalizeDocumentDir(rootDir, documentPath) {
  if (documentPath === './' || documentPath === '.') {
    return rootDir === '.' ? '' : rootDir;
  }

  return path.posix.normalize(path.posix.join(rootDir === '.' ? '' : rootDir, documentPath));
}

function fillTemplate(pattern, seed) {
  return String(pattern || '').replaceAll('*', seed);
}

function promissionEntries(document) {
  const entries = {};

  for (const [key, value] of Object.entries(document)) {
    if (['name', 'type', 'path'].includes(key)) {
      continue;
    }

    entries[key] = {
      content: value,
      status: 'pending',
    };
  }

  return entries;
}

function outputFromLock(lock) {
  const missing = [];

  for (const rootKey of Object.keys(lock.roots).sort()) {
    const root = lock.roots[rootKey];

    for (const item of root.items || []) {
      if (item.exists) {
        continue;
      }

      missing.push({
        path: item.path,
        promission: Object.fromEntries(
          Object.entries(item.promission || {}).map(([key, value]) => [key, value.content]),
        ),
      });
    }
  }

  return { missing };
}

function readLock(lockPath) {
  if (!fs.existsSync(lockPath)) {
    return { version: LOCK_VERSION, roots: {} };
  }

  return JSON.parse(fs.readFileSync(lockPath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function projectPath(projectDir, relativePath) {
  return toPosix(path.posix.join(path.basename(projectDir), toPosix(relativePath)));
}

function stem(relativePath) {
  const base = path.posix.basename(toPosix(relativePath));
  return base.slice(0, base.length - path.posix.extname(base).length);
}

function matchesPathPattern(pattern, relativePath) {
  return createPathMatcher(pattern).test(relativePath);
}

function createPathMatcher(pattern) {
  const normalizedPattern = toPosix(String(pattern));
  const regex = globToRegExp(normalizedPattern);
  const basenameRegex = normalizedPattern.includes('/') ? null : regex;

  return {
    pattern: normalizedPattern,
    test(relativePath) {
      const normalized = toPosix(relativePath);

      if (regex.test(normalized)) {
        return true;
      }

      return basenameRegex !== null && basenameRegex.test(path.posix.basename(normalized));
    },
  };
}

function globToRegExp(pattern) {
  const escaped = pattern.replace(/[|\\{}()[\]^$+?.]/g, '\\$&').replaceAll('*', '.*');
  return new RegExp(`^${escaped}$`);
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function cli(argv = process.argv) {
  try {
    const options = parseArgs(argv.slice(2));
    const output = runHarness(options);
    process.stdout.write(`${JSON.stringify(output)}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ error: error.message })}\n`);
    process.exitCode = 1;
  }
}

function parseArgs(args) {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--harness') {
      options.harnessPath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--lock') {
      options.lockPath = args[index + 1];
      index += 1;
      continue;
    }

    if (!options.projectDir) {
      options.projectDir = arg;
    }
  }

  return options;
}

module.exports = {
  cli,
  parseHarness,
  runHarness,
};
