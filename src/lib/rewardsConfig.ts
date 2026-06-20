import { readFileSync, statSync } from 'node:fs';
import { CONFIG_PATH } from '../config.js';

export interface MessageRole {
  count: number;
  roleId: string;
}

export interface VoiceRole {
  hours: number;
  roleId: string;
}

export interface VoiceRules {
  ignoreAfkChannel: boolean;
  ignoreDeafened: boolean;
}

let cachedMtimeMs = -1;
let messageRoles: MessageRole[] = [];
let voiceRoles: VoiceRole[] = [];
let voiceRules: VoiceRules = { ignoreAfkChannel: true, ignoreDeafened: true };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function sanitizeMessageRoles(list: unknown): MessageRole[] {
  if (!Array.isArray(list)) return [];
  const out: MessageRole[] = [];
  for (const entry of list) {
    const count = Number(entry?.count);
    const roleId = entry?.roleId;
    if (Number.isFinite(count) && count > 0 && isNonEmptyString(roleId)) {
      out.push({ count, roleId: roleId.trim() });
    }
  }
  return out.sort((a, b) => a.count - b.count);
}

function sanitizeVoiceRoles(list: unknown): VoiceRole[] {
  if (!Array.isArray(list)) return [];
  const out: VoiceRole[] = [];
  for (const entry of list) {
    const hours = Number(entry?.hours);
    const roleId = entry?.roleId;
    if (Number.isFinite(hours) && hours > 0 && isNonEmptyString(roleId)) {
      out.push({ hours, roleId: roleId.trim() });
    }
  }
  return out.sort((a, b) => a.hours - b.hours);
}

function sanitizeVoiceRules(rules: unknown): VoiceRules {
  const r = (rules ?? {}) as Record<string, unknown>;
  return {
    ignoreAfkChannel: r.ignoreAfkChannel !== false,
    ignoreDeafened: r.ignoreDeafened !== false,
  };
}

function reload(): void {
  const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as {
    rewards?: {
      messageRoles?: unknown;
      voiceRoles?: unknown;
      voice?: unknown;
    };
  };
  const rewards = raw.rewards ?? {};
  messageRoles = sanitizeMessageRoles(rewards.messageRoles);
  voiceRoles = sanitizeVoiceRoles(rewards.voiceRoles);
  voiceRules = sanitizeVoiceRules(rewards.voice);
}

function refreshIfChanged(): void {
  let mtimeMs: number;
  try {
    mtimeMs = statSync(CONFIG_PATH).mtimeMs;
  } catch {
    return;
  }
  if (mtimeMs === cachedMtimeMs) return;

  try {
    reload();
  } catch (err) {
    console.warn(
      `[rewards] Не удалось перечитать config.json: ${(err as Error).message}. ` +
        'Использую прошлые значения наград.'
    );
  }
  cachedMtimeMs = mtimeMs;
}

export function getMessageRoles(): MessageRole[] {
  refreshIfChanged();
  return messageRoles;
}

export function getVoiceRoles(): VoiceRole[] {
  refreshIfChanged();
  return voiceRoles;
}

export function getVoiceRules(): VoiceRules {
  refreshIfChanged();
  return voiceRules;
}
