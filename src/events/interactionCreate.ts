import { Events, Interaction, EmbedBuilder } from 'discord.js';
import type { BotClient } from '../types.js';
import { buildActionResponse } from '../lib/buildResponse.js';
import { formatCooldownTime } from '../lib/formatTime.js';

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

    // Проверка кулдауна (только для серверов).
    if (interaction.guildId) {
      const remaining = client.cooldowns.check(interaction.guildId, action.name);
      if (remaining > 0) {
        const timeStr = formatCooldownTime(remaining);
        const timestamp = Math.floor(Date.now() / 1000) + remaining;

        const cooldownEmbed = new EmbedBuilder()
          .setColor(0xFFA500) // Оранжевый цвет
          .setTitle('⏱️ Команда на кулдауне!')
          .setDescription(`🕐 Осталось: <t:${timestamp}:R>`);

        await interaction.reply({
          embeds: [cooldownEmbed],
          ephemeral: true,
        });

        // Удаляем сообщение когда кулдаун закончится
        setTimeout(() => {
          interaction.deleteReply().catch(() => {});
        }, remaining * 1000);
        return;
      }
    }

    const target = action.name === 'silly' ? null : interaction.options.getUser('цель');

    // Проверка: нельзя выбрать себя в качестве цели (кроме silly)
    if (target && target.id === interaction.user.id && action.name !== 'silly') {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000) // Красный цвет
        .setTitle('❌ Ошибка!')
        .setDescription('Вы не можете выбрать себя в качестве цели для этой команды!');

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
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

    await interaction.reply({
      content: content || undefined,
      embeds: embed ? [embed] : [],
      allowedMentions: { parse: ['users'] },
    });

    // Устанавливаем кулдаун после успешного выполнения.
    if (interaction.guildId) {
      client.cooldowns.set(interaction.guildId, action.name);
    }
  });
}
