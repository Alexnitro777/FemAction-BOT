import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { Collection } from 'discord.js';
import type { ActionDefinition } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACTIONS_DIR = join(__dirname, '..', 'actions');

export async function loadActions(): Promise<{
  actions: Collection<string, ActionDefinition>;
}> {
  const actions = new Collection<string, ActionDefinition>();

  const files = (await readdir(ACTIONS_DIR)).filter(
    (f) => (f.endsWith('.ts') || f.endsWith('.js')) && !f.endsWith('.d.ts')
  );

  for (const file of files) {
    const url = pathToFileURL(join(ACTIONS_DIR, file)).href;
    const mod = await import(url);
    const action: ActionDefinition | undefined = mod.default;

    if (!action?.name) {
      console.warn(`[actions] Пропускаю ${file}: нет валидного экспорта.`);
      continue;
    }

    if (actions.has(action.name)) {
      console.warn(`[actions] Дубликат имени "${action.name}" в ${file}.`);
      continue;
    }

    actions.set(action.name, action);
  }

  console.log(`[actions] Загружено действий: ${actions.size}`);
  return { actions };
}
