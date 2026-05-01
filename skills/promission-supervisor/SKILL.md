---
name: promission-supervisor
description: Use when an agent is called to supervise, verify, or update promission completion status in document-harness.lock after document-harness validation.
---

# Promission Supervisor

## Role

Act as the supervisory skill for promissions recorded by Document Harness. When maintenance work is needed, delegate to the `document-harness:maintainer` subagent. That subagent exists to maintain Document Harness state, fix valid companion gaps, handle invalid source files, execute promissions, and update `document-harness.lock`.

## Required Workflow

1. Run the harness first:

```bash
node document-harness.js <projectDir>
```

2. Read `document-harness.lock`.

3. Find promission objects with `status: "pending"` or a user-requested status.

4. For each selected promission, inspect the referenced item path and the root file that produced it. Use the promission `content` as the exact obligation to verify.

5. If any file maintenance decision is required, delegate the work to `document-harness:maintainer` instead of doing it inline. Ask it to classify each item:

- `invalid-source`: the root or referenced file is wrong, misplaced, meaningless, duplicated, or should not exist. In this case the maintainer should move, rename, edit, or remove the invalid file when implementation is authorized. It must not create companion harness documents for a file that should not be a valid root.
- `necessary-source`: the root file is valid and necessary. In this case the maintainer should create the required companion file when implementation is authorized, then execute the harness promissions and update `document-harness.lock`.
- `verifiable`: the required companion exists. In this case the maintainer should verify the promission and update only the matching promission object.

6. If no maintenance decision is required and you are only recording a verification result, update only that promission object:

```json
{
  "content": "对应设计和代码实现一致",
  "status": "done"
}
```

Use `failed` when the obligation is not satisfied. Add a short `reason` field only when it materially helps the next agent understand the failure.

## Boundaries

- Do not create missing related files unless the user explicitly asks for implementation.
- For invalid roots: move, rename, edit, or remove the invalid source through `document-harness:maintainer`; do not create companion files for it.
- For necessary roots: create the required companion through `document-harness:maintainer`, then execute the harness promissions and update `document-harness.lock`.
- Do not create companion files for invalid roots. Invalid roots should be moved, renamed, edited, or removed by `document-harness:maintainer` when implementation is authorized.
- If a root is necessary and valid, missing companions should be created by `document-harness:maintainer` so the harness promissions can be executed.
- Do not rewrite promission `content`.
- Do not overwrite unrelated roots, hashes, items, or statuses.
- Do not recompute lock entries by hand. Let `node document-harness.js <projectDir>` refresh changed roots.
- If root hash is unchanged, preserve the lock result and supervise from it.

## Output

Report a concise summary of statuses changed and any failures. Prefer file paths and promission keys over prose.
