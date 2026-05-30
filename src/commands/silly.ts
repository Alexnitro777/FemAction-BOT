import { EmbedBuilder } from 'discord.js';
import type { UtilityCommand } from '../types.js';
import { config } from '../config.js';

/**
 * Команда "silly" - оценка глупости/гениальности пользователя.
 * 0 = абсолютный гений, 100 = абсолютная глупость.
 * Работает только на себя, нельзя применить на других.
 */

function getSillyMessage(value: number): string {
  if (value === 0) {
    return '🧠 **Абсолютный гений!** Ваш интеллект не знает границ! ✨';
  } else if (value <= 10) {
    return '🎓 **Очень умный!** Вы явно знаете, что делаете!';
  } else if (value <= 25) {
    return '📚 **Умный человек!** Хорошая голова на плечах!';
  } else if (value <= 40) {
    return '🙂 **Выше среднего!** Неплохо соображаете!';
  } else if (value <= 60) {
    return '😐 **Средний уровень.** Обычный человек, ничего особенного.';
  } else if (value <= 75) {
    return '😅 **Ниже среднего...** Бывает и хуже!';
  } else if (value <= 90) {
    return '🤪 **Довольно глупо!** Может, стоит подумать получше?';
  } else if (value < 100) {
    return '🤡 **Очень глупо!** Это уже серьёзно!';
  } else {
    return '💀 **Абсолютная глупость!** Поздравляем, вы достигли дна! 🎉';
  }
}

function getSillyColor(value: number): number {
  if (value <= 25) {
    return 0x00ff00; // Зелёный (умный)
  } else if (value <= 50) {
    return 0xffff00; // Жёлтый (средний)
  } else if (value <= 75) {
    return 0xff9900; // Оранжевый (глуповатый)
  } else {
    return 0xff0000; // Красный (глупый)
  }
}

const command: UtilityCommand = {
  name: 'silly',
  textName: 'силли',
  aliases: ['silly', 'глупость'],
  description: 'Оценить свою глупость/гениальность (0-100)',

  executeText: async (message, args) => {
    if (!message.channel.isSendable()) return;

    // Проверяем, не пытается ли пользователь применить команду на кого-то другого
    if (message.mentions.users.size > 0) {
      await message.reply('❌ Эту команду можно применить только на себя! Попробуйте без упоминания других пользователей.');
      return;
    }

    const input = args[0];
    if (!input) {
      await message.reply(
        `❓ Укажите число от 0 до 100!\n` +
        `Пример: \`${config.prefix}силли 50\`\n` +
        `0 = абсолютный гений 🧠\n` +
        `100 = абсолютная глупость 💀`
      );
      return;
    }

    const value = parseInt(input, 10);
    if (isNaN(value) || value < 0 || value > 100) {
      await message.reply('❌ Число должно быть от 0 до 100!');
      return;
    }

    const sillyMessage = getSillyMessage(value);
    const color = getSillyColor(value);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`Силли-метр: ${value}/100`)
      .setDescription(`<@${message.author.id}> ${sillyMessage}`)
      .setFooter({ text: '0 = гений | 100 = глупость' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  executeSlash: async (interaction) => {
    const value = interaction.options.getInteger('значение', true);

    if (value < 0 || value > 100) {
      await interaction.reply({
        content: '❌ Число должно быть от 0 до 100!',
        ephemeral: true
      });
      return;
    }

    const sillyMessage = getSillyMessage(value);
    const color = getSillyColor(value);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`Силли-метр: ${value}/100`)
      .setDescription(`<@${interaction.user.id}> ${sillyMessage}`)
      .setFooter({ text: '0 = гений | 100 = глупость' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
