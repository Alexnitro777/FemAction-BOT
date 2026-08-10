import type { ActionDefinition } from '../types.js';
import { pickSillyGif } from '../lib/gifStore.js';

type SillyPool = 'genius' | 'absolute' | 'smart' | 'average' | 'silly' | 'veryDumb';

const TIERS: { max: number; phrase: string; color: number; pool: SillyPool }[] = [
  { max: 10, phrase: 'Почти гений, но не совсем!', color: 0x00ff00, pool: 'smart' },
  { max: 25, phrase: 'Немного глуповат, но в целом умненький!', color: 0x00ff00, pool: 'smart' },
  { max: 40, phrase: 'Выше среднего по глупости!', color: 0xffff00, pool: 'average' },
  { max: 60, phrase: 'Средний уровень глупости.', color: 0xffff00, pool: 'average' },
  { max: 75, phrase: 'Довольно глуповат!', color: 0xff9900, pool: 'silly' },
  { max: 90, phrase: 'Очень глупенький!', color: 0xff0000, pool: 'veryDumb' },
  { max: 99, phrase: 'Критический уровень глупости!!!', color: 0xff0000, pool: 'veryDumb' },
];

function pick(pool: SillyPool): string | undefined {
  return pickSillyGif(pool);
}

const action: ActionDefinition = {
  name: 'силли',
  description: 'Силлимер (0-100)',
  template: '',
  requireTarget: false,
  noTarget: true,
  color: 0xffff00,

  customEmbed: (authorMention) => {
    const value = Math.floor(Math.random() * 101);

    let message: string;
    let color: number;
    let gif: string | undefined;

    if (value === 0) {
      message = '**Абсолютный гений!** Ваш интеллект не знает границ!';
      color = 0x00ffff;
      gif = pick('genius');
    } else if (value === 100) {
      message = '**Абсолютная глупенькость!** Поздравляем, вы достигли дна!';
      color = 0x8b0000;
      gif = pick('absolute');
    } else {
      const tier = TIERS.find((t) => value <= t.max)!;
      message = `**Глупенький на ${value}%!** ${tier.phrase}`;
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
