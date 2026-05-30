import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
} from 'discord.js';
import { config } from './config.js';
import type { UtilityCommand } from './types.js';
import { loadActions } from './lib/loadActions.js';
import { registerMessageHandler } from './events/messageCreate.js';
import { registerInteractionHandler } from './events/interactionCreate.js';
import helpCommand from './commands/help.js';
import sillyCommand from './commands/silly.js';
import { CooldownManager } from './lib/cooldowns.js';

async function main() {
  // MessageContent нужен для чтения текстовых команд — включи его
  // в Developer Portal -> Bot -> Privileged Gateway Intents.
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  const { actions, textIndex } = await loadActions();
  client.rpActions = actions;
  client.textIndex = textIndex;

  // Инициализируем систему кулдаунов (20 секунд).
  client.cooldowns = new CooldownManager(20);

  // Регистрируем утилитарные команды.
  client.utility = new Collection<string, UtilityCommand>();
  client.utility.set(helpCommand.name, helpCommand);
  for (const alias of helpCommand.aliases ?? []) {
    client.utility.set(alias, helpCommand);
  }

  client.utility.set(sillyCommand.name, sillyCommand);
  for (const alias of sillyCommand.aliases ?? []) {
    client.utility.set(alias, sillyCommand);
  }

  registerMessageHandler(client);
  registerInteractionHandler(client);

  client.once(Events.ClientReady, (c) => {
    console.log(`Бот запущен как ${c.user.tag}`);
  });

  await client.login(config.token);
}

main().catch((err) => {
  console.error('Фатальная ошибка запуска:', err);
  process.exit(1);
});
