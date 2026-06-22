import { EmbedBuilder, MessageFlags } from 'discord.js';
import type { BotClient, UtilityCommand } from '../types.js';

const HIDDEN_UTILITY = new Set(['скан']);

function formatLine(name: string, description: string): string {
  return `> \`/${name}\` — ${description}`;
}

function buildHelpEmbed(client: BotClient): EmbedBuilder {
  const rpCommands: string[] = [];
  const otherCommands: string[] = [];

  client.rpActions.forEach((a) => {
    const line = formatLine(a.name, a.description);

    if (a.noTarget) {
      otherCommands.push(line);
    } else {
      rpCommands.push(line);
    }
  });

  const utilCommands: string[] = [];
  client.utility.forEach((u) => {
    if (!u.executeSlash || HIDDEN_UTILITY.has(u.name)) return;
    utilCommands.push(formatLine(u.name, u.description));
  });

  const embed = new EmbedBuilder()
    .setTitle('✨ Список команд')
    .setColor(0xff7fa5)
    .setFooter({ text: '💡 Для РП-команд укажи @пользователя как цель действия.' });

  const fields: { name: string; value: string }[] = [];

  if (rpCommands.length > 0) {
    fields.push({ name: '🎭 РП-команды', value: rpCommands.join('\n') });
  }
  if (otherCommands.length > 0) {
    fields.push({ name: '🎲 Другие команды', value: otherCommands.join('\n') });
  }
  if (utilCommands.length > 0) {
    fields.push({ name: '🛠️ Утилиты', value: utilCommands.join('\n') });
  }

  if (fields.length > 0) {
    embed.setDescription('Выбери команду и подари тёплый момент 💗');
    embed.addFields(fields);
  } else {
    embed.setDescription('Команды не загружены.');
  }

  return embed;
}

const command: UtilityCommand = {
  name: 'хелп',
  description: 'Список доступных РП-команд.',
  executeSlash: async (interaction) => {
    await interaction.reply({
      embeds: [buildHelpEmbed(interaction.client)],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default command;
