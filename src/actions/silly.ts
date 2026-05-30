import type { ActionDefinition } from '../types.js';

/**
 * Действие "silly" - случайная оценка глупости/гениальности пользователя.
 * 0 = абсолютный гений, 1-99 = глупенький на "число", 100 = абсолютная глупость.
 * Работает только на себя.
 */

const action: ActionDefinition = {
  name: 'silly',
  textName: 'силли',
  aliases: ['silly'],
  description: 'Силлимер (0-100)',
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
      message = '🧠 **Абсолютный гений!** Ваш интеллект не знает границ!';
    } else if (value === 100) {
      message = '💀 **Абсолютная глупенькость!** Поздравляем, вы достигли дна!';
    } else if (value <= 10) {
      message = `🎓 **Глупенький на ${value}!** Почти гений, но не совсем!`;
    } else if (value <= 25) {
      message = `📚 **Глупенький на ${value}!** Немного глуповат, но в целом умненький!`;
    } else if (value <= 40) {
      message = `🙂 **Глупенький на ${value}!** Выше среднего по глупости!`;
    } else if (value <= 60) {
      message = `😐 **Глупенький на ${value}!** Средний уровень глупости.`;
    } else if (value <= 75) {
      message = `😅 **Глупенький на ${value}!** Довольно глуповат!`;
    } else if (value <= 90) {
      message = `🤪 **Глупенький на ${value}!** Очень глупенький!`;
    } else {
      message = `🤡 **Глупенький на ${value}!** Критический уровень глупости!!!`;
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
        'https://media.tenor.com/example-silly-1.gif',
        'https://media.tenor.com/example-silly-2.gif',
        'https://media.tenor.com/example-silly-3.gif',
      ];
      gif = geniusGifs[Math.floor(Math.random() * geniusGifs.length)];
    } else if (value === 100) {
      const dumbGifs = [
        'https://media.tenor.com/example-silly-4.gif',
        'https://media.tenor.com/example-silly-5.gif',
        'https://media.tenor.com/example-silly-6.gif',
      ];
      gif = dumbGifs[Math.floor(Math.random() * dumbGifs.length)];
    } else if (value <= 25) {
      const smartGifs = [
        'https://media.tenor.com/example-silly-7.gif',
        'https://media.tenor.com/example-silly-8.gif',
        'https://media.tenor.com/example-silly-9.gif',
      ];
      gif = smartGifs[Math.floor(Math.random() * smartGifs.length)];
    } else if (value <= 50) {
      const averageGifs = [
        'https://media.tenor.com/example-silly-10.gif',
        'https://media.tenor.com/example-silly-11.gif',
        'https://media.tenor.com/example-silly-12.gif',
      ];
      gif = averageGifs[Math.floor(Math.random() * averageGifs.length)];
    } else if (value <= 75) {
      const sillyGifs = [
        'https://media.tenor.com/example-silly-12.gif',
        'https://media.tenor.com/example-silly-13.gif',
        'https://media.tenor.com/example-silly-14.gif',
      ];
      gif = sillyGifs[Math.floor(Math.random() * sillyGifs.length)];
    } else {
      const veryDumbGifs = [
        'https://media.tenor.com/example-silly-15.gif',
        'https://media.tenor.com/example-silly-16.gif',
        'https://media.tenor.com/example-silly-17.gif',
      ];
      gif = veryDumbGifs[Math.floor(Math.random() * veryDumbGifs.length)];
    }

    return {
      title: `Силлимер`,
      description: `${authorMention} ${message}`,
      color,
      image: gif,
    };
  },
};

export default action;
