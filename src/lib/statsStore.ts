import { DatabaseSync, type StatementSync } from 'node:sqlite';
import { mkdirSync, readFileSync, renameSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DB_PATH = resolve(process.cwd(), process.env.DATA_PATH || 'data/stats.db');
const LEGACY_JSON_PATH = resolve(
  process.cwd(),
  process.env.LEGACY_STATS_PATH || 'data/stats.json'
);

interface UserStats {
  messages: number;
  voiceMs: number;
}

type GuildStats = Map<string, UserStats>;

const guilds = new Map<string, GuildStats>();
const dirty = new Set<string>();

let db: DatabaseSync | null = null;
let upsertStmt: StatementSync | null = null;

function dirtyKey(guildId: string, userId: string): string {
  return `${guildId}:${userId}`;
}

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

function importLegacyJson(): void {
  const row = db!.prepare('SELECT COUNT(*) AS n FROM user_stats').get() as {
    n: number;
  };
  if (Number(row.n) > 0) return;

  let text: string;
  try {
    text = readFileSync(LEGACY_JSON_PATH, 'utf8');
  } catch {
    return;
  }

  let raw: { guilds?: Record<string, Record<string, Partial<UserStats>>> };
  try {
    raw = JSON.parse(text);
  } catch (err) {
    console.warn(
      `[stats] Не удалось разобрать ${LEGACY_JSON_PATH} для импорта: ${(err as Error).message}.`
    );
    return;
  }

  const insert = db!.prepare(
    'INSERT OR REPLACE INTO user_stats (guild_id, user_id, messages, voice_ms) VALUES (?, ?, ?, ?)'
  );
  let imported = 0;
  db!.exec('BEGIN');
  try {
    for (const [guildId, guildRaw] of Object.entries(raw.guilds ?? {})) {
      for (const [userId, stats] of Object.entries(guildRaw ?? {})) {
        insert.run(
          guildId,
          userId,
          Number(stats?.messages) || 0,
          Number(stats?.voiceMs) || 0
        );
        imported++;
      }
    }
    db!.exec('COMMIT');
  } catch (err) {
    db!.exec('ROLLBACK');
    console.warn(
      `[stats] Не удалось импортировать ${LEGACY_JSON_PATH}: ${(err as Error).message}`
    );
    return;
  }

  if (imported > 0) {
    try {
      renameSync(LEGACY_JSON_PATH, `${LEGACY_JSON_PATH}.bak`);
    } catch {
      void 0;
    }
    console.log(`[stats] Импортировано из stats.json записей: ${imported}.`);
  }
}

export function loadStats(): void {
  try {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec(
      `CREATE TABLE IF NOT EXISTS user_stats (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        messages INTEGER NOT NULL DEFAULT 0,
        voice_ms INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      )`
    );
    upsertStmt = db.prepare(
      `INSERT INTO user_stats (guild_id, user_id, messages, voice_ms)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(guild_id, user_id)
       DO UPDATE SET messages = excluded.messages, voice_ms = excluded.voice_ms`
    );
  } catch (err) {
    console.warn(
      `[stats] Не удалось открыть базу ${DB_PATH}: ${(err as Error).message}. ` +
        'Статистика не будет сохраняться.'
    );
    db = null;
    upsertStmt = null;
    return;
  }

  importLegacyJson();

  let users = 0;
  const rows = db
    .prepare('SELECT guild_id, user_id, messages, voice_ms FROM user_stats')
    .all() as Array<{
    guild_id: string;
    user_id: string;
    messages: number;
    voice_ms: number;
  }>;
  for (const r of rows) {
    let guild = guilds.get(r.guild_id);
    if (!guild) {
      guild = new Map();
      guilds.set(r.guild_id, guild);
    }
    guild.set(r.user_id, {
      messages: Number(r.messages) || 0,
      voiceMs: Number(r.voice_ms) || 0,
    });
    users++;
  }

  console.log(
    `[stats] Загружена статистика: серверов ${guilds.size}, пользователей ${users}.`
  );
}

export function getStats(guildId: string, userId: string): UserStats {
  const user = guilds.get(guildId)?.get(userId);
  return { messages: user?.messages ?? 0, voiceMs: user?.voiceMs ?? 0 };
}

export function getGuildUserIds(guildId: string): string[] {
  const guild = guilds.get(guildId);
  return guild ? [...guild.keys()] : [];
}

export function addMessage(guildId: string, userId: string): number {
  const user = getUser(guildId, userId);
  user.messages++;
  dirty.add(dirtyKey(guildId, userId));
  return user.messages;
}

export function addVoiceMs(guildId: string, userId: string, ms: number): number {
  const user = getUser(guildId, userId);
  user.voiceMs += ms;
  dirty.add(dirtyKey(guildId, userId));
  return user.voiceMs;
}

export function flushStats(): void {
  if (!db || !upsertStmt || dirty.size === 0) return;

  const keys = [...dirty];
  try {
    db.exec('BEGIN');
    for (const key of keys) {
      const sep = key.indexOf(':');
      const guildId = key.slice(0, sep);
      const userId = key.slice(sep + 1);
      const stats = guilds.get(guildId)?.get(userId);
      if (!stats) continue;
      upsertStmt.run(guildId, userId, stats.messages, stats.voiceMs);
    }
    db.exec('COMMIT');
    dirty.clear();
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      void 0;
    }
    console.warn(
      `[stats] Не удалось сохранить статистику: ${(err as Error).message}`
    );
  }
}

export function startAutoFlush(): void {
  setInterval(flushStats, 30_000).unref();
}
