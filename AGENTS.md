<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Local Skills

This repository should prefer user-installed local skills from `~/.codex/skills` when they match the task.

## Preferred Skill Routing

- Use `frontend-design` or `frontend-skill` for frontend visual redesign, layout refinement, interaction polish, or design-system work.
- Use `gstack` when the task explicitly involves gstack-related workflow or tooling.
- Use `powerpoint-automation` for PPT / deck generation or slide conversion tasks.
- Use `document-illustrator` or `canvas-design` for illustration, visual asset, or static design tasks.
- Use `find-skills` when a requested capability may exist as a skill but is not obviously available.

## Local Skill Source

- Primary user-local skills live under `~/.codex/skills`.
- If a needed skill is present there, prefer reading that `SKILL.md` before falling back to generic implementation.
