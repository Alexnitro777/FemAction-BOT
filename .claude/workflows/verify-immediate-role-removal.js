export const meta = {
  name: 'verify-immediate-role-removal',
  description: 'Independently verify FemAction-BOT role-sync flow and adversarially harden an instant hand-assigned-role removal design (GuildMemberUpdate)',
  phases: [
    { title: 'Map' },
    { title: 'Harden' },
    { title: 'Synthesize' },
  ],
}

phase('Map')

const TRACE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['roleMutationSites', 'eventListeners', 'hasGuildMemberUpdate', 'intents', 'removeFlagRespected', 'notes'],
  properties: {
    roleMutationSites: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['file', 'symbol', 'action'],
        properties: {
          file: { type: 'string' },
          symbol: { type: 'string' },
          action: { type: 'string', enum: ['add', 'remove', 'both'] },
        },
      },
    },
    eventListeners: { type: 'array', items: { type: 'string' }, description: 'Every Events.* the bot listens to' },
    hasGuildMemberUpdate: { type: 'boolean', description: 'Does any GuildMemberUpdate listener already exist?' },
    intents: { type: 'array', items: { type: 'string' } },
    removeFlagRespected: { type: 'string', description: 'Where/how getRemoveUnearnedRoles gates removal' },
    notes: { type: 'string', description: 'Anything surprising or any other role-management path I should know' },
  },
}

const RESEARCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['firesOnRoleAdd', 'intentRequired', 'loopRisk', 'diffPattern', 'partialRisk', 'rateLimitNotes', 'confidence'],
  properties: {
    firesOnRoleAdd: { type: 'boolean', description: 'Does GuildMemberUpdate fire when a role is added by an admin?' },
    intentRequired: { type: 'string', description: 'Which gateway intent delivers GuildMemberUpdate' },
    loopRisk: { type: 'string', description: 'Does the bot calling member.roles.remove() inside the handler re-trigger GuildMemberUpdate, and does that cause an infinite loop given an added-role-only filter?' },
    diffPattern: { type: 'string', description: 'Recommended way to diff oldMember.roles vs newMember.roles in discord.js v14' },
    partialRisk: { type: 'string', description: 'Can the member be partial in GuildMemberUpdate; mitigation' },
    rateLimitNotes: { type: 'string' },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
}

const [trace, research] = await parallel([
  () => agent(
    `You are auditing the Discord bot at F:\\FemAction-BOT (TypeScript, discord.js v14, ESM with .js import specifiers). ` +
    `Goal: find EVERY place in src/ where the bot adds or removes a Discord role, EVERY gateway event it listens to (search for "Events." and "client.on"/"client.once"), ` +
    `whether any GuildMemberUpdate listener already exists, the exact GatewayIntentBits list in src/index.ts, and exactly where getRemoveUnearnedRoles() gates removal. ` +
    `Pay attention to src/events/activity.ts, src/index.ts, src/lib/rewardsConfig.ts, src/lib/statsStore.ts. ` +
    `Report any OTHER path that mutates reward roles besides syncRewardRoles. Be exhaustive and precise with file paths and symbol names.`,
    { label: 'trace:codebase', phase: 'Map', schema: TRACE_SCHEMA, agentType: 'Explore' }
  ),
  () => agent(
    `You are a discord.js v14 expert. Answer precisely about the GuildMemberUpdate gateway event, used to instantly remove a reward role that an admin just hand-assigned to a member who has not earned it. ` +
    `Questions: (1) Does GuildMemberUpdate fire when an admin adds a role to a member? (2) Which GatewayIntentBits delivers it (is GuildMembers enough)? ` +
    `(3) LOOP RISK: if inside the handler the bot calls member.roles.remove(roleId), discord.js emits another GuildMemberUpdate. If the handler ONLY reacts when a *managed reward role was ADDED* (present in newMember.roles.cache but not oldMember.roles.cache), does the bot's own removal (a role going away, not added) re-trigger the reaction — i.e. is an added-role-only filter sufficient to prevent an infinite loop? Also consider the bot granting an EARNED role. ` +
    `(4) Recommended pattern to compute added roles between oldMember and newMember in v14. ` +
    `(5) Can the member/oldMember be partial in this event and how to guard. (6) Rate-limit considerations if many roles change at once. ` +
    `Prefer authoritative knowledge; use WebSearch/WebFetch on discord.js.org docs if helpful. State your confidence.`,
    { label: 'research:discordjs', phase: 'Map', schema: RESEARCH_SCHEMA }
  ),
])

phase('Harden')

