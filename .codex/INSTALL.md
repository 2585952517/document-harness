# Codex Installation

Install this repository as a local Codex plugin so Codex can discover the skills declared in `.codex-plugin/plugin.json`.

The plugin exposes:

- `harness-author`
- `document-harness`
- `promission-supervisor`
- `agents/maintainer.md` for delegated Document Harness maintenance

After installation, use the skills when working with `harness.yaml`, concise validation JSON, or `document-harness.lock`.

Codex does not currently use Claude Code named agents directly. When a skill says to delegate to `document-harness:maintainer`, read `agents/maintainer.md` and spawn a worker agent with those instructions.

Promission supervision uses the target project's `memory/project-understanding.md` as the project essence record. Keep it aligned with `harness.yaml` whenever maintenance changes file existence, movement, deletion, or inline-content rules.
