# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Stream Deck plugin that displays Claude usage statistics on Stream Deck buttons. Each button is configurable to render its metric as **text only**, a **circular progress ring only**, or **ring + text**. These three modes are first-class and must remain equally supported — they are the product, not implementation details.

The plugin supports two data sources, chosen per-button in the Property Inspector:

- **Anthropic Admin API** (`source: "admin-api"`) — pulls authoritative usage and cost data from `api.anthropic.com/v1/organizations/usage_report/messages` and `…/cost_report`. Requires an Admin API key (`sk-ant-admin...`) that only org admins can create. **Not available** for solo `sk-ant-api...` keys or for individual (non-org) accounts.
- **Local Claude Code logs** (`source: "local-logs"`) — reads JSONL session transcripts from `~/.claude/projects/`. Works for anyone running Claude Code locally, including Pro/Max subscribers. Some metrics (5-hour session, weekly session) are **estimated** from local data and may drift from server-enforced counters; surface this in the UI when shown.

Both sources must be supported as equals. Metric availability differs by source — see the matrix in the PI code / docs.

## Commands

```bash
npm install              # install (uses min-release-age=7 + engine-strict)
npm run build            # rollup → .sdPlugin/bin/plugin.js, then syncs to Windows AppData (WSL only)
npm run watch            # rebuild on change, sync, restart plugin in Stream Deck
npm test                 # vitest run
npm run test:watch       # vitest watch mode
npm run coverage         # vitest run --coverage  (enforces 90% threshold)
npm run typecheck        # tsc --noEmit
npm run lint             # eslint .
npm run format           # prettier --write .
npm run format:check     # prettier --check .
```

Run a single test file: `npx vitest run tests/<name>.test.ts`.

## Architecture

```
src/
  plugin.ts                    SDK entry — registers actions, connects
  actions/
    usage-button.ts            @action-decorated SDK shell (thin)
    usage-button-settings.ts   pure types/guards for the action's settings
  sources/                     (planned)
    source.ts                  interface { fetch(): UsageSnapshot }
    admin-api-source.ts
    local-logs-source.ts
  render/                      (planned)
    renderer.ts                produces PNG Buffer from snapshot + display config
    text.ts, ring.ts, composite.ts
  util/                        (planned)
    poller.ts                  interval + backoff
dev.mooz.streamdeck.claude-usage.sdPlugin/
  manifest.json                Stream Deck plugin manifest (UUID lives here)
  bin/                         build output (gitignored)
  imgs/                        action + plugin icons
  ui/usage-button.html         Property Inspector (HTML/JS using sdpi-components)
scripts/
  sync-to-appdata.mjs          WSL → Windows AppData copy
  restart-plugin.mjs           cmd.exe → streamdeck restart <uuid>
tests/                         vitest suite mirroring src/
```

**Decorated SDK shells (`src/plugin.ts`, `src/actions/usage-button.ts`) are excluded from the unit-test gate.** Vite/Vitest's rolldown (OXC) transformer does not handle TC39 stage-3 decorators, and the production build (rollup + `@rollup/plugin-typescript`) is what actually wires them up. Put behavior in `render/`, `sources/`, `util/` (and `*-settings.ts` files) — those are the test surface and they carry the 90% gate.

## Plugin UUID

`dev.mooz.streamdeck.claude-usage` — appears in `manifest.json`, `rollup.config.mjs`, and `scripts/sync-to-appdata.mjs`. Don't change it casually; it identifies the plugin install on user machines and changing it breaks upgrades.

## Dev loop: WSL ↔ Windows

The repo lives on the WSL side (`/home/amooz/...`) for fast I/O. Stream Deck runs on Windows and reads plugins from `%AppData%\Elgato\StreamDeck\Plugins\<uuid>.sdPlugin\`. The build pipeline bridges them:

1. `rollup -c` writes the bundle into the repo's `.sdPlugin/bin/`.
2. `scripts/sync-to-appdata.mjs` copies the whole `.sdPlugin/` directory across `/mnt/c/` into Stream Deck's AppData. Override the destination with `STREAMDECK_PLUGINS_DIR` if the default path is wrong.
3. `scripts/restart-plugin.mjs` invokes `streamdeck restart <uuid>` via `cmd.exe` so the plugin reloads.

Both scripts silently no-op on native Linux/macOS dev environments. On a Mac/Linux contributor's box, use `streamdeck link` against the repo's `.sdPlugin/` instead.

## Testing

Target **90% line/branch/function/statement coverage** for code under `src/**/*.ts` (with the decorated SDK shells excluded — see Architecture). New behavior arrives with tests; bug fixes arrive with a regression test that fails before the fix and passes after.

Property Inspector HTML/JS is a separate, **manually-tested** surface (loaded by Stream Deck in a webview) and is not part of the 90% gate.

If a change drops coverage below 90%, surface the reason in the PR description.

## Supply-chain hygiene (important)

This project enforces two rules on every dependency:

1. **Exact version pins** — no `^` or `~`. `package.json` + `package-lock.json` give byte-identical installs.
2. **Minimum release age of 7 days** — `min-release-age=7` in `.npmrc` blocks newly published versions for a 7-day cooldown.

Both rules are enforced via `.npmrc` (`save-exact=true`, `min-release-age=7`) and require **npm ≥ 11** (pinned in `engines` with `engine-strict=true`).

When adding or upgrading a dependency:

- Install with an explicit version: `npm install <pkg>@x.y.z`. Don't use `@latest`.
- Before suggesting a version, verify it's ≥ 7 days old: `npm view <pkg> time --json | python3 -c '…'` (script in chat history) or just `npm view <pkg> time`.
- If a fresher version is genuinely required (security patch), say so explicitly in the commit/PR and bypass minimally and temporarily.
- **Never** disable `engine-strict` or `min-release-age` silently.

## Merging workflow (current phase)

While scaffolding, commit and push **directly to `main`** — no PR review. CI (GitHub Actions) is intentionally not set up yet; we'll add it the moment we have a meaningful test suite to gate against. After that, switch to PR-based merging with the test suite as the merge gate.

## Open design choices for future work

- **Canvas backend:** `@napi-rs/canvas` is the planned dep for rendering (prebuilt binaries for macOS x64+arm64 + Windows x64). Not yet added.
- **Subscription tier picker:** Plan is a PI dropdown (`API only` / `Pro` / `Max 5x` / `Max 20x` / `Custom`) feeding a `tier-defaults.ts` table for 5h/weekly denominators. The table must be easy to update when Anthropic changes the numbers.
- **Estimated vs authoritative metrics:** estimates (from local logs) should render with a visible `~` prefix or similar marker — never indistinguishable from authoritative values.
