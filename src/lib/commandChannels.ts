import { readFileSync, statSync } from 'node:fs';
import { CONFIG_PATH } from '../config.js';

let cachedMtimeMs = -1;
let commandChannels: Record<string, string[]> = {};

function isChannelId(value: unknown): value is string {
  return typeof value === 'string' && /^\d{17,20}$/.test(value.trim());
}

function sanitize(map: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!map || typeof map !== 'object') return out;
  for (const [key, list] of Object.entries(map as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue;
    const valid: string[] = [];
    for (const id of list) {
      if (isChannelId(id)) {
        valid.push(id.trim());
      } else {
        console.warn(
          `[channels] Пропускаю некорректный ID канала в "${key}": ${JSON.stringify(id)}`
        );
      }
    }
    if (valid.length > 0) out[key] = valid;
  }
  return out;
}

function reload(): void {
  const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as {
    commandChannels?: unknown;
  };
  commandChannels = sanitize(raw.commandChannels);
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
      `[channels] Не удалось перечитать config.json: ${(err as Error).message}. ` +
        'Использую прошлые настройки каналов.'
    );
  }
  cachedMtimeMs = mtimeMs;
}

export function getCommandChannels(name: string): string[] {
  refreshIfChanged();
  return commandChannels[name] ?? [];
}

export function isCommandAllowedHere(
  name: string,
  channelId: string | null,
  parentId?: string | null
): boolean {
  const allowed = getCommandChannels(name);
  if (allowed.length === 0) return true;
  if (channelId && allowed.includes(channelId)) return true;
  if (parentId && allowed.includes(parentId)) return true;
  return false;
}
