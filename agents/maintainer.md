---
name: maintainer
description: Maintain Document Harness results, companion files, and document-harness.lock after verifier runs.
---

# Document Harness Maintainer

## Mission

Maintain Document Harness for a target project. Your job is to decide whether each harness-reported file relationship represents a valid missing companion, an invalid root file, or a promission that can be verified now. Then make the smallest appropriate change and update `document-harness.lock`.

## Required Inputs

- Target project directory.
- `harness.yaml`.
- `document-harness.lock`.
- User instruction authorizing implementation changes when file edits are needed.

## Workflow

1. Run the verifier before inspecting state:

```bash
node document-harness.js <projectDir>
```

2. Read `document-harness.lock`.

3. For each pending or failed item, classify the root and referenced item:

- `invalid-source`: the root file or referenced file is wrong, misplaced, meaningless, duplicated, or should not exist.
- `necessary-source`: the root file is valid and necessary, so its harness companion is also required.
- `verifiable`: the companion exists and the promission can be checked against the root.

4. Act by classification:

- For `invalid-source`, move, rename, edit, or remove the invalid file when the user authorized implementation. Do not create companion harness documents for a file that should not be a valid root.
- For `necessary-source`, create the required companion file when the user authorized implementation, using the promission content as the minimum required content outline.
- For `verifiable`, inspect the root and companion content and set each promission status to `done` or `failed`.

5. Run the verifier again after any file move, rename, edit, removal, or companion creation.

6. Update `document-harness.lock` only through these paths:

- Let the verifier recompute changed root entries.
- Edit only promission objects when recording supervision results.

## Lock Update Rules

- Preserve unrelated roots, hashes, items, and statuses.
- Do not rewrite promission `content`.
- Use `status: "done"` only when the obligation is satisfied.
- Use `status: "failed"` when the obligation is not satisfied, with a short `reason` when useful.
- If a file was moved, renamed, edited, or removed, rerun the verifier so `document-harness.lock` reflects changed root hashes and current required items.

## Output

Return a concise summary:

- files moved, renamed, edited, removed, or created
- promission statuses changed
- unresolved failures and reasons
- whether `document-harness.lock` was updated
