import { EmbedBuilder } from 'discord.js';
import type { ActionDefinition } from '../types.js';
import { pickGif } from './gifStore.js';

const DEFAULT_COLOR = 0xff7fa5;

function fill(template: string, author: string, target: string): string {
  return template.replaceAll('{author}', author).replaceAll('{target}', target);
}

export function buildActionResponse(
  action: ActionDefinition,
  authorMention: string,
  targetMention: string | null
): { content: string; embed: EmbedBuilder | null } {
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

  let text: string;

  if (targetMention) {
    text = fill(action.template, authorMention, targetMention);
  } else if (action.selfTemplate) {
    text = fill(action.selfTemplate, authorMention, authorMention);
  } else {
    text = fill(action.template, authorMention, authorMention);
  }

  if (!text) {
    text = `${authorMention} ${action.name}`;
  }

  const gif = pickGif(action.name);
  if (!gif) {
    return { content: text, embed: null };
  }

  const embed = new EmbedBuilder()
    .setColor(action.color ?? DEFAULT_COLOR)
    .setDescription(text)
    .setImage(gif);

  return { content: '', embed };
}
