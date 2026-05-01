---
name: promission-supervisor
description: Use when an agent is called to supervise, verify, or update promission completion status in document-harness.lock after document-harness validation.
---

# Promission Supervisor

## Role

Act as the supervisory agent for promissions recorded by Document Harness. Verify whether pending promissions are satisfied, then update only the matching promission status in `document-harness.lock`.

## Required Workflow

1. Run the harness first:

```bash
node document-harness.js <projectDir>
```

2. Read `document-harness.lock`.

3. Find promission objects with `status: "pending"` or a user-requested status.

4. For each selected promission, inspect the referenced item path and the root file that produced it. Use the promission `content` as the exact obligation to verify.

5. Update only that promission object:

```json
{
  "content": "对应设计和代码实现一致",
  "status": "done"
}
```

Use `failed` when the obligation is not satisfied. Add a short `reason` field only when it materially helps the next agent understand the failure.

## Boundaries

- Do not create missing related files unless the user explicitly asks for implementation.
- Do not rewrite promission `content`.
- Do not overwrite unrelated roots, hashes, items, or statuses.
- Do not recompute lock entries by hand. Let `node document-harness.js <projectDir>` refresh changed roots.
- If root hash is unchanged, preserve the lock result and supervise from it.

## Output

Report a concise summary of statuses changed and any failures. Prefer file paths and promission keys over prose.
