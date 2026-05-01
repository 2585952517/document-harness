---
name: document-harness
description: Use when an agent needs to validate a project with harness.yaml, inspect document-harness.lock, report missing contract files, or preserve document harness cache state.
---

# Document Harness

## Overview

Use this project as a document contract verifier. `harness.yaml` defines root files, matched variants, required related files, and promission text. `document-harness.lock` stores root hashes, required items, existence checks, and agent-updated promission status.

## Workflow

1. Run the harness from this repository root:

```bash
node document-harness.js <projectDir>
```

Use `example_project` when no target project is specified:

```bash
node document-harness.js example_project
```

2. Read stdout as concise JSON:

```json
{"missing":[{"path":"example_project/example_design.md","promission":{"desc":"...","verify":"..."}}]}
```

3. Read `document-harness.lock` before follow-up work. It is the durable local state for hashes, generated validation items, and promission status.

4. Do not create missing related files unless the user explicitly asks. The harness reports contract gaps; it does not implement them.

## Lock Semantics

- If a root file hash is unchanged, trust the existing lock entry and preserve agent-written promission status.
- If a root file hash changed, the CLI recomputes that root entry from `harness.yaml` and resets generated promission statuses for that root to `pending`.
- Missing files are reported from the effective lock state.
- `document-harness.lock` may be ignored by git, but agents should treat it as the local source of truth during a session.

## Performance Model

The CLI indexes project files once, compiles harness matchers once, hashes each root independently, and checks required file existence through the file index. Do not replace this with per-root project scans.
