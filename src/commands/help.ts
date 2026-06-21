import { EmbedBuilder, MessageFlags } from 'discord.js';
import type { BotClient, UtilityCommand } from '../types.js';

function buildHelpEmbed(client: BotClient): EmbedBuilder {
  const rpCommands: string[] = [];
  const otherCommands: string[] = [];

  client.rpActions.forEach((a) => {
    const line = `**${a.description}**\n\`/${a.name}\``;

    if (a.noTarget) {
      otherCommands.push(line);
    } else {
      rpCommands.push(line);
    }
  });

  const utilCommands: string[] = [];
  client.utility.forEach((u) => {
    if (!u.executeSlash) return;
    utilCommands.push(`**${u.description}**\n\`/${u.name}\``);
  });

  const rpSection = rpCommands.length > 0
    ? `**🎭 РП-команды:**\n${rpCommands.join('\n\n')}`
    : '';

  const otherSection = otherCommands.length > 0
    ? `**🎲 Другие команды:**\n${otherCommands.join('\n\n')}`
    : '';

  const utilSection = utilCommands.length > 0
    ? `**🛠️ Утилиты:**\n${utilCommands.join('\n\n')}`
    : '';

  const description = [rpSection, otherSection, utilSection].filter(s => s).join('\n\n');

  return new EmbedBuilder()
    .setTitle('Список команд')
    .setColor(0xff7fa5)
    .setDescription(description || 'Команды не загружены.')
    .setFooter({ text: 'Для РП-команд укажи @пользователя как цель действия.' });
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
