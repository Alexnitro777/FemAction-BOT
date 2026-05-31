import { EmbedBuilder } from 'discord.js';
import type { ActionDefinition } from '../types.js';

const DEFAULT_COLOR = 0xff7fa5;

/** Случайный элемент массива или undefined для пустого. */
export function pickRandom<T>(arr: T[] | undefined): T | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Подставляет {author} и {target} в шаблон.
 * Имена передаются уже в виде упоминаний (<@id>) или отображаемых имён.
 */
function fill(template: string, author: string, target: string): string {
  return template.replaceAll('{author}', author).replaceAll('{target}', target);
}

/**
 * Строит текст и эмбед для РП-действия.
 * authorMention / targetMention — строки-упоминания. targetMention пустая,
 * если цель не указана.
 */
export function buildActionResponse(
  action: ActionDefinition,
  authorMention: string,
  targetMention: string | null
): { content: string; embed: EmbedBuilder | null } {
  // Если есть кастомная логика генерации embed
  if (action.customEmbed) {
    const customData = action.customEmbed(authorMention, targetMention);
    const embed = new EmbedBuilder()
      .setColor(customData.color)
      .setDescription(customData.description);

    if (customData.title) {
      embed.setTitle(customData.title);
    }
    if (customData.image) {
      embed.setImage(customData.image);
    }
    if (customData.footer) {
      embed.setFooter({ text: customData.footer });
    }

    return { content: '', embed };
  }

  // Стандартная логика для обычных РП-команд
  let text: string;

  if (targetMention) {
    text = fill(action.template, authorMention, targetMention);
  } else if (action.selfTemplate) {
    text = fill(action.selfTemplate, authorMention, authorMention);
  } else {
    text = fill(action.template, authorMention, authorMention);
  }

  const gif = pickRandom(action.gifs);
  if (!gif) {
    return { content: text, embed: null };
  }

  const embed = new EmbedBuilder()
    .setColor(action.color ?? DEFAULT_COLOR)
    .setDescription(text)
    .setImage(gif);

  return { content: '', embed };
}
