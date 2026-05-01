---
name: harness-author
description: Use when an agent needs to create, explain, or revise an initial harness.yaml for a project through conversation with the user.
---

# Harness Author

## Role

Guide the user from project intent to a working `harness.yaml`. The user should not need to know the file format before the conversation starts.

Do not require the user to hand-write `harness.yaml`. Ask the user focused questions, inspect the project when allowed, propose a small contract model, explain the YAML, then write or update the file.

Do not infer Python, TypeScript, tests, stories, design documents, or any other domain from this repository's examples. Treat bundled examples as examples only. In an empty project, ask domain-neutral questions before proposing root patterns or required files.

## Conversation Workflow

1. Inspect existing context:

```bash
find . -maxdepth 3 -type f
```

Read any existing `harness.yaml`, sample project files, and current `document-harness.lock` if present.

2. Ask the user one focused question at a time. Start with the contract goal. Use neutral wording:

- Which files or objects should be supervised as roots?
- What companion files, records, or checks should each root require?
- What should each companion promise or prove?
- Should different root naming or path patterns map to different variants?

If the project is empty, do not suggest a default language-specific model. Ask what kind of artifacts the user plans to create and what obligations should surround those artifacts.

3. Explain the proposed harness in user-facing terms before writing:

- `document_root`: which project files start validation.
- `document_chains`: what each root type requires.
- `variant_require`: how a root file is classified when multiple variants exist.
- `document_harness`: which related files are expected.
- `desc`, `verify`, or other promission fields: obligations a supervisor agent will later check.

4. Write the smallest useful `harness.yaml`. Prefer one root pattern, one variant, and one required document until the user needs more.

5. Run the verifier:

```bash
node document-harness.js <projectDir>
```

6. Show the concise JSON result and explain what it means. If the output is surprising, revise the harness through another short question.

## Neutral Template

Use this neutral template after the user has chosen root and companion patterns. Replace every placeholder before writing `harness.yaml`.

```yaml
avilable_type:
  - regex_match
  - str
  - int
  - promission
  - relative_path

document:
  types:
    name: regex_match
    type: str
    path: relative_path
    desc: promission
    verify: promission

variant_require:
  name: regex_match
  path: regex_match
  priority: int

document_root:
  - "<root-pattern>"

document_chains:
  "<root-pattern>":
    - variants:
        - variant:
            variant_require:
              name: "<root-name-pattern>"
              path: "<root-path-pattern>"
              priority: 10
            document_harness:
              - document:
                name: "<required-name>"
                type: <required-type>
                path: "<required-relative-path>"
                desc: <what this companion must describe>
                verify: <what consistency or evidence must be checked>
```

## Authoring Rules

- Keep promission text concrete enough for `promission-supervisor` to verify.
- Use relative paths from each root file's directory unless the user wants a global location.
- Avoid broad variants with equal priority. Equal priority matches should be treated as ambiguous.
- Keep generated YAML compatible with `node document-harness.js`.
- After editing, run `node --test` if the repository has tests.

## Explanation Pattern

When presenting the file to the user, explain it in plain language:

"This harness says: every file matching `<root-pattern>` is a root. For each root, the harness expects `<required-name><required-type>` at `<required-relative-path>`. That companion is expected to satisfy the listed promissions. The verifier will report missing companions and store promission status in `document-harness.lock`."

## Examples

Do not include a concrete example until the user has chosen a domain model. If an example would help, first restate the user's chosen root pattern and companion rule, then instantiate the neutral template with those exact choices.
