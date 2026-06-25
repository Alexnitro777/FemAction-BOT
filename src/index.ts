import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
  type ButtonInteraction,
} from 'discord.js';
import { config } from './config.js';
import type { UtilityCommand } from './types.js';
import { loadActions } from './lib/loadActions.js';
import { loadEmbeds } from './embeds/registry.js';
import { registerInteractionHandler } from './events/interactionCreate.js';
import {
  registerActivityHandlers,
  flushVoiceSessions,
} from './events/activity.js';
import helpCommand from './commands/help.js';
import statisticsCommand from './commands/statistics.js';
import backfillCommand from './commands/backfill.js';
import postCommand from './commands/post.js';
import { CooldownManager } from './lib/cooldowns.js';
import { loadStats, startAutoFlush, flushStats } from './lib/statsStore.js';

async function main() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Channel],
  });

  loadStats();
  startAutoFlush();

  const { actions } = await loadActions();
  client.rpActions = actions;

  client.embeds = await loadEmbeds();

  const buttonHandlers = new Collection<
    string,
    (interaction: ButtonInteraction) => Promise<void> | void
  >();
  for (const def of client.embeds.values()) {
    for (const [customId, handler] of Object.entries(def.buttons ?? {})) {
      if (buttonHandlers.has(customId)) {
        throw new Error(
          `Дублирующийся customId кнопки: "${customId}" (embed ${def.name})`
        );
      }
      buttonHandlers.set(customId, handler);
    }
  }
  client.buttonHandlers = buttonHandlers;

  client.cooldowns = new CooldownManager(20);

  setInterval(() => client.cooldowns.cleanup(), 5 * 60 * 1000).unref();

  client.utility = new Collection<string, UtilityCommand>();
  for (const util of [helpCommand, statisticsCommand, backfillCommand, postCommand]) {
    client.utility.set(util.name, util);
  }

  registerInteractionHandler(client);
  registerActivityHandlers(client);

  client.once(Events.ClientReady, (c) => {
    console.log(`Бот запущен как ${c.user.tag}`);
  });

  const shutdown = () => {
    flushVoiceSessions();
    flushStats();
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  await client.login(config.token);
}

main().catch((err) => {
  console.error('Фатальная ошибка запуска:', err);
  process.exit(1);
});
