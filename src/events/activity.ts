import {
  Events,
  GuildMember,
  Message,
  PartialGuildMember,
  VoiceState,
} from 'discord.js';
import type { BotClient } from '../types.js';
import {
  addMessage,
  addVoiceMs,
  getStats,
  getGuildUserIds,
} from '../lib/statsStore.js';
import {
  getMessageRoles,
  getVoiceRoles,
  getVoiceRules,
  getRemoveUnearnedRoles,
} from '../lib/rewardsConfig.js';
import { config } from '../config.js';

const VOICE_TICK_MS = 15 * 1000;
const MAX_TICK_MS = VOICE_TICK_MS * 2;
const HOUR_MS = 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

const activeSessions = new Map<string, { startedAt: number }>();
const missingRoleWarned = new Set<string>();

function sessionKey(guildId: string, userId: string): string {
  return `${guildId}:${userId}`;
}

function inScope(guildId: string): boolean {
  return !config.guildId || guildId === config.guildId;
}

function counts(state: VoiceState): boolean {
  const channel = state.channel;
  if (!channel) return false;

  const rules = getVoiceRules();
  if (rules.ignoreAfkChannel && channel.id === state.guild.afkChannelId) {
    return false;
  }
  if (rules.ignoreDeafened && state.deaf) {
    return false;
  }
  return true;
}

function ensureRoleExists(member: GuildMember, roleId: string): boolean {
  if (member.guild.roles.cache.has(roleId)) return true;
  const key = `${member.guild.id}:${roleId}`;
  if (!missingRoleWarned.has(key)) {
    missingRoleWarned.add(key);
    console.warn(
      `[rewards] Роль ${roleId} не найдена на сервере ${member.guild.id} — пропускаю выдачу. ` +
        'Проверь ID роли в config.json (rewards).'
    );
  }
  return false;
}

function describeRoleError(err: unknown): string {
  const e = err as { code?: number; message?: string };
  const base = `${e?.message ?? String(err)}${e?.code !== undefined ? ` (код ${e.code})` : ''}`;
  if (e?.code === 50013) {
    return `${base}. Проверь право «Управление ролями» и иерархию ролей бота`;
  }
  return base;
}

async function grantRole(member: GuildMember, roleId: string): Promise<void> {
  if (!roleId || member.roles.cache.has(roleId)) return;
  if (!ensureRoleExists(member, roleId)) return;

  try {
    await member.roles.add(roleId);
    console.log(
      `[rewards] Выдана роль ${roleId} пользователю ${member.user.tag} (${member.id}).`
    );
  } catch (err) {
    console.warn(
      `[rewards] Не удалось выдать роль ${roleId} пользователю ${member.id}: ${describeRoleError(err)}.`
    );
  }
}

async function revokeRole(member: GuildMember, roleId: string): Promise<void> {
  if (!roleId || !member.roles.cache.has(roleId)) return;

  try {
    await member.roles.remove(roleId);
    console.log(
      `[rewards] Снята роль ${roleId} у пользователя ${member.user.tag} (${member.id}).`
    );
  } catch (err) {
    console.warn(
      `[rewards] Не удалось снять роль ${roleId} у пользователя ${member.id}: ${describeRoleError(err)}.`
    );
  }
}

async function syncRewardRoles(
  member: GuildMember,
  messages: number,
  voiceMs: number
): Promise<void> {
  const hours = voiceMs / HOUR_MS;
  const earned = new Set<string>();
  const managed = new Set<string>();

  for (const role of getMessageRoles()) {
    if (!role.roleId) continue;
    managed.add(role.roleId);
    if (messages >= role.count) earned.add(role.roleId);
  }
  for (const role of getVoiceRoles()) {
    if (!role.roleId) continue;
    managed.add(role.roleId);
    if (hours >= role.hours) earned.add(role.roleId);
  }

  for (const roleId of earned) {
    await grantRole(member, roleId);
  }

  if (getRemoveUnearnedRoles()) {
    for (const roleId of managed) {
      if (!earned.has(roleId)) {
        await revokeRole(member, roleId);
      }
    }
  }
}

