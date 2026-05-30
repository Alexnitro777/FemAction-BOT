import type { ActionDefinition } from '../types.js';

/**
 * Действие "silly" - случайная оценка глупости/гениальности пользователя.
 * 0 = абсолютный гений, 1-99 = глупенький на "число", 100 = абсолютная глупость.
 * Работает только на себя.
 */

const action: ActionDefinition = {
  name: 'silly',
  textName: 'силли',
  aliases: ['silly', 'глупость'],
  description: 'Случайная оценка глупости/гениальности (0-100)',
  template: '', // Не используется, так как логика кастомная
  selfTemplate: '', // Не используется
  requireTarget: false,
  color: 0xffff00, // Будет переопределяться динамически
  gifs: [], // Будет выбираться динамически

  // Кастомная логика для генерации embed
  customEmbed: (authorMention, targetMention) => {
    const value = Math.floor(Math.random() * 101); // 0-100

    // Определяем сообщение
    let message: string;
    if (value === 0) {
      message = '🧠 **Абсолютный гений!** Ваш интеллект не знает границ! ✨';
    } else if (value === 100) {
      message = '💀 **Абсолютная глупенькость!** Поздравляем, вы достигли дна! 🎉';
    } else if (value <= 10) {
      message = `🎓 **Глупенький на ${value}!** Почти гений, но не совсем!`;
    } else if (value <= 25) {
      message = `📚 **Глупенький на ${value}!** Немного глуповат, но в целом умный!`;
    } else if (value <= 40) {
      message = `🙂 **Глупенький на ${value}!** Выше среднего по глупости!`;
    } else if (value <= 60) {
      message = `😐 **Глупенький на ${value}!** Средний уровень глупости.`;
    } else if (value <= 75) {
      message = `😅 **Глупенький на ${value}!** Довольно глуповат!`;
    } else if (value <= 90) {
      message = `🤪 **Глупенький на ${value}!** Очень глупенький!`;
    } else {
      message = `🤡 **Глупенький на ${value}!** Критический уровень глупости!`;
    }

    // Определяем цвет
    let color: number;
    if (value === 0) {
      color = 0x00ffff; // Голубой (гений)
    } else if (value === 100) {
      color = 0x8b0000; // Тёмно-красный (абсолютная глупость)
    } else if (value <= 25) {
      color = 0x00ff00; // Зелёный (умный)
    } else if (value <= 50) {
      color = 0xffff00; // Жёлтый (средний)
    } else if (value <= 75) {
      color = 0xff9900; // Оранжевый (глуповатый)
    } else {
      color = 0xff0000; // Красный (глупый)
    }

    // Определяем гифку
    let gif: string;
    if (value === 0) {
      const geniusGifs = [
        'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif',
        'https://media.giphy.com/media/3owzW5c1tPq63MPmWk/giphy.gif',
        'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif',
      ];
      gif = geniusGifs[Math.floor(Math.random() * geniusGifs.length)];
    } else if (value === 100) {
      const dumbGifs = [
        'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif',
        'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
        'https://media.giphy.com/media/APqEbxBsVlkWSuFpth/giphy.gif',
      ];
      gif = dumbGifs[Math.floor(Math.random() * dumbGifs.length)];
    } else if (value <= 25) {
      const smartGifs = [
        'https://media.giphy.com/media/a5viI92PAF89q/giphy.gif',
        'https://media.giphy.com/media/3owzW2qI07rokGALfy/giphy.gif',
        'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif',
      ];
      gif = smartGifs[Math.floor(Math.random() * smartGifs.length)];
    } else if (value <= 50) {
      const averageGifs = [
        'https://media.giphy.com/media/3o7btNhMBytxAM6YBa/giphy.gif',
        'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif',
        'https://media.giphy.com/media/xT0xeMA62E1XIlup68/giphy.gif',
      ];
      gif = averageGifs[Math.floor(Math.random() * averageGifs.length)];
    } else if (value <= 75) {
      const sillyGifs = [
        'https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif',
        'https://media.giphy.com/media/3o7btW7zRi0r8V8OGI/giphy.gif',
        'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
      ];
      gif = sillyGifs[Math.floor(Math.random() * sillyGifs.length)];
    } else {
      const veryDumbGifs = [
        'https://media.giphy.com/media/l0HlQ7LRalQqdWfao/giphy.gif',
        'https://media.giphy.com/media/3o7btYLAW7doynq3p6/giphy.gif',
        'https://media.giphy.com/media/l0MYC0LajbaPoEADu/giphy.gif',
      ];
      gif = veryDumbGifs[Math.floor(Math.random() * veryDumbGifs.length)];
    }

    return {
      title: `Силли-метр: ${value}/100`,
      description: `${authorMention} ${message}`,
      color,
      image: gif,
      footer: '0 = гений | 100 = абсолютная глупенькость',
    };
  },
};

export default action;
