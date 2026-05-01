# Document Harness For Gemini CLI

@./skills/harness-author/SKILL.md
@./skills/document-harness/SKILL.md
@./skills/promission-supervisor/SKILL.md

Use `harness-author` to create, explain, or revise an initial `harness.yaml` through conversation with the user.

Use `document-harness` for `harness.yaml` validation and `document-harness.lock` cache behavior.

Use `promission-supervisor` when acting as the called agent that supervises pending promissions and updates only their status in `document-harness.lock`.

Delegate Document Harness maintenance to `document-harness:maintainer`: it decides whether files are invalid or necessary, fixes invalid files, creates required companion files for necessary roots, executes promissions, and updates `document-harness.lock`.
