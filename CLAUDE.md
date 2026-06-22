# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FemAction-BOT is a Discord bot of RP ("roleplay") commands. Each action (`hug`, `kiss`, etc.) is defined once and exposed as a slash command (`/обнять`). The bot is slash-only — there are no text/prefix commands. User-facing strings, command names, and config keys are in Russian.

## Commands

```bash
npm run dev          # run with hot reload (tsx watch src/index.ts)
npm run build        # compile TypeScript to dist/
npm start            # run compiled bot (node dist/index.js)
npm run deploy       # register slash commands with Discord (dev, from source)
npm run deploy:prod  # register slash commands (from compiled dist/)
```

There is no test runner or linter configured.

Slash commands must be (re)registered via `deploy` whenever an action's `name`/`description`/target options change — registration is a separate step from running the bot. The Docker `CMD` runs `deploy:prod` before starting. Guild-scoped registration (when `discord.guildId` is set) is instant; global registration takes up to an hour to propagate.

Requires a `config.json` (copy from `config.example.json`); the bot throws on startup if `discord.token` or `discord.clientId` is missing. `node:sqlite` (used by the stats store) is a built-in module that requires a recent Node — the Docker base is `node:24-slim`.

## Architecture

**Action auto-loading.** `src/lib/loadActions.ts` reads every file in `src/actions/` at startup and builds the `rpActions` map (keyed by `action.name`). Adding an RP command = adding one file in `src/actions/` that `export default`s an `ActionDefinition`. No central registry to update. Both `index.ts` (the bot) and `lib/deployCommands.ts` (slash registration) call `loadActions`. Only `.ts`/`.js` files are read (`.d.ts` excluded); files without a valid default export (no `action.name`) and duplicate names are skipped with a `console.warn`.

**Utility commands are NOT auto-loaded.** `commands/help.ts` (`/хелп`) and `commands/statistics.ts` (`/статистика`) are `UtilityCommand`s, registered by hand in **two** places: the `client.utility` collection in `index.ts`, and the slash-registration body in `lib/deployCommands.ts`. Adding a utility command means editing both. `interactionCreate.ts` resolves `client.utility` first, then falls back to `rpActions`; utility commands are not subject to cooldowns. `/хелп` (`help.ts`) auto-lists `rpActions`, splitting them into a "РП-команды" vs "Другие команды" section by `action.noTarget` — so a `noTarget` action silently lands under "Другие команды".

**One entry path, one response builder.** `events/interactionCreate.ts` (slash, reads the `цель` user option) resolves the `ActionDefinition` and calls `lib/buildResponse.ts`. Keep RP behavior changes in `buildResponse`. The `цель` ("target") slash option name is hardcoded in `lib/deployCommands.ts`, `events/interactionCreate.ts`, and `commands/statistics.ts` — change them together.

**ActionDefinition** (`src/types.ts`) controls everything:
- `name` — canonical name AND the slash command name AND the gif-config key (see below).
- `template` / `selfTemplate` — message text; `{author}` and `{target}` are substituted. `selfTemplate` is used when there's no target (or the user targets themselves).
- `requireTarget` — reject if no target; `noTarget` — command takes no target option at all.
- `customEmbed` — bypasses the template/gif flow entirely and returns a fully custom embed (see `actions/silly.ts`, which rolls a random value and picks from named gif pools).
- `color` — embed color for the template/gif flow; `buildResponse.ts` falls back to `0xff7fa5` (pink) when unset. (`customEmbed` actions set their own color and ignore this.)
- The interface also declares `gifs?: string[]`, but it is **dead** — nothing reads it. Per-action gifs come *only* from the `config.json` `gifs` map keyed by `name` (see below); putting `gifs` in an action file does nothing.

**Gif config coupling.** `lib/buildResponse.ts` calls `pickGif(action.name)`, so the keys under `gifs` in `config.json` MUST exactly match each action's `name` (e.g. `"поцеловать"`). A new action with no matching config key simply renders text with no image. `customEmbed` actions instead pull from the `silly` config map via `pickSillyGif(pool)`.

**Live config reload.** `lib/gifStore.ts` and `lib/rewardsConfig.ts` both re-read `config.json` on every lookup if the file mtime changed (gifStore also validates URLs as http/https and avoids repeating the last-picked gif). So edits to `gifs`, `silly`, and `rewards` in `config.json` take effect without restart. `config.ts` values (`token`, `clientId`, `guildId`) are read once at startup and need a restart. In Docker, `config.json` is mounted as a read-only volume for live gif/reward edits.

