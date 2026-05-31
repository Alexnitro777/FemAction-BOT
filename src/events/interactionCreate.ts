import {
  Events,
  Interaction,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import type { BotClient } from '../types.js';
import { buildActionResponse } from '../lib/buildResponse.js';
import { formatCooldownTime } from '../lib/formatTime.js';

/** Обрабатывает слеш-команды. */
export function registerInteractionHandler(client: BotClient) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      // Утилитарные слеш-команды.
      const util = client.utility.get(interaction.commandName);
      if (util?.executeSlash) {
        await util.executeSlash(interaction);
        return;
      }

      const action = client.rpActions.get(interaction.commandName);
      if (!action) return;

      // Проверка кулдауна (только для серверов).
      if (interaction.guildId) {
        const cooldown = client.cooldowns.check(interaction.guildId, action.name);
        if (cooldown) {
          const cooldownEmbed = new EmbedBuilder()
            .setColor(0xffa500) // Оранжевый цвет
            .setTitle('⏱️ Команда на кулдауне!')
            .setDescription(`🕐 Осталось: ${formatCooldownTime(cooldown.seconds)}`);

          await interaction.reply({
            embeds: [cooldownEmbed],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }

      const target = action.noTarget
        ? null
        : interaction.options.getUser('цель');

      // Проверка: нельзя выбрать себя в качестве цели.
      if (target && target.id === interaction.user.id) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xff0000) // Красный цвет
          .setTitle('❌ Ошибка!')
          .setDescription(
            'Вы не можете выбрать себя в качестве цели для этой команды!'
          );

        await interaction.reply({
          embeds: [errorEmbed],
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

      // Резервируем кулдаун перед ответом: между проверкой и установкой нет
      // await, поэтому два почти одновременных вызова не проскочат оба.
      if (interaction.guildId) {
        client.cooldowns.set(interaction.guildId, action.name);
      }

      await interaction.reply({
        content: content || undefined,
        embeds: embed ? [embed] : [],
        allowedMentions: { parse: ['users'] },
      });
    } catch (err) {
      console.error('Ошибка обработки слеш-команды:', err);

      // Пытаемся сообщить пользователю, если ещё не ответили.
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            content: 'Произошла ошибка при выполнении команды.',
            flags: MessageFlags.Ephemeral,
          });
        } catch {
          // Интеракция могла истечь — игнорируем.
        }
      }
    }
  });
}
