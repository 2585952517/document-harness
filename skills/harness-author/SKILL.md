---
name: harness-author
description: Use when an agent needs to create, explain, or revise an initial harness.yaml for a project through conversation with the user.
---

# Harness Author

## Role

Guide the user from project intent to a working `harness.yaml`. The user should not need to know the file format before the conversation starts.

Do not require the user to hand-write `harness.yaml`. Ask the user focused questions, inspect the project when allowed, propose a small contract model, explain the YAML, then write or update the file.

## Conversation Workflow

1. Inspect existing context:

```bash
find . -maxdepth 3 -type f
```

Read any existing `harness.yaml`, sample project files, and current `document-harness.lock` if present.

2. Ask the user one focused question at a time. Start with the contract goal:

- Which files should be treated as root files?
- What related documents or tests should each root require?
- What must those related files promise?
- Should different root naming patterns map to different variants?

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

## YAML Shape

Use this shape as the starting point:

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
  - "*.py"

document_chains:
  "*.py":
    - variants:
        - variant:
            variant_require:
              name: "*"
              path: "*"
              priority: 10
            document_harness:
              - document:
                name: "*_design"
                type: .md
                path: "./"
                desc: 描述对应实现的详细设计
                verify: 对应设计和代码实现一致
```

## Authoring Rules

- Keep promission text concrete enough for `promission-supervisor` to verify.
- Use relative paths from each root file's directory unless the user wants a global location.
- Avoid broad variants with equal priority. Equal priority matches should be treated as ambiguous.
- Keep generated YAML compatible with `node document-harness.js`.
- After editing, run `node --test` if the repository has tests.

## Explanation Pattern

When presenting the file to the user, explain it in plain language:

"This harness says: every `*.py` file is a root. For each root, the harness expects a sibling Markdown file named `<same-name>_design.md`. That Markdown file is expected to describe the implementation and stay consistent with the code. The verifier will report missing files and store promission status in `document-harness.lock`."
