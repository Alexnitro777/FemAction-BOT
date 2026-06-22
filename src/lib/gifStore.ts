import { readFileSync, statSync } from 'node:fs';
import { CONFIG_PATH } from '../config.js';

let cachedMtimeMs = -1;
let gifs: Record<string, string[]> = {};
let silly: Record<string, string[]> = {};

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitize(map: Record<string, string[]> | undefined): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, list] of Object.entries(map ?? {})) {
    const valid: string[] = [];
    for (const url of list ?? []) {
      if (isHttpUrl(url)) {
        valid.push(url);
      } else {
        console.warn(`[gifs] Пропускаю некорректный URL в "${key}": ${JSON.stringify(url)}`);
      }
    }
    out[key] = valid;
  }
  return out;
}

function reload(): void {
  const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as {
    gifs?: Record<string, string[]>;
    silly?: Record<string, string[]>;
  };
  gifs = sanitize(raw.gifs);
  silly = sanitize(raw.silly);
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
    cachedMtimeMs = mtimeMs;
  } catch (err) {
    console.warn(
      `[gifs] Не удалось перечитать config.json: ${(err as Error).message}. ` +
        'Использую прошлые значения гифок.'
    );
  }
}

export function getGifs(name: string): string[] {
  refreshIfChanged();
  return gifs[name] ?? [];
}

export function getSillyPool(pool: string): string[] {
  refreshIfChanged();
  return silly[pool] ?? [];
}

const lastIndex: Record<string, number> = {};

function pickFrom(key: string, list: string[]): string | undefined {
  const n = list.length;
  if (n === 0) return undefined;
  if (n === 1) return list[0];

  const prev = lastIndex[key];
  let i: number;
  if (prev === undefined || prev >= n) {
    i = Math.floor(Math.random() * n);
  } else {
    i = Math.floor(Math.random() * (n - 1));
    if (i >= prev) i++;
  }
  lastIndex[key] = i;
  return list[i];
}

export function pickGif(name: string): string | undefined {
  return pickFrom(`gifs:${name}`, getGifs(name));
}

export function pickSillyGif(pool: string): string | undefined {
  return pickFrom(`silly:${pool}`, getSillyPool(pool));
}