export async function syncRewardRolesForMember(
  member: GuildMember
): Promise<void> {
  const stats = getStats(member.guild.id, member.id);
  await syncRewardRoles(member, stats.messages, stats.voiceMs);
}

function settleSession(
  guildId: string,
  userId: string,
  now: number
): number | null {
  const key = sessionKey(guildId, userId);
  const session = activeSessions.get(key);
  if (!session) return null;

  activeSessions.delete(key);
  const elapsed = Math.min(now - session.startedAt, MAX_TICK_MS);
  if (elapsed <= 0) return null;
  return addVoiceMs(guildId, userId, elapsed);
}

async function handleVoiceStateUpdate(
  oldState: VoiceState,
  newState: VoiceState
): Promise<void> {
  const guildId = newState.guild.id;
  if (!inScope(guildId)) return;

  const userId = newState.id;
  const member = newState.member ?? oldState.member;
  const now = Date.now();

  const total = settleSession(guildId, userId, now);
  if (total !== null && member) {
    await syncRewardRoles(member, getStats(guildId, userId).messages, total);
  }

  if (counts(newState)) {
    activeSessions.set(sessionKey(guildId, userId), { startedAt: now });
  } else if (newState.channel) {
    console.log(
      `[rewards] Голос не засчитывается для ${userId}: deaf=${newState.deaf}, ` +
        `afk=${newState.channel.id === newState.guild.afkChannelId}.`
    );
  }
}

async function handleGuildMemberUpdate(
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember
): Promise<void> {
  if (!inScope(newMember.guild.id)) return;
  if (newMember.user.bot) return;
  if (!getRemoveUnearnedRoles()) return;

  const managed = new Set<string>();
  for (const role of getMessageRoles()) {
    if (role.roleId) managed.add(role.roleId);
  }
  for (const role of getVoiceRoles()) {
    if (role.roleId) managed.add(role.roleId);
  }
  if (managed.size === 0) return;

  let addedManaged = oldMember.partial;
  if (!addedManaged) {
    for (const roleId of newMember.roles.cache.keys()) {
      if (managed.has(roleId) && !oldMember.roles.cache.has(roleId)) {
        addedManaged = true;
        break;
      }
    }
  }
  if (!addedManaged) return;

  const stats = getStats(newMember.guild.id, newMember.id);
  await syncRewardRoles(newMember, stats.messages, stats.voiceMs);
}

async function tickVoice(client: BotClient): Promise<void> {
  const now = Date.now();
  reconcileSessions(client, now);

  for (const [key, session] of activeSessions) {
    const sep = key.indexOf(':');
    const guildId = key.slice(0, sep);
    const userId = key.slice(sep + 1);

    const guild = client.guilds.cache.get(guildId);
    const state = guild?.voiceStates.cache.get(userId);
    if (!state || !counts(state)) {
      activeSessions.delete(key);
      continue;
    }

    const elapsed = Math.min(now - session.startedAt, MAX_TICK_MS);
    session.startedAt = now;
    if (elapsed <= 0) continue;

    const total = addVoiceMs(guildId, userId, elapsed);

    let member = guild?.members.cache.get(userId) ?? state.member ?? undefined;
    if (!member && guild) {
      member = await guild.members.fetch(userId).catch(() => undefined);
    }
    if (member) {
      await syncRewardRoles(member, getStats(guildId, userId).messages, total);
    } else {
      console.warn(
        `[rewards] Участник ${userId} не в кэше — время начислено, роль не синхронизирована.`
      );
    }
  }
}

export function getActiveVoiceMs(guildId: string, userId: string): number {
  const session = activeSessions.get(sessionKey(guildId, userId));
  if (!session) return 0;
  const elapsed = Date.now() - session.startedAt;
  return elapsed > 0 ? elapsed : 0;
}

