import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { Collection } from 'discord.js';
import type { ActionDefinition } from '../types.js';
import { config } from '../config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACTIONS_DIR = join(__dirname, '..', 'actions');

/**
 * Загружает все определения действий из src/actions.
 * Каждый .ts/.js файл должен экспортировать ActionDefinition по умолчанию.
 * Возвращает коллекцию действий и индекс текстовых имён/алиасов.
 */
export async function loadActions(): Promise<{
  actions: Collection<string, ActionDefinition>;
  textIndex: Collection<string, string>;
}> {
  const actions = new Collection<string, ActionDefinition>();
  const textIndex = new Collection<string, string>();

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

    // Гифки берём из config.json по имени команды. Действия с кастомной
    // логикой (напр. silly) выбирают гифки сами и это поле игнорируют.
    action.gifs = config.gifs[action.name] ?? [];

    actions.set(action.name, action);

    // Индексируем все варианты вызова текстовой команды.
    const names = [action.textName, ...(action.aliases ?? [])];
    for (const n of names) {
      const key = n.toLowerCase();
      if (textIndex.has(key)) {
        console.warn(
          `[actions] Конфликт текстового имени "${key}" (${file}).`
        );
        continue;
      }
      textIndex.set(key, action.name);
    }
  }

  console.log(`[actions] Загружено действий: ${actions.size}`);
  return { actions, textIndex };
}
