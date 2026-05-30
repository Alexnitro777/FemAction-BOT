import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Отсутствует переменная окружения ${name}. Заполни .env по образцу .env.example`
    );
  }
  return value;
}

export const config = {
  token: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  /** Пустая строка => глобальная регистрация слеш-команд. */
  guildId: process.env.GUILD_ID ?? '',
  prefix: process.env.PREFIX || '!',
} as const;