export function flushVoiceSessions(): void {
  const now = Date.now();
  for (const [key, session] of activeSessions) {
    const elapsed = Math.min(now - session.startedAt, MAX_TICK_MS);
    if (elapsed <= 0) continue;

    const sep = key.indexOf(':');
    const guildId = key.slice(0, sep);
    const userId = key.slice(sep + 1);

    addVoiceMs(guildId, userId, elapsed);
    session.startedAt = now;
  }
}

function reconcileSessions(client: BotClient, now: number): number {
  let started = 0;
  for (const guild of client.guilds.cache.values()) {
    if (!inScope(guild.id)) continue;
    for (const state of guild.voiceStates.cache.values()) {
      if (!counts(state)) continue;
      const key = sessionKey(guild.id, state.id);
      if (!activeSessions.has(key)) {
        activeSessions.set(key, { startedAt: now });
        started++;
      }
    }
  }
  return started;
}

function scanExistingVoice(client: BotClient): void {
  const started = reconcileSessions(client, Date.now());
  if (started > 0) {
    console.log(`[rewards] Возобновлено голосовых сессий при старте: ${started}.`);
  }
}

async function sweepRoles(client: BotClient): Promise<void> {
  if (!config.guildId) return;

  const msgRoles = getMessageRoles();
  const voiceRoles = getVoiceRoles();
  if (msgRoles.length === 0 && voiceRoles.length === 0) return;

  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) return;

  try {
    await guild.members.fetch();
  } catch (err) {
    console.warn(
      `[rewards] Не удалось загрузить участников для сверки: ${(err as Error).message}.`
    );
  }

  const userIds = new Set<string>(getGuildUserIds(config.guildId));
  for (const role of [...msgRoles, ...voiceRoles]) {
    const cached = guild.roles.cache.get(role.roleId);
    if (cached) {
      for (const id of cached.members.keys()) userIds.add(id);
    }
  }
  if (userIds.size === 0) return;

  let checked = 0;
  for (const userId of userIds) {
    let member: GuildMember | undefined;
    try {
      member = guild.members.cache.get(userId) ?? (await guild.members.fetch(userId));
    } catch {
      continue;
    }
    if (member.user.bot) continue;

    const stats = getStats(config.guildId, userId);
    await syncRewardRoles(member, stats.messages, stats.voiceMs);
    checked++;
  }

  console.log(`[rewards] Фоновая сверка ролей: проверено участников ${checked}.`);
}

async function runSweep(client: BotClient): Promise<void> {
  try {
    await sweepRoles(client);
  } catch (err) {
    console.error('Ошибка фоновой сверки ролей:', err);
  }
}

export function registerActivityHandlers(client: BotClient): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot || !message.guildId || !inScope(message.guildId)) return;

    try {
      const count = addMessage(message.guildId, message.author.id);
      if (message.member) {
        const { voiceMs } = getStats(message.guildId, message.author.id);
        await syncRewardRoles(message.member, count, voiceMs);
      }
    } catch (err) {
      console.error('Ошибка учёта сообщения:', err);
    }
  });

  client.on(
    Events.VoiceStateUpdate,
    async (oldState: VoiceState, newState: VoiceState) => {
      try {
        await handleVoiceStateUpdate(oldState, newState);
      } catch (err) {
        console.error('Ошибка учёта голосовой активности:', err);
      }
    }
  );

  client.on(
    Events.GuildMemberUpdate,
    async (oldMember, newMember) => {
      try {
        await handleGuildMemberUpdate(oldMember, newMember);
      } catch (err) {
        console.error('Ошибка синхронизации ролей при изменении участника:', err);
      }
    }
  );

  client.once(Events.ClientReady, () => {
    scanExistingVoice(client);
    void runSweep(client);
  });

  setInterval(() => {
    void tickVoice(client);
  }, VOICE_TICK_MS).unref();

  setInterval(() => {
    void runSweep(client);
  }, SWEEP_INTERVAL_MS).unref();
}