**Config shape.** `config.json` is nested: secrets under `discord` (`token`, `clientId`, `guildId`), plus top-level `gifs`, `silly`, and `rewards`. `config.ts` validates `discord.token`/`discord.clientId` on load.

**Cooldowns** (`lib/cooldowns.ts`) are in-memory, per-(guild, action), 20s — passed explicitly in `index.ts` (`new CooldownManager(20)`; the constructor's own default arg is `25` and is never used). On send failure the handler calls `cooldowns.clear(...)` to roll back the cooldown so a failed action isn't penalized. A `cleanup()` interval (every 5 min, `.unref()`'d so it never holds the process open at shutdown) prunes stale entries.

### Stats & rewards subsystem

`events/activity.ts` listens to `MessageCreate` and `VoiceStateUpdate` purely to **count activity** (not for commands) — so the `MessageContent` privileged intent is not requested. Intents used: `Guilds`, `GuildMessages`, `GuildVoiceStates` (the last is non-privileged). The client is also built with `partials: [Partials.Channel]` (needed for uncached/DM channels) — preserve it when editing the intents block.

- **Counting.** Each non-bot guild message increments a counter; voice presence is tracked as in-memory sessions (`activeSessions`), ticked every 60s, settled on `VoiceStateUpdate`, and resumed on `ClientReady` (`scanExistingVoice`). `lib/rewardsConfig.ts` `voice.ignoreAfkChannel` / `voice.ignoreDeafened` rules decide whether a session counts. Each 60s tick (and `flushVoiceSessions`) commits only the **delta** since the last tick and resets `session.startedAt`, incrementally draining the session into persisted stats; `getActiveVoiceMs` returns just the un-ticked tail, which `/статистика` adds on top of persisted `voiceMs`. Don't compute total voice as `now − startedAt` — that double-counts after the first tick.
- **Persistence** is `lib/statsStore.ts` on top of `node:sqlite` (`DatabaseSync`, no native dep). The in-memory `guilds` map is the runtime source of truth; a `dirty` set is flushed to `data/stats.db` every 30s (`startAutoFlush`) and on `SIGINT`/`SIGTERM` (`index.ts` `shutdown` → `flushVoiceSessions` + `flushStats`). On first run, a legacy `data/stats.json` is imported once then renamed `.bak`. Override paths via `DATA_PATH` / `LEGACY_STATS_PATH` / `CONFIG_PATH` env vars.
- **Reward roles.** On each counted message/voice tick, `activity.ts` syncs the member's reward roles: it **grants** every role whose threshold (`rewards.messageRoles[].count`, `rewards.voiceRoles[].hours`) is met and, unless `rewards.removeUnearnedRoles` is `false` (default `true`), **removes** any configured reward role the member holds but no longer qualifies for (e.g. after a threshold is raised or a role was assigned by hand). Removal only ever touches roles listed in `messageRoles`/`voiceRoles`, never other roles; it is enforced at activity time, so a member is re-synced the next time they send a message or are counted in voice. Because the bot runs **without** the `GuildMembers` privileged intent, the member cache (and therefore `Role.members`, read by the hourly `sweepRoles`) only contains members the bot has actually seen — those with tracked activity or currently in voice. A reward role hand-assigned to an otherwise completely inactive member is thus **not** auto-removed until that member produces some activity; enabling `GuildMembers` + a bulk `guild.members.fetch()` in the sweep would be required to cover that case. `rewardsConfig.ts` sanitizes both lists on every reload — it drops entries with `count <= 0` / `hours <= 0` or an empty `roleId`, and **sorts them ascending**. `/статистика`'s "next role" lookup (`.find(r => r.count > x)` / `.find(r => r.hours > x)`) is only correct because of that ascending sort. The bot role needs "Manage Roles" and must sit above the granted roles in the hierarchy.
- **`/статистика`** (`commands/statistics.ts`) reads persisted stats plus the live un-settled voice session (`getActiveVoiceMs`) and shows progress toward the next message/voice role.

## Conventions

- ESM with `NodeNext` resolution: **all relative imports use `.js` extensions** even though the source is `.ts` (e.g. `import { config } from './config.js'`). Match this in new files.
- TypeScript is `strict`. Russian is used for user-facing text, command/config keys, and log messages — follow the existing language for consistency.
- This codebase is kept comment-free — do not add code comments.
