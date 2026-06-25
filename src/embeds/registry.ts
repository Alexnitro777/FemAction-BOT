import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { Collection } from 'discord.js';
import type { EmbedDefinition } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKIP = new Set(['types', 'registry']);

function isEmbedDefinition(value: unknown): value is EmbedDefinition {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as EmbedDefinition).name === 'string' &&
    typeof (value as EmbedDefinition).build === 'function'
  );
}

export async function loadEmbeds(): Promise<Collection<string, EmbedDefinition>> {
  const embeds = new Collection<string, EmbedDefinition>();

  const files = (await readdir(__dirname)).filter((f) => {
    const base = f.replace(/\.(ts|js)$/, '');
    return (f.endsWith('.ts') || f.endsWith('.js')) && !f.endsWith('.d.ts') && !SKIP.has(base);
  });

  for (const file of files) {
    const mod = await import(pathToFileURL(join(__dirname, file)).href);
    const candidates = new Set<unknown>([mod.default, ...Object.values(mod)]);
    for (const candidate of candidates) {
      if (!isEmbedDefinition(candidate)) continue;
      if (embeds.has(candidate.name)) {
        throw new Error(`[embeds] Дубликат имени "${candidate.name}" в ${file}.`);
      }
      embeds.set(candidate.name, candidate);
    }
  }

  console.log(`[embeds] Загружено embed-ов: ${embeds.size}`);
  return embeds;
}
