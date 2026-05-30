import { EmbedBuilder } from 'discord.js';
import type { BotClient, UtilityCommand } from '../types.js';
import { config } from '../config.js';

/** Собирает эмбед со списком всех РП-команд из загруженных действий. */
function buildHelpEmbed(client: BotClient): EmbedBuilder {
  // Разделяем команды на РП-действия и другие
  const rpCommands: string[] = [];
  const otherCommands: string[] = [];

  client.rpActions.forEach((a) => {
    const names = [a.textName, ...(a.aliases ?? [])]
      .map((n) => `\`${config.prefix}${n}\``)
      .join(', ');
    const line = `**${a.description}**\n${names} и \`/${a.name}\``;

    // silly - это не РП-команда, выделяем её отдельно
    if (a.name === 'silly') {
      otherCommands.push(line);
    } else {
      rpCommands.push(line);
    }
  });

  const rpSection = rpCommands.length > 0
    ? `**🎭 РП-команды:**\n${rpCommands.join('\n\n')}`
    : '';

  const otherSection = otherCommands.length > 0
    ? `**🎲 Другие команды:**\n${otherCommands.join('\n\n')}`
    : '';

  const description = [rpSection, otherSection].filter(s => s).join('\n\n');

  return new EmbedBuilder()
    .setTitle('Список команд')
    .setColor(0xff7fa5)
    .setDescription(description || 'Команды не загружены.')
    .setFooter({ text: 'Для РП-команд укажи @пользователя как цель действия' });
}

const command: UtilityCommand = {
  name: 'help',
  textName: 'help',
  aliases: ['commands'],
  description: 'Список доступных РП-команд',
  executeText: async (message) => {
    if (!message.channel.isSendable()) return;
    await message.reply({ embeds: [buildHelpEmbed(message.client)] });
  },
  executeSlash: async (interaction) => {
    await interaction.reply({
      embeds: [buildHelpEmbed(interaction.client)],
      ephemeral: true
    });
  },
};

export default command;
