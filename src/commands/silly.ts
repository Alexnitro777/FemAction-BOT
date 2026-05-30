import { EmbedBuilder } from 'discord.js';
import type { UtilityCommand } from '../types.js';
import { config } from '../config.js';

/**
 * Команда "silly" - случайная оценка глупости/гениальности пользователя.
 * 0 = абсолютный гений, 1-99 = глупенький на "число", 100 = абсолютная глупость.
 * Работает только на себя, нельзя применить на других.
 */

function getSillyMessage(value: number): string {
  if (value === 0) {
    return '🧠 **Абсолютный гений!** Ваш интеллект не знает границ! ✨';
  } else if (value === 100) {
    return '💀 **Абсолютная глупенькость!** Поздравляем, вы достигли дна! 🎉';
  } else if (value <= 10) {
    return `🎓 **Глупенький на ${value}!** Почти гений, но не совсем!`;
  } else if (value <= 25) {
    return `📚 **Глупенький на ${value}!** Немного глуповат, но в целом умный!`;
  } else if (value <= 40) {
    return `🙂 **Глупенький на ${value}!** Выше среднего по глупости!`;
  } else if (value <= 60) {
    return `😐 **Глупенький на ${value}!** Средний уровень глупости.`;
  } else if (value <= 75) {
    return `😅 **Глупенький на ${value}!** Довольно глуповат!`;
  } else if (value <= 90) {
    return `🤪 **Глупенький на ${value}!** Очень глупенький!`;
  } else {
    return `🤡 **Глупенький на ${value}!** Критический уровень глупости!`;
  }
}

function getSillyGif(value: number): string {
  // Гифки для разных уровней глупости
  if (value === 0) {
    // Гений
    const geniusGifs = [
      'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif',
      'https://media.giphy.com/media/3owzW5c1tPq63MPmWk/giphy.gif',
      'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif',
    ];
    return geniusGifs[Math.floor(Math.random() * geniusGifs.length)];
  } else if (value === 100) {
    // Абсолютная глупость
    const dumbGifs = [
      'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif',
      'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
      'https://media.giphy.com/media/APqEbxBsVlkWSuFpth/giphy.gif',
    ];
    return dumbGifs[Math.floor(Math.random() * dumbGifs.length)];
  } else if (value <= 25) {
    // Умный
    const smartGifs = [
      'https://media.giphy.com/media/a5viI92PAF89q/giphy.gif',
      'https://media.giphy.com/media/3owzW2qI07rokGALfy/giphy.gif',
      'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif',
    ];
    return smartGifs[Math.floor(Math.random() * smartGifs.length)];
  } else if (value <= 50) {
    // Средний
    const averageGifs = [
      'https://media.giphy.com/media/3o7btNhMBytxAM6YBa/giphy.gif',
      'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif',
      'https://media.giphy.com/media/xT0xeMA62E1XIlup68/giphy.gif',
    ];
    return averageGifs[Math.floor(Math.random() * averageGifs.length)];
  } else if (value <= 75) {
    // Глуповатый
    const sillyGifs = [
      'https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif',
      'https://media.giphy.com/media/3o7btW7zRi0r8V8OGI/giphy.gif',
      'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    ];
    return sillyGifs[Math.floor(Math.random() * sillyGifs.length)];
  } else {
    // Очень глупый
    const veryDumbGifs = [
      'https://media.giphy.com/media/l0HlQ7LRalQqdWfao/giphy.gif',
      'https://media.giphy.com/media/3o7btYLAW7doynq3p6/giphy.gif',
      'https://media.giphy.com/media/l0MYC0LajbaPoEADu/giphy.gif',
    ];
    return veryDumbGifs[Math.floor(Math.random() * veryDumbGifs.length)];
  }
}

function getSillyColor(value: number): number {
  if (value === 0) {
    return 0x00ffff; // Голубой (гений)
  } else if (value === 100) {
    return 0x8b0000; // Тёмно-красный (абсолютная глупость)
  } else if (value <= 25) {
    return 0x00ff00; // Зелёный (умный)
  } else if (value <= 50) {
    return 0xffff00; // Жёлтый (средний)
  } else if (value <= 75) {
    return 0xff9900; // Оранжевый (глуповатый)
  } else {
    return 0xff0000; // Красный (глупый)
  }
}

function getRandomSillyValue(): number {
  return Math.floor(Math.random() * 101); // 0-100 включительно
}

const command: UtilityCommand = {
  name: 'silly',
  textName: 'силли',
  aliases: ['silly', 'глупость'],
  description: 'Случайная оценка глупости/гениальности (0-100)',

  executeText: async (message, args) => {
    if (!message.channel.isSendable()) return;

    // Проверяем, не пытается ли пользователь применить команду на кого-то другого
    if (message.mentions.users.size > 0) {
      await message.reply('❌ Эту команду можно применить только на себя! Попробуйте без упоминания других пользователей.');
      return;
    }

    // Генерируем случайное значение от 0 до 100
    const value = getRandomSillyValue();
    const sillyMessage = getSillyMessage(value);
    const color = getSillyColor(value);
    const gif = getSillyGif(value);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`Силли-метр: ${value}/100`)
      .setDescription(`<@${message.author.id}> ${sillyMessage}`)
      .setImage(gif)
      .setFooter({ text: '0 = гений | 100 = абсолютная глупенькость' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  executeSlash: async (interaction) => {
    // Генерируем случайное значение от 0 до 100
    const value = getRandomSillyValue();
    const sillyMessage = getSillyMessage(value);
    const color = getSillyColor(value);
    const gif = getSillyGif(value);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`Силли-метр: ${value}/100`)
      .setDescription(`<@${interaction.user.id}> ${sillyMessage}`)
      .setImage(gif)
      .setFooter({ text: '0 = гений | 100 = абсолютная глупенькость' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
