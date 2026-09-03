# UAMEX ERP Agent Work Continuity

## Purpose

This repository can contain work from several coding agents and editor sessions.
Unmerged agent refs are recoverable Git objects, but they must be treated as
first-class delivery artifacts rather than informal history.

## Recovery protocol

1. Before starting a new agent task, record the current branch and working tree:
   `git status --short` and `git branch --show-current`.
2. Each completed task must leave a named checkpoint commit or branch. Use a
   descriptive label such as `agent/<domain>-<date>`.
3. Compare the checkpoint with the target branch before integrating:
   `git diff --stat <target> <checkpoint>`.
4. Integrate only after typecheck, targeted tests, and build pass. Preserve
   unrelated user changes; do not reset or clean the worktree destructively.
5. After integration, retain the checkpoint reference until the release has
   passed its verification gate.

## Feature activation checklist

An implemented feature is not considered delivered until all of these are true:

- The feature has a typed route/tab entry.
- The feature is reachable from the role-appropriate sidebar and systems dock.
- The renderer has a live component path for the tab.
- Reports and documents link back to the owning workspace.
- Empty, loading, permission, and error states are explicit.
- The feature is covered by the existing validation commands.

## Current recovered agent references

Agent and Cline checkpoint refs are discoverable with:

```powershell
git for-each-ref --format="%(refname) %(objectname)" refs/agents refs/cline/checkpoints
```

Do not cherry-pick a checkpoint blindly. Inspect its file list and merge only
the coherent feature slice required by the current release.
