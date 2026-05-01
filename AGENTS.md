# Document Harness Agent Instructions

This repository supports Codex and other coding agents through skills in `skills/`.

Use `harness-author` when creating, explaining, or revising an initial `harness.yaml`. The agent should guide the user through questions and write the file, not require the user to hand-write it.

Use `document-harness` when a task involves `harness.yaml`, concise validation JSON, or `document-harness.lock` cache behavior.

Use `promission-supervisor` when the agent is being called to supervise promission completion. The supervisor checks pending promissions from `document-harness.lock` and updates only the matching promission status.

Use the `document-harness:maintainer` subagent for delegated maintenance: classify files as invalid or necessary, move/rename/edit/remove invalid files, create companion files for necessary roots, execute promissions, and update `document-harness.lock`.

Operational rules:

- Run `node document-harness.js <projectDir>` from the repository root to refresh effective results.
- Read `document-harness.lock` before inspecting or updating promission status.
- Preserve unchanged-root lock entries and unrelated statuses.
- Do not create missing files unless the user explicitly requests implementation work.
