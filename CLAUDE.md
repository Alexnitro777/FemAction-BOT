# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FemAction-BOT is a Discord bot of RP ("roleplay") commands. Each action (`hug`, `kiss`, etc.) is defined once and exposed as **both** a text command (`!обнять @user`) and a slash command (`/обнять`). User-facing strings, command names, and config keys are in Russian.

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

Requires a `config.json` (copy from `config.example.json`); the bot throws on startup if `token` or `clientId` is missing.

## Architecture

**Action auto-loading.** `src/lib/loadActions.ts` reads every file in `src/actions/` at startup and builds two maps: `rpActions` (keyed by `action.name`) and `textIndex` (each `textName`/alias, lowercased → canonical `name`). Adding a command = adding one file in `src/actions/` that `export default`s an `ActionDefinition`. No central registry to update. Both `index.ts` (the bot) and `deployCommands.ts` (slash registration) call `loadActions`, so a new file appears in both command forms automatically. Duplicate names/aliases are skipped with a warning.

**Two entry paths, one response builder.** `events/messageCreate.ts` (text, parses prefix + mentions) and `events/interactionCreate.ts` (slash, reads the `цель` user option) resolve the same `ActionDefinition` and both call `lib/buildResponse.ts`. Keep behavior changes in `buildResponse` so both paths stay consistent. The `цель` ("target") slash option name is hardcoded in both `deployCommands.ts` and `interactionCreate.ts` — change both together.

**ActionDefinition** (`src/types.ts`) controls everything:
- `name` — canonical name AND the slash command name AND the gif-config key (see below).
- `textName` + `aliases` — text-command triggers.
- `template` / `selfTemplate` — message text; `{author}` and `{target}` are substituted. `selfTemplate` is used when there's no target (or the user targets themselves).
- `requireTarget` — reject if no target; `noTarget` — command takes no target option at all.
- `customEmbed` — bypasses the template/gif flow entirely and returns a fully custom embed (see `actions/silly.ts`, which rolls a random value and picks from named gif pools).

**Gif config coupling.** `lib/buildResponse.ts` calls `pickGif(action.name)`, so the keys under `gifs` in `config.json` MUST exactly match each action's `name` (e.g. `"поцеловать"`). A new action with no matching config key simply renders text with no image. `customEmbed` actions instead pull from the `silly` config map via `pickSillyGif(pool)`.

**Live config reload.** `lib/gifStore.ts` re-reads `config.json` on every gif lookup if the file mtime changed, validates URLs (http/https only), and avoids repeating the last-picked gif. So gif edits in `config.json` take effect without restart; `config.ts` values (`token`, `clientId`, `prefix`) are read once at startup and need a restart. In Docker, `config.json` is mounted as a volume for this reason.

**Cooldowns** (`lib/cooldowns.ts`) are in-memory, per-(guild, action), default 20s, set in `index.ts`. On send failure the handlers call `cooldowns.clear(...)` to roll back the cooldown so a failed action isn't penalized. A periodic `cleanup()` interval prunes stale entries.

## Conventions

- ESM with `NodeNext` resolution: **all relative imports use `.js` extensions** even though the source is `.ts` (e.g. `import { config } from './config.js'`). Match this in new files.
- TypeScript is `strict`. Russian is used for user-facing text, command/config keys, and log messages — follow the existing language for consistency.
