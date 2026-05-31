import type { ActionDefinition } from '../types.js';

/**
 * Действие "silly" - случайная оценка глупости/гениальности пользователя.
 * 0 = абсолютный гений, 1-99 = глупенький на "число", 100 = абсолютная глупость.
 * Работает только на себя.
 */

/** Наборы гифок по тирам (плейсхолдеры — заменить на реальные URL). */
const GENIUS_GIFS = [
  'https://media.tenor.com/example-silly-1.gif',
  'https://media.tenor.com/example-silly-2.gif',
  'https://media.tenor.com/example-silly-3.gif',
];
const ABSOLUTE_GIFS = [
  'https://media.tenor.com/example-silly-4.gif',
  'https://media.tenor.com/example-silly-5.gif',
  'https://media.tenor.com/example-silly-6.gif',
];
const SMART_GIFS = [
  'https://media.tenor.com/example-silly-7.gif',
  'https://media.tenor.com/example-silly-8.gif',
  'https://media.tenor.com/example-silly-9.gif',
];
const AVERAGE_GIFS = [
  'https://media.tenor.com/example-silly-10.gif',
  'https://media.tenor.com/example-silly-11.gif',
  'https://media.tenor.com/example-silly-12.gif',
];
const SILLY_GIFS = [
  'https://media.tenor.com/example-silly-13.gif',
  'https://media.tenor.com/example-silly-14.gif',
  'https://media.tenor.com/example-silly-15.gif',
];
const VERY_DUMB_GIFS = [
  'https://media.tenor.com/example-silly-16.gif',
  'https://media.tenor.com/example-silly-17.gif',
  'https://media.tenor.com/example-silly-18.gif',
];

/**
 * Единая таблица тиров для значений 1-99. Сообщение, цвет и набор гифок
 * берутся из одного тира, поэтому они всегда согласованы между собой.
 * value === 0 и value === 100 обрабатываются отдельно.
 */
const TIERS: { max: number; phrase: string; color: number; gifs: string[] }[] = [
  { max: 10, phrase: 'Почти гений, но не совсем!', color: 0x00ff00, gifs: SMART_GIFS },
  { max: 25, phrase: 'Немного глуповат, но в целом умненький!', color: 0x00ff00, gifs: SMART_GIFS },
  { max: 40, phrase: 'Выше среднего по глупости!', color: 0xffff00, gifs: AVERAGE_GIFS },
  { max: 60, phrase: 'Средний уровень глупости.', color: 0xffff00, gifs: AVERAGE_GIFS },
  { max: 75, phrase: 'Довольно глуповат!', color: 0xff9900, gifs: SILLY_GIFS },
  { max: 90, phrase: 'Очень глупенький!', color: 0xff0000, gifs: VERY_DUMB_GIFS },
  { max: 99, phrase: 'Критический уровень глупости!!!', color: 0xff0000, gifs: VERY_DUMB_GIFS },
];

function pick(gifs: string[]): string {
  return gifs[Math.floor(Math.random() * gifs.length)];
}

const action: ActionDefinition = {
  name: 'silly',
  textName: 'силли',
  aliases: ['silly'],
  description: 'Силлимер (0-100)',
  template: '', // Не используется, так как логика кастомная
  selfTemplate: '', // Не используется
  requireTarget: false,
  noTarget: true, // Работает только на автора, цель не нужна.
  color: 0xffff00, // Будет переопределяться динамически
  gifs: [], // Будет выбираться динамически

  // Кастомная логика для генерации embed
  customEmbed: (authorMention) => {
    const value = Math.floor(Math.random() * 101); // 0-100

    let message: string;
    let color: number;
    let gif: string;

    if (value === 0) {
      message = '**Абсолютный гений!** Ваш интеллект не знает границ!';
      color = 0x00ffff; // Голубой (гений)
      gif = pick(GENIUS_GIFS);
    } else if (value === 100) {
      message = '**Абсолютная глупенькость!** Поздравляем, вы достигли дна!';
      color = 0x8b0000; // Тёмно-красный (абсолютная глупость)
      gif = pick(ABSOLUTE_GIFS);
    } else {
      // Один тир задаёт сразу фразу, цвет и набор гифок — без рассинхрона.
      const tier = TIERS.find((t) => value <= t.max)!;
      message = `**Глупенький на ${value}!** ${tier.phrase}`;
      color = tier.color;
      gif = pick(tier.gifs);
    }

    return {
      description: `${authorMention} ${message}`,
      color,
      image: gif,
    };
  },
};

export default action;
