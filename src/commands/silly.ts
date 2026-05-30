import { EmbedBuilder } from 'discord.js';
import type { UtilityCommand } from '../types.js';

const command: UtilityCommand = {
  name: 'silly',
  textName: 'силли',
  aliases: ['silly', 'глупый'],
  description: 'Проверить уровень силли',
  executeText: async (message) => {
    const percentage = Math.floor(Math.random() * 101);
    let result: string;

    if (percentage === 0) {
      result = 'абсолютный гений (0 число)';
    } else if (percentage === 100) {
      result = 'абсолютная глупость (100 число)';
    } else {
      result = `силли на ${percentage}`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xff7fa5)
      .setDescription(`<@${message.author.id}>, ты — **${result}**!`);

    await message.reply({ embeds: [embed] });
  },
  executeSlash: async (interaction) => {
    const percentage = Math.floor(Math.random() * 101);
    let result: string;

    if (percentage === 0) {
      result = 'абсолютный гений (0 число)';
    } else if (percentage === 100) {
      result = 'абсолютная глупость (100 число)';
    } else {
      result = `силли на ${percentage}`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xff7fa5)
      .setDescription(`<@${interaction.user.id}>, ты — **${result}**!`);

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