const DESIGN = `
PROPOSED DESIGN for instant removal of hand-assigned (or any unearned) reward roles in FemAction-BOT:

Add a new listener inside registerActivityHandlers(client) in src/events/activity.ts:

  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    try {
      const guildId = newMember.guild.id;
      if (!inScope(guildId)) return;
      if (!getRemoveUnearnedRoles()) return;            // honor the config flag

      // managed reward role IDs
      const managed = new Set([
        ...getMessageRoles().map(r => r.roleId),
        ...getVoiceRoles().map(r => r.roleId),
      ].filter(Boolean));
      if (managed.size === 0) return;

      // only react if a MANAGED role was newly ADDED (prevents loop: bot's own removal won't match)
      const added = [...newMember.roles.cache.keys()]
        .filter(id => !oldMember.roles.cache.has(id) && managed.has(id));
      if (added.length === 0) return;

      let member = newMember;
      if (member.partial) member = await member.fetch();
      if (member.user.bot) return;

      const stats = getStats(guildId, member.id);                  // persisted messages + voiceMs
      const liveTail = getActiveVoiceMs(guildId, member.id);       // un-ticked voice tail
      await syncRewardRoles(member, stats.messages, stats.voiceMs + liveTail);
    } catch (err) {
      console.error('Ошибка синхронизации ролей при изменении участника:', err);
    }
  });

Rationale:
- syncRewardRoles already grants earned + removes unearned managed roles (gated by getRemoveUnearnedRoles), so reusing it keeps one code path.
- Filtering to ADDED managed roles makes the handler a no-op for the bot's own revoke (removal, not addition) -> no infinite loop. Granting an EARNED role is idempotent (it stays earned).
- GuildMembers intent (already enabled) delivers GuildMemberUpdate.
- This complements, not replaces, the existing message/voice/hourly-sweep sync.
`

const CRITIQUE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'flaws', 'loopSafe', 'missesAnyCase'],
  properties: {
    verdict: { type: 'string', enum: ['sound', 'sound-with-fixes', 'broken'] },
    loopSafe: { type: 'boolean' },
    missesAnyCase: { type: 'boolean', description: 'Does it fail to remove a hand-assigned unearned role in some scenario?' },
    flaws: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['issue', 'severity', 'fix'],
        properties: {
          issue: { type: 'string' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'nit'] },
          fix: { type: 'string' },
        },
      },
    },
  },
}

const LENSES = [
  { key: 'loop', focus: 'Infinite-loop / event-storm safety. Trace what happens when the bot calls member.roles.remove inside the handler, when an admin bulk-assigns many roles, and when the role being added is EARNED. Use the research findings.' },
  { key: 'correctness', focus: 'Does it actually remove a hand-assigned UNEARNED role in every realistic case, including: member is partial, member not in cache, getActiveVoiceMs vs persisted voiceMs, the role is added together with non-managed roles, voice hours boundary.' },
  { key: 'integration', focus: 'Consistency with existing code: does it duplicate the managed/earned computation already in syncRewardRoles, does honoring getRemoveUnearnedRoles at the top change grant behavior the user did not ask to change, ESM/.js import and discord.js typing (GuildMember vs PartialGuildMember in the listener signature), and whether this should live in activity.ts vs index.ts.' },
]

const critiques = await parallel(LENSES.map(l => () =>
  agent(
    `Adversarially review this design through the "${l.key}" lens. Try hard to REFUTE it; default to finding problems.\n\n` +
    `FOCUS: ${l.focus}\n\n` +
    `RESEARCH FINDINGS (discord.js v14): ${JSON.stringify(research)}\n\n` +
    `CODEBASE FACTS: ${JSON.stringify(trace)}\n\n` +
    `DESIGN:\n${DESIGN}\n\n` +
    `Return concrete, actionable flaws with fixes. If it is genuinely sound on your lens, say so.`,
    { label: `critique:${l.key}`, phase: 'Harden', schema: CRITIQUE_SCHEMA }
  )
))

phase('Synthesize')

const SYNTH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['overallVerdict', 'loopSafe', 'finalDesignNotes', 'mustFix', 'shouldConsider', 'finalHandlerSketch'],
  properties: {
    overallVerdict: { type: 'string', enum: ['ship', 'ship-with-fixes', 'redesign'] },
    loopSafe: { type: 'boolean' },
    finalDesignNotes: { type: 'string' },
    mustFix: { type: 'array', items: { type: 'string' } },
    shouldConsider: { type: 'array', items: { type: 'string' } },
    finalHandlerSketch: { type: 'string', description: 'The corrected, final TypeScript handler to add, incorporating all blocker/major fixes. ESM, .js imports, discord.js v14, no code comments (repo is comment-free).' },
  },
}

const synthesis = await agent(
  `Synthesize a final, implementation-ready verdict for the instant reward-role-removal feature in FemAction-BOT.\n\n` +
  `CODEBASE FACTS: ${JSON.stringify(trace)}\n\n` +
  `DISCORD.JS RESEARCH: ${JSON.stringify(research)}\n\n` +
  `ORIGINAL DESIGN:\n${DESIGN}\n\n` +
  `ADVERSARIAL CRITIQUES: ${JSON.stringify(critiques.filter(Boolean))}\n\n` +
  `Resolve conflicts, keep only fixes that are genuinely warranted, and produce the final handler code. ` +
  `The repo is strictly comment-free (CLAUDE.md), uses ESM with .js import specifiers, discord.js v14, TypeScript strict. ` +
  `The handler is added inside registerActivityHandlers in src/events/activity.ts. Do not change unrelated behavior.`,
  { label: 'synthesize', phase: 'Synthesize', schema: SYNTH_SCHEMA, effort: 'high' }
)

return { trace, research, critiques: critiques.filter(Boolean), synthesis }