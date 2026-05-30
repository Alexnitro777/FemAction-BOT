import { Events, Interaction } from 'discord.js';
import type { BotClient } from '../types.js';
import { buildActionResponse } from '../lib/buildResponse.js';

/** Обрабатывает слеш-команды. */
export function registerInteractionHandler(client: BotClient) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // Утилитарные слеш-команды.
    const util = client.utility.get(interaction.commandName);
    if (util?.executeSlash) {
      await util.executeSlash(interaction);
      return;
    }

    const action = client.rpActions.get(interaction.commandName);
    if (!action) return;

    const target = interaction.options.getUser('цель');
    const authorMention = `<@${interaction.user.id}>`;
    const targetMention = target ? `<@${target.id}>` : null;

    const { content, embed } = buildActionResponse(
      action,
      authorMention,
      targetMention
    );

    await interaction.reply({
      content: content || undefined,
      embeds: embed ? [embed] : [],
      allowedMentions: { parse: ['users'] },
    });
  });
}
