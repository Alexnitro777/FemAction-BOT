import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const CONFIG_PATH = resolve(process.cwd(), process.env.CONFIG_PATH || 'config.json');

interface RawConfig {
  discord?: {
    token?: string;
    clientId?: string;
    guildId?: string;
  };
  gifs?: Record<string, string[]>;
  silly?: Record<string, string[]>;
}

function loadRawConfig(): RawConfig {
  let text: string;
  try {
    text = readFileSync(CONFIG_PATH, 'utf8');
  } catch {
    throw new Error(
      `Не найден файл конфига ${CONFIG_PATH}. ` +
        'Скопируй config.example.json в config.json и заполни значения.'
    );
  }

  try {
    return JSON.parse(text) as RawConfig;
  } catch (err) {
    throw new Error(
      `Не удалось разобрать ${CONFIG_PATH}: невалидный JSON. ${(err as Error).message}`
    );
  }
}

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `В config.json не заполнено поле discord.${name}. ` +
        'Заполни его по образцу config.example.json.'
    );
  }
  return value;
}

const raw = loadRawConfig();
const discord = raw.discord ?? {};

export const config = {
  token: required(discord.token, 'token'),
  clientId: required(discord.clientId, 'clientId'),
  guildId: discord.guildId ?? '',
} as const;
