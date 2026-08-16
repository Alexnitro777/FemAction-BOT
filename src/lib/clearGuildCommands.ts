import { REST, Routes } from 'discord.js';
import { config } from '../config.js';

async function clear() {
  if (!config.guildId) {
    console.log('guildId не задан в config.json — нечего сбрасывать.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: [] }
    );
    console.log(`✅ Серверные команды на сервере ${config.guildId} очищены.`);
  } catch (err) {
    console.error('Ошибка очистки:', err);
    process.exitCode = 1;
  }
}

clear().catch((err) => {
  console.error(err);
  process.exit(1);
});
