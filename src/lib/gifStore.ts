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

function reload(): void {
  const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as {
    gifs?: Record<string, string[]>;
    silly?: Record<string, string[]>;
  };
  gifs = raw.gifs ?? {};
  silly = raw.silly ?? {};
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
