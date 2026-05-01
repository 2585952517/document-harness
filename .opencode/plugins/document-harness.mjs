import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const skillsDir = path.join(repoRoot, 'skills');

export const DocumentHarnessPlugin = async ({ project }) => ({
  config: async (config) => ({
    ...config,
    skill: [
      ...new Set([
        ...config.skill ?? [],
        skillsDir,
      ]),
    ],
  }),
  'chat.params': async (params) => ({
    ...params,
    system: [
      params.system,
      'Document Harness plugin is available. Use harness-author for conversational harness.yaml creation, document-harness for validation, promission-supervisor for supervision, memory/project-understanding.md as project essence memory, and agents/maintainer.md when maintenance must be delegated.',
    ].filter(Boolean).join('\n\n'),
  }),
});

export default DocumentHarnessPlugin;
