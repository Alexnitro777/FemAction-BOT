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
import { CooldownManager } from './lib/cooldowns.js';

async function main() {
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

  client.cooldowns = new CooldownManager(20);

  setInterval(() => client.cooldowns.cleanup(), 5 * 60 * 1000).unref();

  client.utility = new Collection<string, UtilityCommand>();
  client.utility.set(helpCommand.name, helpCommand);
  for (const alias of helpCommand.aliases ?? []) {
    client.utility.set(alias, helpCommand);
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
