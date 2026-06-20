import { EmbedBuilder, MessageFlags } from 'discord.js';
import type { BotClient, UtilityCommand } from '../types.js';
import { config } from '../config.js';

function buildHelpEmbed(client: BotClient): EmbedBuilder {
  const rpCommands: string[] = [];
  const otherCommands: string[] = [];

  client.rpActions.forEach((a) => {
    const names = [a.textName, ...(a.aliases ?? [])]
      .map((n) => `\`${config.prefix}${n}\``)
      .join(', ');
    const line = `**${a.description}**\n${names} и \`/${a.name}\``;

    if (a.noTarget) {
      otherCommands.push(line);
    } else {
      rpCommands.push(line);
    }
  });

  const utilCommands: string[] = [];
  const seen = new Set<string>();
  client.utility.forEach((u) => {
    if (seen.has(u.name)) return;
    seen.add(u.name);

    const triggers = [u.textName, ...(u.aliases ?? [])]
      .map((n) => `\`${config.prefix}${n}\``)
      .join(', ');
    const slash = u.executeSlash ? ` и \`/${u.name}\`` : '';
    utilCommands.push(`**${u.description}**\n${triggers}${slash}`);
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
  textName: 'хелп',
  aliases: ['help'],
  description: 'Список доступных РП-команд.',
  executeText: async (message) => {
    if (!message.channel.isSendable()) return;
    await message.reply({ embeds: [buildHelpEmbed(message.client)] });
  },
  executeSlash: async (interaction) => {
    await interaction.reply({
      embeds: [buildHelpEmbed(interaction.client)],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default command;
