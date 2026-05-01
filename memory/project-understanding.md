# Project Understanding Memory

This file stores durable project-level understanding for Document Harness maintenance agents. Keep one copy in the target project at `memory/project-understanding.md`. Read it before deciding whether to create, delete, move, rename, edit, or inline files.

## Target Project

Record the project name, purpose, audience, main workflows, and important boundaries here. Keep this section about the target project, not about the current task.

Initial understanding for this repository: Document Harness is a cross-agent contract system for validating file relationships and supervising promission completion.

## Project Essence

Each target project defines which files are meaningful roots in `harness.yaml`, which companion files each root requires, and which promissions those companions must satisfy. The lock file records current validation state and promission execution status.

Maintain the project from the project perspective: the goal is not to satisfy the harness mechanically. The goal is to keep the project structure meaningful while using the harness to expose missing or stale supporting evidence.

## Harness Semantics

`harness.yaml` is the source of contract semantics:

- `document_root` defines which files are treated as roots.
- `document_chains` defines what each root type requires.
- `variant_require` defines how roots are classified.
- `document_harness` defines required companion files.
- Promission fields such as `desc` and `verify` define obligations a maintenance agent must check.

Before acting, explain what the relevant harness rule means for the target file. Do not decide from file existence alone.

## File Existence Policy

Describe which files should exist as standalone roots, which files are only supporting details for another root, and which generated or accidental files should not be harness roots. Use this policy when choosing between creating a companion file, moving a file, deleting a file, or inlining content into another file.

## Maintenance Decisions

Use this decision model:

- If a file is invalid, misplaced, meaningless, duplicated, or no longer part of the project essence, move, rename, edit, delete, or inline it into another file as appropriate. Do not create harness companion files for invalid roots.
- If a file is necessary and valid, create the required harness companion files and execute the harness promissions.
- If a file's content is too small or only supports another concept, consider whether it should be inlined into another file instead of being maintained as a standalone root.
- If `harness.yaml` no longer matches the project essence, propose or make a harness update before creating mechanical companion files.
- After file changes, rerun the verifier so `document-harness.lock` reflects current roots and hashes.

## Update this file

Update this file whenever the project essence changes, including:

- new root categories
- new companion document semantics
- changed criteria for whether files should exist
- changed rules for when content should be moved, deleted, or inlined into other files
- changed interpretation of promission fields

Keep updates concise and project-level. Do not record one-off task logs here.
