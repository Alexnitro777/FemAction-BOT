# Graph Report - FemAction-BOT  (2026-10-25)

## Corpus Check
- 41 files · ~12,434 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 243 nodes · 506 edges · 14 communities (11 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `87c8331a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- src/types.ts
- index.ts
- activity.ts
- gifStore.ts
- statsStore.ts
- package.json
- registry.ts
- leaderboard.ts
- compilerOptions
- rewardsConfig.ts
- CooldownManager
- Ponytail + Graphify, lazy senior dev mode

## God Nodes (most connected - your core abstractions)
1. `discord.js` - 20 edges
2. `ActionDefinition` - 14 edges
3. `getStats()` - 13 edges
4. `compilerOptions` - 13 edges
5. `syncRewardRoles()` - 12 edges
6. `registerActivityHandlers()` - 12 edges
7. `main()` - 11 edges
8. `buildStatsEmbed()` - 8 edges
9. `handleVoiceStateUpdate()` - 8 edges
10. `handleGuildMemberUpdate()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `pick()` --calls--> `pickSillyGif()`  [EXTRACTED]
  src/actions/silly.ts → src/lib/gifStore.ts
- `runBackfill()` --calls--> `flushStats()`  [EXTRACTED]
  src/commands/backfill.ts → src/lib/statsStore.ts
- `runBackfill()` --calls--> `setMessages()`  [EXTRACTED]
  src/commands/backfill.ts → src/lib/statsStore.ts
- `buildStatsEmbed()` --calls--> `getMessageRoles()`  [EXTRACTED]
  src/commands/statistics.ts → src/lib/rewardsConfig.ts
- `buildStatsEmbed()` --calls--> `getVoiceRoles()`  [EXTRACTED]
  src/commands/statistics.ts → src/lib/rewardsConfig.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Action Auto-loading Flow** — src_lib_loadactions, src_index, src_lib_deploycommands [EXTRACTED 1.00]
- **Embed Posting Subsystem** — src_embeds_registry, src_commands_post, src_events_interactioncreate [EXTRACTED 1.00]
- **Stats & Rewards Subsystem** — src_events_activity, src_lib_statsstore, src_lib_rewardsconfig, src_commands_backfill [EXTRACTED 1.00]

## Communities (14 total, 3 thin omitted)

### Community 0 - "src/types.ts"
Cohesion: 0.12
Nodes (12): action, action, action, action, action, action, action, action (+4 more)

### Community 1 - "index.ts"
Cohesion: 0.11
Nodes (25): discord.js, collectArchivedThreads(), collectChannels(), command, Crawlable, crawlChannel(), hasThreads(), runBackfill() (+17 more)

### Community 2 - "activity.ts"
Cohesion: 0.19
Nodes (25): activeSessions, counts(), describeRoleError(), ensureRoleExists(), EXCLUDED_REWARD_USER_IDS, grantRole(), handleGuildMemberUpdate(), handleVoiceStateUpdate() (+17 more)

### Community 3 - "gifStore.ts"
Cohesion: 0.14
Nodes (20): action, pick(), SillyPool, TIERS, registerInteractionHandler(), buildActionResponse(), fill(), formatCooldownTime() (+12 more)

### Community 4 - "statsStore.ts"
Cohesion: 0.16
Nodes (18): flushVoiceSessions(), main(), addMessage(), addVoiceMs(), DB_PATH, dirty, dirtyKey(), emptyStats() (+10 more)

### Community 5 - "package.json"
Cohesion: 0.10
Nodes (21): dependencies, discord.js@14.27.0, description, devDependencies, tsx@4.23.1, @types/node@26.1.1, typescript@7.0.2, main (+13 more)

### Community 6 - "registry.ts"
Cohesion: 0.12
Nodes (12): EMOJI, info, __dirname, isEmbedDefinition(), loadEmbeds(), SKIP, rules, EmbedDefinition (+4 more)

### Community 7 - "leaderboard.ts"
Cohesion: 0.25
Nodes (15): buildEmbed(), Entry, MEDALS, Page, rankPrefix(), topMessages(), topVoice(), buildStatsEmbed() (+7 more)

### Community 8 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule (+7 more)

### Community 9 - "rewardsConfig.ts"
Cohesion: 0.12
Nodes (19): config.json, build, container_name, environment, image, restart, volumes, services (+11 more)

### Community 13 - "Ponytail + Graphify, lazy senior dev mode"
Cohesion: 0.40
Nodes (4): Before you write (Graph-First Scoping), Execution & Graph Discipline, Ponytail + Graphify, lazy senior dev mode, The smallest complete change

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `discord.js` connect `index.ts` to `src/types.ts`, `activity.ts`, `gifStore.ts`, `package.json`, `registry.ts`, `leaderboard.ts`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11956521739130435 - nodes in this community are weakly interconnected._
- **Why does `config.json` connect `rewardsConfig.ts` to `gifStore.ts`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10793650793650794 - nodes in this community are weakly interconnected._
- **Should `gifStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14492753623188406 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1038961038961039 - nodes in this community are weakly interconnected._
- **Should `registry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._