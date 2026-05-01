---
name: document-harness
description: Use when an agent needs to validate a project with harness.yaml, inspect document-harness.lock, report missing contract files, or update promission execution status for document harness results.
---

# Document Harness

## Overview

Use this project as a document contract verifier. `harness.yaml` defines root files, matched variants, required related files, and promission text. `document-harness.lock` stores the cached verification result plus agent-updated promission status.

## Agent Workflow

1. Run the harness from this repository root:

```bash
node document-harness.js <projectDir>
```

Use `example_project` when no target project is specified:

```bash
node document-harness.js example_project
```

2. Read stdout as the concise machine result. The current output shape is:

```json
{"missing":[{"path":"example_project/example_design.md","promission":{"desc":"...","verify":"..."}}]}
```

3. Read `document-harness.lock` before doing follow-up work. The lock is the durable state file for root hashes, required items, existence checks, and promission status.

4. Do not create missing related files unless the user explicitly asks. The harness reports missing contract files; it does not generate them.

5. When executing a promission, update only that promission status in `document-harness.lock`. Preserve unrelated roots, items, content, hashes, and statuses.

## Lock Semantics

- If a root file hash is unchanged, trust the existing lock entry and preserve agent-written promission status.
- If a root file hash changed, the CLI recomputes that root entry from `harness.yaml` and resets the generated promission statuses for that root to `pending`.
- Missing files are reported from the effective lock state, not by ad hoc filesystem guesses.
- `document-harness.lock` may be ignored by git, but agents should still treat it as the local source of truth during the session.

## Promission Status

Promission records use this structure:

```json
{
  "content": "对应设计和代码实现一致",
  "status": "pending"
}
```

Use `pending` for generated, unexecuted promissions. After checking a promission, set `status` to a concise result such as `done` or `failed`. If more detail is needed later, add narrowly scoped fields to that promission object rather than changing `content`.

## Compatibility Notes

Claude Code, Codex, Gemini, and similar coding agents should all follow the same protocol:

- Run the Node CLI for verification.
- Use the JSON stdout for compact reporting.
- Use `document-harness.lock` for persistent state.
- Never overwrite unchanged-root promission status during unrelated work.
- Keep edits to `harness.yaml`, generated output expectations, and lock status deliberate and explicit.
