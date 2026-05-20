# Contributing

Thanks for your interest in contributing to `streamdeck-claude-usage`.

## Project goal

A Stream Deck plugin that surfaces Claude usage statistics as buttons. Each button is configurable to display its metric as:

- text only
- a circular progress bar only
- text overlaid on a circular progress bar

Contributions should keep these three render modes as first-class, equally-supported options.

## Testing

Target **90% test coverage** by default. Tests are how we know a change works and how we catch regressions before they ship. New code should arrive with tests; bug fixes should arrive with a regression test that fails before the fix and passes after.

If a change drops coverage below 90%, call it out in the PR description and explain why (e.g., hard-to-test integration surface, generated code). Reviewers may ask for more coverage before merging.

## Getting started

1. Fork the repository and clone your fork.
2. Create a feature branch off `main`.
3. Make your changes in small, focused commits.
4. Open a pull request against `main` with a clear description of the change and why it's needed.

Build, test, and packaging instructions will be added here once the plugin scaffolding lands.

## Reporting issues

Open a GitHub issue with:

- What you expected to happen.
- What actually happened.
- Steps to reproduce, including your Stream Deck model and host OS.
- Plugin version (or commit SHA) and Stream Deck software version.

## Dependencies and supply-chain hygiene

This project takes supply-chain risk seriously. Two rules apply to every dependency:

1. **Exact version pins.** No `^` or `~` ranges. `package.json` and `package-lock.json` together give us byte-identical installs across machines.
2. **Minimum release age of 7 days.** Newly published versions are quarantined until they've been in the ecosystem for a week, reducing exposure to fresh malicious publishes.

Both rules are enforced by `.npmrc` (`save-exact=true`, `min-release-age=7`) and require **npm ≥ 11** (pinned via `engines` + `engine-strict=true`).

When adding or upgrading a dep:

- Use an exact version (`npm install <pkg>@x.y.z`, not `@latest`).
- Verify it's at least 7 days old: `npm view <pkg> time | grep '<version>'`.
- If you must bypass the cooldown (security patch, blocking bug), explain why in your PR and revert the bypass as soon as feasible.

## Pull requests

- Keep PRs focused on a single concern.
- Update the README or other docs when behavior or configuration changes.
- If you're adding a new render mode or configuration option, explain the use case in the PR description.

## Code of conduct

Be respectful and constructive. Assume good intent.
