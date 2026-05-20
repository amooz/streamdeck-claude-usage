# streamdeck-claude-usage

A Stream Deck plugin that displays Claude usage statistics on your Stream Deck buttons.

Each button shows one Claude usage metric — tokens, requests, cache hit, etc. — pulled from one of two data sources, rendered in your choice of **text only**, **circular progress ring only**, or **ring + text**.

## Status

**Beta — needs in-app smoke test.** All code paths land: polling, three render modes, two data sources, subscription-tier defaults, error tile on failures. The 131-test suite covers every pure module above 90% branches; the action's actual interaction with Stream Deck (Property Inspector binding, `setImage` round-trip, decorator registration) is verified manually. Numbers from local-logs are reconstructions of Claude Code's JSONL transcripts and display with a leading `~`.

## Data sources

Each button picks one in the Property Inspector.

- **Local Claude Code logs.** Reads `~/.claude/projects/<encoded-project>/*.jsonl`. No API key needed; works for Pro / Max subscribers using Claude Code. The 5-hour session metric is reconstructed via a gap heuristic against your local JSONL — close to what Anthropic enforces server-side but not byte-perfect. Weekly is a straight rolling-7-day sum. All values display with a leading `~` to make the estimate explicit.
- **Anthropic Admin API.** Pulls authoritative usage and cost data from `api.anthropic.com/v1/organizations/usage_report/messages`. Requires an Admin API key (`sk-ant-admin...`) — only org admins can create them. Does **not** apply to claude.ai subscription accounts. The 5-hour session metric is intentionally empty for this source because the concept doesn't exist for API-billed usage.

## Install (development, WSL on Windows)

This is the path the project is built for.

```bash
git clone git@github.com:amooz/streamdeck-claude-usage.git
cd streamdeck-claude-usage
npm ci                 # requires Node ≥ 22 and npm ≥ 11; enforces min-release-age=7
npm run build          # builds + copies into %AppData%\Elgato\StreamDeck\Plugins
```

The build script rsyncs the bundled `.sdPlugin/` into `/mnt/c/Users/<you>/AppData/Roaming/Elgato/StreamDeck/Plugins/` and invokes `cmd.exe /c streamdeck restart` so the plugin reloads. Override the destination with `STREAMDECK_PLUGINS_DIR` if your AppData path differs.

While iterating:

```bash
npm run watch          # rebuilds on every change and restarts the plugin in Stream Deck
```

For a one-shot install on macOS or native Linux, run `streamdeck link dev.mooz.streamdeck.claude-usage.sdPlugin` after `npm run build`.

## Install (end users, pre-packaged)

Once a `.streamDeckPlugin` archive is published, double-click it and Stream Deck will install. Build one yourself with:

```bash
npm run package        # writes dist/dev.mooz.streamdeck.claude-usage.streamDeckPlugin
```

## Configuring a button

After installing, drag **Claude Usage** onto any key. The Property Inspector exposes:

| Field                    | What it does                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Display mode**         | text / ring / ring + text                                                                                                                  |
| **Data source**          | local-logs or admin-api                                                                                                                    |
| **Project** (local-logs) | `all` to aggregate across every Claude Code project, or the encoded directory name to scope to one                                         |
| **Window**               | today / 5-hour session / last 7 days / all time                                                                                            |
| **Model**                | all / opus / sonnet / haiku                                                                                                                |
| **Metric**               | output tokens / input tokens / total tokens / cache read / cache write / requests                                                          |
| **Subscription tier**    | pre-fills sensible ring denominators for Pro / Max 5x / Max 20x. `Custom` and `API only` leave the field empty so you can supply your own. |
| **Denominator**          | overrides the tier default. Required for ring mode to show a percentage.                                                                   |
| **Custom label**         | overrides the auto-generated caption (e.g. "Opus 5h out")                                                                                  |
| **Refresh (seconds)**    | poll interval. 60s is the Anthropic-recommended cadence.                                                                                   |
| **Admin API key**        | only used when source = admin-api. Stored in Stream Deck's encrypted settings; never logged.                                               |

## Known limitations

- **Local-logs estimates only see this machine.** If you use Claude on a different device or claude.ai/web, the local-logs source won't see those messages and will under-report.
- **Subscription tier denominators are starting estimates.** Anthropic doesn't publish exact caps and changes them periodically. Override per button when you know your real ceiling.
- **The Admin API has no 5h concept.** Buttons configured for `5-hour session` against the admin-api source will read 0.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Test coverage is held at 90% across the pure modules; the SDK-decorated entry points are excluded from the unit-test gate and verified manually in Stream Deck.
