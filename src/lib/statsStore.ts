import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DATA_PATH = resolve(process.cwd(), process.env.DATA_PATH || 'data/stats.json');

interface UserStats {
  messages: number;
  voiceMs: number;
}

type GuildStats = Map<string, UserStats>;

const guilds = new Map<string, GuildStats>();
let dirty = false;

function emptyStats(): UserStats {
  return { messages: 0, voiceMs: 0 };
}

function getUser(guildId: string, userId: string): UserStats {
  let guild = guilds.get(guildId);
  if (!guild) {
    guild = new Map();
    guilds.set(guildId, guild);
  }
  let user = guild.get(userId);
  if (!user) {
    user = emptyStats();
    guild.set(userId, user);
  }
  return user;
}

export function loadStats(): void {
  let text: string;
  try {
    text = readFileSync(DATA_PATH, 'utf8');
  } catch {
    return;
  }

  let raw: { guilds?: Record<string, Record<string, Partial<UserStats>>> };
  try {
    raw = JSON.parse(text);
  } catch (err) {
    console.warn(
      `[stats] Не удалось разобрать ${DATA_PATH}: ${(err as Error).message}. ` +
        'Начинаю с пустой статистики.'
    );
    return;
  }

  let users = 0;
  for (const [guildId, guildRaw] of Object.entries(raw.guilds ?? {})) {
    const guild: GuildStats = new Map();
    for (const [userId, stats] of Object.entries(guildRaw ?? {})) {
      guild.set(userId, {
        messages: Number(stats?.messages) || 0,
        voiceMs: Number(stats?.voiceMs) || 0,
      });
      users++;
    }
    guilds.set(guildId, guild);
  }

  console.log(`[stats] Загружена статистика: серверов ${guilds.size}, пользователей ${users}.`);
}

export function getStats(guildId: string, userId: string): UserStats {
  const user = guilds.get(guildId)?.get(userId);
  return { messages: user?.messages ?? 0, voiceMs: user?.voiceMs ?? 0 };
}

export function addMessage(guildId: string, userId: string): number {
  const user = getUser(guildId, userId);
  user.messages++;
  dirty = true;
  return user.messages;
}

export function addVoiceMs(guildId: string, userId: string, ms: number): number {
  const user = getUser(guildId, userId);
  user.voiceMs += ms;
  dirty = true;
  return user.voiceMs;
}

export function flushStats(): void {
  if (!dirty) return;

  const out: { guilds: Record<string, Record<string, UserStats>> } = { guilds: {} };
  for (const [guildId, guild] of guilds) {
    const guildOut: Record<string, UserStats> = {};
    for (const [userId, stats] of guild) {
      guildOut[userId] = stats;
    }
    out.guilds[guildId] = guildOut;
  }

  try {
    mkdirSync(dirname(DATA_PATH), { recursive: true });
    const tmp = `${DATA_PATH}.tmp`;
    writeFileSync(tmp, JSON.stringify(out), 'utf8');
    renameSync(tmp, DATA_PATH);
    dirty = false;
  } catch (err) {
    console.warn(`[stats] Не удалось сохранить статистику: ${(err as Error).message}`);
  }
}

export function startAutoFlush(): void {
  setInterval(flushStats, 30_000).unref();
}
