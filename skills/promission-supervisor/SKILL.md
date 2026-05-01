---
name: promission-supervisor
description: Use when an agent is called to supervise, verify, or update promission completion status in document-harness.lock after document-harness validation.
---

# Promission Supervisor

## Role

Act as the supervisory skill for promissions recorded by Document Harness in the target project. When maintenance work is needed, delegate to the `document-harness:maintainer` subagent. That subagent exists to maintain Document Harness state, fix valid companion gaps, handle invalid source files, execute promissions, and update `document-harness.lock`.

Supervise from the project perspective. Before deciding whether to create a companion file, delete a file, move a file, or inline content into another file, read `memory/project-understanding.md` and `harness.yaml`. The memory explains the project essence; `harness.yaml` explains the active contract semantics. Do not mechanically satisfy missing entries without checking whether the root should exist. If the project essence changes during supervision, update the memory.

## Project Memory

Use `memory/project-understanding.md` in the target project root as long-term project memory. If it is missing and supervision requires file maintenance judgment, create a concise first version before changing files. It should capture project essence, harness semantics, file existence policy, and when content should be standalone versus inlined into other file content.

Every delegated task must pass memory context to the maintainer: delegate with memory/project-understanding.md, the relevant harness rule, and the file paths. Every change request must remind the maintainer: if the project essence changes, update memory/project-understanding.md.

## Required Workflow

1. Run the harness first:

```bash
node document-harness.js <projectDir>
```

2. Read `document-harness.lock`.

3. Read `memory/project-understanding.md` and read `harness.yaml`, then state what the relevant harness rule means before deciding whether a file should exist as a root, be moved, be deleted, be inlined into other file content, or receive companion files.

4. Find promission objects with `status: "pending"` or a user-requested status.

5. For each selected promission, inspect the referenced item path and the root file that produced it. Use the promission `content` as the exact obligation to verify.

6. If any file maintenance decision is required, delegate the work to `document-harness:maintainer` instead of doing it inline. Pass it the relevant `harness.yaml` rule, the current `memory/project-understanding.md` section, and the root/item paths. Ask it to classify each item:

- `invalid-source`: the root or referenced file is wrong, misplaced, meaningless, duplicated, or should not exist. In this case the maintainer should move, rename, edit, or remove the invalid file when implementation is authorized. It must not create companion harness documents for a file that should not be a valid root.
- `necessary-source`: the root file is valid and necessary. In this case the maintainer should create the required companion file when implementation is authorized, then execute the harness promissions and update `document-harness.lock`.
- `verifiable`: the required companion exists. In this case the maintainer should verify the promission and update only the matching promission object.
- `inline-elsewhere`: the file's content belongs inside another file instead of standing alone as a root. In this case the maintainer should inline into other file content when implementation is authorized, rerun the verifier, and update `document-harness.lock`.

7. If no maintenance decision is required and you are only recording a verification result, update only that promission object:

```json
{
  "content": "对应设计和代码实现一致",
  "status": "done"
}
```

Use `failed` when the obligation is not satisfied. Add a short `reason` field only when it materially helps the next agent understand the failure.

## Boundaries

- Do not create missing related files unless the user explicitly asks for implementation.
- Before any change, confirm the action follows the target project essence and the interpreted harness rule.
- For invalid roots: move, rename, edit, or remove the invalid source through `document-harness:maintainer`; do not create companion files for it.
- For necessary roots: create the required companion through `document-harness:maintainer`, then execute the harness promissions and update `document-harness.lock`.
- If content should be inline in other file content rather than standalone, delegate that inline decision to `document-harness:maintainer` and rerun the verifier afterward.
- Do not create companion files for invalid roots. Invalid roots should be moved, renamed, edited, or removed by `document-harness:maintainer` when implementation is authorized.
- If a root is necessary and valid, missing companions should be created by `document-harness:maintainer` so the harness promissions can be executed.
- If the project essence changes, update `memory/project-understanding.md` before or alongside the lock update.
- Do not rewrite promission `content`.
- Do not overwrite unrelated roots, hashes, items, or statuses.
- Do not recompute lock entries by hand. Let `node document-harness.js <projectDir>` refresh changed roots.
- If root hash is unchanged, preserve the lock result and supervise from it.

## Output

Report a concise summary of statuses changed and any failures. Prefer file paths and promission keys over prose.
