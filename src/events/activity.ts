import { Events, GuildMember, Message, VoiceState } from 'discord.js';
import type { BotClient } from '../types.js';
import { addMessage, addVoiceMs } from '../lib/statsStore.js';
import {
  getMessageRoles,
  getVoiceRoles,
  getVoiceRules,
  getRemoveUnearnedRoles,
} from '../lib/rewardsConfig.js';
import { config } from '../config.js';

const VOICE_TICK_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

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

async function syncMessageRoles(member: GuildMember, count: number): Promise<void> {
  const remove = getRemoveUnearnedRoles();
  for (const role of getMessageRoles()) {
    if (count >= role.count) {
      await grantRole(member, role.roleId);
    } else if (remove) {
      await revokeRole(member, role.roleId);
    }
  }
}

async function syncVoiceRoles(member: GuildMember, voiceMs: number): Promise<void> {
  const hours = voiceMs / HOUR_MS;
  const remove = getRemoveUnearnedRoles();
  for (const role of getVoiceRoles()) {
    if (hours >= role.hours) {
      await grantRole(member, role.roleId);
    } else if (remove) {
      await revokeRole(member, role.roleId);
    }
  }
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
  const elapsed = now - session.startedAt;
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
    await syncVoiceRoles(member, total);
  }

  if (counts(newState)) {
    activeSessions.set(sessionKey(guildId, userId), { startedAt: now });
  }
}

async function tickVoice(client: BotClient): Promise<void> {
  const now = Date.now();
  for (const [key, session] of activeSessions) {
    const elapsed = now - session.startedAt;
    if (elapsed <= 0) continue;

    const sep = key.indexOf(':');
    const guildId = key.slice(0, sep);
    const userId = key.slice(sep + 1);

    const total = addVoiceMs(guildId, userId, elapsed);
    session.startedAt = now;

    const member = client.guilds.cache.get(guildId)?.members.cache.get(userId);
    if (member) {
      await syncVoiceRoles(member, total);
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
    const elapsed = now - session.startedAt;
    if (elapsed <= 0) continue;

    const sep = key.indexOf(':');
    const guildId = key.slice(0, sep);
    const userId = key.slice(sep + 1);

    addVoiceMs(guildId, userId, elapsed);
    session.startedAt = now;
  }
}

function scanExistingVoice(client: BotClient): void {
  const now = Date.now();
  let started = 0;
  for (const guild of client.guilds.cache.values()) {
    if (!inScope(guild.id)) continue;
    for (const state of guild.voiceStates.cache.values()) {
      if (counts(state)) {
        activeSessions.set(sessionKey(guild.id, state.id), { startedAt: now });
        started++;
      }
    }
  }
  if (started > 0) {
    console.log(`[rewards] Возобновлено голосовых сессий при старте: ${started}.`);
  }
}

export function registerActivityHandlers(client: BotClient): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot || !message.guildId || !inScope(message.guildId)) return;

    try {
      const count = addMessage(message.guildId, message.author.id);
      if (message.member) {
        await syncMessageRoles(message.member, count);
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

  client.once(Events.ClientReady, () => {
    scanExistingVoice(client);
  });

  setInterval(() => {
    void tickVoice(client);
  }, VOICE_TICK_MS).unref();
}
