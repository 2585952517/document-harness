# Claude Code Installation

Install this repository as a Claude Code marketplace, then install the plugin from that marketplace:

```bash
claude plugin marketplace add /path/to/document-harness --scope user
claude plugin install document-harness@document-harness --scope user
```

For project-local setup, replace `user` with `project` or `local`.

This repository includes both:

- `.claude-plugin/marketplace.json` for `claude plugin marketplace add`
- `.claude-plugin/plugin.json` for the `document-harness` plugin entry

The plugin exposes these skills:

- `harness-author`
- `document-harness`
- `promission-supervisor`
- `document-harness:maintainer` named subagent

Promission supervision uses the target project's `memory/project-understanding.md` as the project essence record. Keep it aligned with `harness.yaml` whenever maintenance changes file existence, movement, deletion, or inline-content rules.
