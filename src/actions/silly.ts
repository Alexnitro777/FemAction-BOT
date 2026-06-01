import type { ActionDefinition } from '../types.js';
import { pickSillyGif } from '../lib/gifStore.js';

/**
 * Действие "silly" - случайная оценка глупости/гениальности пользователя.
 * 0 = абсолютный гений, 1-99 = глупенький на "число", 100 = абсолютная глупость.
 * Работает только на себя.
 *
 * Наборы гифок берутся из config.json -> silly.<пул>. Доступные пулы:
 * genius, absolute, smart, average, silly, veryDumb.
 */

/** Имена пулов гифок в config.json -> silly. */
type SillyPool = 'genius' | 'absolute' | 'smart' | 'average' | 'silly' | 'veryDumb';

/**
 * Единая таблица тиров для значений 1-99. Сообщение, цвет и пул гифок
 * берутся из одного тира, поэтому они всегда согласованы между собой.
 * value === 0 и value === 100 обрабатываются отдельно.
 */
const TIERS: { max: number; phrase: string; color: number; pool: SillyPool }[] = [
  { max: 10, phrase: 'Почти гений, но не совсем!', color: 0x00ff00, pool: 'smart' },
  { max: 25, phrase: 'Немного глуповат, но в целом умненький!', color: 0x00ff00, pool: 'smart' },
  { max: 40, phrase: 'Выше среднего по глупости!', color: 0xffff00, pool: 'average' },
  { max: 60, phrase: 'Средний уровень глупости.', color: 0xffff00, pool: 'average' },
  { max: 75, phrase: 'Довольно глуповат!', color: 0xff9900, pool: 'silly' },
  { max: 90, phrase: 'Очень глупенький!', color: 0xff0000, pool: 'veryDumb' },
  { max: 99, phrase: 'Критический уровень глупости!!!', color: 0xff0000, pool: 'veryDumb' },
];

/** Случайная гифка из пула config.json (без повтора подряд). */
function pick(pool: SillyPool): string | undefined {
  return pickSillyGif(pool);
}

const action: ActionDefinition = {
  name: 'силли',
  textName: 'силли',
  aliases: ['silly'],
  description: 'Силлимер (0-100)',
  template: '', // Не используется, так как логика кастомная
  selfTemplate: '', // Не используется
  requireTarget: false,
  noTarget: true, // Работает только на автора, цель не нужна.
  color: 0xffff00, // Будет переопределяться динамически

  // Кастомная логика для генерации embed
  customEmbed: (authorMention) => {
    const value = Math.floor(Math.random() * 101); // 0-100

    let message: string;
    let color: number;
    let gif: string | undefined;

    if (value === 0) {
      message = '**Абсолютный гений!** Ваш интеллект не знает границ!';
      color = 0x00ffff; // Голубой (гений)
      gif = pick('genius');
    } else if (value === 100) {
      message = '**Абсолютная глупенькость!** Поздравляем, вы достигли дна!';
      color = 0x8b0000; // Тёмно-красный (абсолютная глупость)
      gif = pick('absolute');
    } else {
      // Один тир задаёт сразу фразу, цвет и пул гифок — без рассинхрона.
      const tier = TIERS.find((t) => value <= t.max)!;
      message = `**Глупенький на ${value}!** ${tier.phrase}`;
      color = tier.color;
      gif = pick(tier.pool);
    }

    return {
      description: `${authorMention} ${message}`,
      color,
      image: gif,
    };
  },
};

export default action;
