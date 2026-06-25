import {
  Events,
  Interaction,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import type { BotClient } from '../types.js';
import { buildActionResponse } from '../lib/buildResponse.js';
import { formatCooldownTime } from '../lib/formatTime.js';

export function registerInteractionHandler(client: BotClient) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isButton()) {
      const handler = client.buttonHandlers.get(interaction.customId);
      if (!handler) return;
      try {
        await handler(interaction);
      } catch (err) {
        console.error('Ошибка в обработчике кнопки:', err);
        if (!interaction.replied && !interaction.deferred) {
          try {
            await interaction.reply({
              content: 'Произошла ошибка при обработке кнопки.',
              flags: MessageFlags.Ephemeral,
            });
          } catch {}
        }
      }
      return;
    }

    if (interaction.isAutocomplete()) {
      const util = client.utility.get(interaction.commandName);
      if (!util?.autocomplete) return;
      try {
        await util.autocomplete(interaction);
      } catch (err) {
        console.error('Ошибка автоподсказки:', err);
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    try {
      const util = client.utility.get(interaction.commandName);
      if (util?.executeSlash) {
        await util.executeSlash(interaction);
        return;
      }

      const action = client.rpActions.get(interaction.commandName);
      if (!action) return;

      if (interaction.guildId) {
        const cooldown = client.cooldowns.check(interaction.guildId, action.name);
        if (cooldown) {
          const cooldownEmbed = new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle('⏱️ Команда на кулдауне!')
            .setDescription(`🕐 Осталось: ${formatCooldownTime(cooldown.seconds)}`);

          await interaction.reply({
            embeds: [cooldownEmbed],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }

      const mentioned = action.noTarget
        ? null
        : interaction.options.getUser('цель');

      const target =
        mentioned && mentioned.id === interaction.user.id ? null : mentioned;

      if (action.requireTarget && !target) {
        await interaction.reply({
          content: 'Укажи цель команды.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const authorMention = `<@${interaction.user.id}>`;
      const targetMention = target ? `<@${target.id}>` : null;

      const { content, embed } = buildActionResponse(
        action,
        authorMention,
        targetMention
      );

      if (interaction.guildId) {
        client.cooldowns.set(interaction.guildId, action.name);
      }

      try {
        await interaction.reply({
          content: content || undefined,
          embeds: embed ? [embed] : [],
          allowedMentions: { parse: ['users'] },
        });
      } catch (sendErr) {
        if (interaction.guildId) {
          client.cooldowns.clear(interaction.guildId, action.name);
        }
        throw sendErr;
      }
    } catch (err) {
      console.error('Ошибка обработки слеш-команды:', err);

      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            content: 'Произошла ошибка при выполнении команды.',
            flags: MessageFlags.Ephemeral,
          });
        } catch {}
      }
    }
  });
}
