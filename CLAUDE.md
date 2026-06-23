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

**Utility commands are NOT auto-loaded.** `commands/help.ts` (`/хелп`), `commands/statistics.ts` (`/статистика`), and `commands/backfill.ts` (`/скан`) are `UtilityCommand`s, registered by hand in **two** places: the `client.utility` collection in `index.ts` (the `[helpCommand, statisticsCommand, backfillCommand]` loop), and the slash-registration body in `lib/deployCommands.ts`. Adding a utility command means editing both. `interactionCreate.ts` resolves `client.utility` first, then falls back to `rpActions`; utility commands are not subject to cooldowns. `/хелп` (`help.ts`) auto-lists three sections: `rpActions` split into "🎭 РП-команды" vs "🎲 Другие команды" by `action.noTarget` (so a `noTarget` action silently lands under "Другие команды"), plus a "🛠️ Утилиты" section of `client.utility` entries that have an `executeSlash` and are not in help.ts's `HIDDEN_UTILITY` set (currently `{'скан'}`, so `/скан` is intentionally absent from `/хелп`).

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

`events/activity.ts` listens to `MessageCreate` and `VoiceStateUpdate` purely to **count activity** (not for commands) — so the `MessageContent` privileged intent is not requested. Intents used: `Guilds`, `GuildMembers`, `GuildMessages`, `GuildVoiceStates`. `GuildMembers` is a **privileged** intent and MUST be enabled in the Discord Developer Portal (Bot → Privileged Gateway Intents → Server Members Intent) or `client.login` throws a disallowed-intents error; it fully populates the member cache (a bulk `guild.members.fetch()` runs at the start of `sweepRoles`) so reward-role grant/removal reaches every member, including inactive hand-assigned holders, and so the voice tick can always resolve the `GuildMember`. The client is also built with `partials: [Partials.Channel]` (needed for uncached/DM channels) — preserve it when editing the intents block.

- **Counting.** Each non-bot guild message increments a counter; voice presence is tracked as in-memory sessions (`activeSessions`), ticked every 15s (`VOICE_TICK_MS`), settled on `VoiceStateUpdate`, and resumed on `ClientReady` (`scanExistingVoice`). `lib/rewardsConfig.ts` `voice.ignoreAfkChannel` / `voice.ignoreDeafened` rules decide whether a session counts. Each tick (and `flushVoiceSessions` / `settleSession`) commits only the **delta** since the last tick and resets `session.startedAt`, incrementally draining the session into persisted stats; each committed delta is clamped to `MAX_TICK_MS` (= 2× the tick = 30s) so a process pause, host sleep, or gateway lag can't retroactively credit a huge block of voice time. `getActiveVoiceMs` returns just the un-ticked tail (uncapped), which `/статистика` adds on top of persisted `voiceMs`. Don't compute total voice as `now − startedAt` — that double-counts after the first tick.
- **Persistence** is `lib/statsStore.ts` on top of `node:sqlite` (`DatabaseSync`, no native dep). The in-memory `guilds` map is the runtime source of truth; a `dirty` set is flushed to `data/stats.db` every 30s (`startAutoFlush`) and on `SIGINT`/`SIGTERM` (`index.ts` `shutdown` → `flushVoiceSessions` + `flushStats`). On first run, a legacy `data/stats.json` is imported once then renamed `.bak`. Override paths via `DATA_PATH` / `LEGACY_STATS_PATH` / `CONFIG_PATH` env vars.
- **Reward roles.** On each counted message/voice tick, `activity.ts` syncs the member's reward roles: it **grants** every role whose threshold (`rewards.messageRoles[].count`, `rewards.voiceRoles[].hours`) is met and, unless `rewards.removeUnearnedRoles` is `false` (default `true`), **removes** any configured reward role the member holds but no longer qualifies for (e.g. after a threshold is raised or a role was assigned by hand). Removal only ever touches roles listed in `messageRoles`/`voiceRoles`, never other roles. Sync runs on **four** triggers: (1) at activity time (next message / voice tick), (2) **immediately** when a managed reward role is hand-added — `activity.ts`'s `GuildMemberUpdate` handler (`handleGuildMemberUpdate`) detects a newly-added managed role (or a previously-`partial` member) and re-syncs at once, so an unearned hand-assigned role is stripped within moments instead of waiting for the next tick; (3) the hourly background sweep (`sweepRoles`); and (4) the `/скан` backfill. Triggers (2) and the removal half of all of them are gated by `removeUnearnedRoles`. The bot runs **with** the `GuildMembers` privileged intent and bulk-fetches members (`guild.members.fetch()`) at the start of `sweepRoles`, so the member cache (and therefore `Role.members`) is complete and the hourly sweep reaches **every** member — including a reward role hand-assigned to an otherwise completely inactive member, which it removes there. (Without `GuildMembers` the sweep would only see members already cached via activity.) `rewardsConfig.ts` sanitizes both lists on every reload — it drops entries with `count <= 0` / `hours <= 0` or an empty `roleId`, and **sorts them ascending**. `/статистика`'s "next role" lookup (`.find(r => r.count > x)` / `.find(r => r.hours > x)`) is only correct because of that ascending sort. The bot role needs "Manage Roles" and must sit above the granted roles in the hierarchy.
- **`/статистика`** (`commands/statistics.ts`) reads persisted stats plus the live un-settled voice session (`getActiveVoiceMs`) and shows progress toward the next message/voice role.
- **`/скан` backfill** (`commands/backfill.ts`, alpha) recounts message history. It is **owner-only** (hardcoded `OWNER_ID` constant — not config-driven) and main-guild-only (`config.guildId`), additionally registered with `Administrator` `setDefaultMemberPermissions` in `deployCommands.ts`, and hidden from `/хелп`. It crawls every text channel plus active and archived threads, tallies non-bot messages per user, then **overwrites** each user's message count via `statsStore.setMessages` (an absolute set — contrast `addMessage`, which increments), `flushStats()`, and finally calls the exported `syncRewardRolesForMember` for everyone tallied. A per-guild in-memory `running` guard rejects concurrent runs; progress is shown via throttled (4s) `editReply` edits on a deferred ephemeral reply. Because counts are set absolutely, channels the bot can't read are simply skipped (their prior contribution is lost on re-run), so treat a re-scan as "reset message stats to what the crawl can currently see." Voice time is untouched.

## Conventions

- ESM with `NodeNext` resolution: **all relative imports use `.js` extensions** even though the source is `.ts` (e.g. `import { config } from './config.js'`). Match this in new files.
- TypeScript is `strict`. Russian is used for user-facing text, command/config keys, and log messages — follow the existing language for consistency.
- User-facing quantities are pluralized through `lib/formatTime.ts` (`pluralize` + `formatCooldownTime` / `formatMessageCount` / `formatVoiceDuration` / `formatVoiceShort`), which applies Russian 1 / 2–4 / 5+ rules. Reuse these helpers rather than hand-formatting counts of seconds, messages, or hours.
- This codebase is kept comment-free — do not add code comments.
