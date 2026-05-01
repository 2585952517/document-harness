# Document Harness For Claude Code

This repository provides document contract verification and promission supervision skills.

Use `skills/harness-author/SKILL.md` when creating, explaining, or revising an initial `harness.yaml` with the user through conversation.

Use `skills/document-harness/SKILL.md` when validating a project with `harness.yaml`, reading concise JSON output, or preserving `document-harness.lock`.

Use `skills/promission-supervisor/SKILL.md` when acting as the called agent that checks pending promissions and updates their status in `document-harness.lock`.

Use the `document-harness:maintainer` subagent for Document Harness maintenance work: deciding whether a file is invalid or necessary, moving/editing invalid files, creating required companion files for necessary roots, executing promissions, and updating `document-harness.lock`.

Before supervising maintenance, read the target project's `memory/project-understanding.md` and `harness.yaml`. Treat the memory as the project essence record; update it whenever maintenance changes what files should exist, move, be deleted, or be inlined into other files.

Keep these boundaries:

- Run `node document-harness.js <projectDir>` before supervising current results.
- Treat `document-harness.lock` as the durable local state.
- Do not create missing related files unless the user explicitly asks.
- When supervising promissions, update only the relevant promission object.
