import { readFileSync, statSync } from 'node:fs';
import { CONFIG_PATH } from '../config.js';

/**
 * «Живое» хранилище гифок. Перечитывает config.json, когда файл изменился,
 * поэтому ссылки на гифки можно править без перезапуска бота.
 *
 * Проверка дешёвая: на каждый вызов делается stat() и сравнивается время
 * изменения файла; повторный разбор JSON происходит, только если файл реально
 * менялся. Секреты и prefix здесь НЕ трогаются — они применяются один раз при
 * старте (см. config.ts).
 */

let cachedMtimeMs = -1;
let gifs: Record<string, string[]> = {};
let silly: Record<string, string[]> = {};

/** http(s)-ссылка, которую Discord примет в setImage. */
function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Оставляет в каждом списке только корректные URL. Битые ссылки отсекаются и
 * логируются: иначе одна некорректная ссылка ломала бы setImage() и команда
 * молча не отправлялась бы (создавая иллюзию «всегда первая гифка»).
 */
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

/** Перечитывает config.json, если он изменился с прошлого обращения. */
function refreshIfChanged(): void {
  let mtimeMs: number;
  try {
    mtimeMs = statSync(CONFIG_PATH).mtimeMs;
  } catch {
    return; // файл временно недоступен — используем прошлый снимок
  }
  if (mtimeMs === cachedMtimeMs) return;

  try {
    reload();
  } catch (err) {
    console.warn(
      `[gifs] Не удалось перечитать config.json: ${(err as Error).message}. ` +
        'Использую прошлые значения гифок.'
    );
  }
  // Запоминаем mtime в любом случае: не пытаемся повторно разобрать тот же
  // битый файл на каждый вызов — следующая попытка будет после сохранения.
  cachedMtimeMs = mtimeMs;
}

/** Гифки обычного действия по имени команды. Пустой массив, если не заданы. */
export function getGifs(name: string): string[] {
  refreshIfChanged();
  return gifs[name] ?? [];
}

/** Пул гифок силлимера по имени тира (genius, smart, veryDumb и т.п.). */
export function getSillyPool(pool: string): string[] {
  refreshIfChanged();
  return silly[pool] ?? [];
}

/** Последний показанный индекс по ключу — чтобы не повторять гифку подряд. */
const lastIndex: Record<string, number> = {};

/**
 * Случайная гифка из списка, но НЕ та же, что в прошлый раз для этого ключа.
 * При 1 элементе возвращает его; при 2+ гарантированно отличается от предыдущей
 * и распределена равномерно по остальным вариантам.
 */
function pickFrom(key: string, list: string[]): string | undefined {
  const n = list.length;
  if (n === 0) return undefined;
  if (n === 1) return list[0];

  const prev = lastIndex[key];
  let i: number;
  if (prev === undefined || prev >= n) {
    i = Math.floor(Math.random() * n);
  } else {
    // Выбираем равномерно среди n-1 вариантов и «перешагиваем» прошлый индекс.
    i = Math.floor(Math.random() * (n - 1));
    if (i >= prev) i++;
  }
  lastIndex[key] = i;
  return list[i];
}

/** Случайная гифка действия (без повтора подряд). */
export function pickGif(name: string): string | undefined {
  return pickFrom(`gifs:${name}`, getGifs(name));
}

/** Случайная гифка силлимера из пула тира (без повтора подряд). */
export function pickSillyGif(pool: string): string | undefined {
  return pickFrom(`silly:${pool}`, getSillyPool(pool));
}
