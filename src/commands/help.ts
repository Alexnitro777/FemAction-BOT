import { EmbedBuilder } from 'discord.js';
import type { BotClient, UtilityCommand } from '../types.js';
import { config } from '../config.js';

/** Собирает эмбед со списком всех РП-команд из загруженных действий. */
function buildHelpEmbed(client: BotClient): EmbedBuilder {
  const lines = client.rpActions
    .map((a) => {
      const names = [a.textName, ...(a.aliases ?? [])]
        .map((n) => `\`${config.prefix}${n}\``)
        .join(', ');
      return `**${a.description}**\n${names} и \`/${a.name}\``;
    })
    .join('\n\n');

  return new EmbedBuilder()
    .setTitle('РП-команды')
    .setColor(0xff7fa5)
    .setDescription(lines || 'Команды не загружены.')
    .setFooter({ text: 'Укажи @пользователя как цель действия' });
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
