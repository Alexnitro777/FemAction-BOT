import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import type { UtilityCommand } from '../types.js';
import { getGuildUserIds, getStats } from '../lib/statsStore.js';
import { getActiveVoiceMs } from '../events/activity.js';
import { formatMessageCount, formatVoiceShort } from '../lib/formatTime.js';

const TOP_LIMIT = 10;
const COLLECTOR_MS = 2 * 60 * 1000;
const MEDALS = ['🥇', '🥈', '🥉'];

const PAGE_MESSAGES = 'messages';
const PAGE_VOICE = 'voice';
type Page = typeof PAGE_MESSAGES | typeof PAGE_VOICE;

const BTN_MESSAGES = 'leaders:messages';
const BTN_VOICE = 'leaders:voice';

interface Entry {
  userId: string;
  value: number;
}

function topMessages(guildId: string): Entry[] {
  return getGuildUserIds(guildId)
    .map((userId) => ({ userId, value: getStats(guildId, userId).messages }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_LIMIT);
}

function topVoice(guildId: string): Entry[] {
  return getGuildUserIds(guildId)
    .map((userId) => ({
      userId,
      value: getStats(guildId, userId).voiceMs + getActiveVoiceMs(guildId, userId),
    }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_LIMIT);
}

function rankPrefix(index: number): string {
  return MEDALS[index] ?? `\`${index + 1}.\``;
}

function buildEmbed(guildId: string, page: Page): EmbedBuilder {
  const isMessages = page === PAGE_MESSAGES;
  const entries = isMessages ? topMessages(guildId) : topVoice(guildId);

  const lines = entries.map((e, i) => {
    const formatted = isMessages
      ? formatMessageCount(e.value)
      : formatVoiceShort(e.value);
    return `${rankPrefix(i)} <@${e.userId}> — ${formatted}`;
  });

  return new EmbedBuilder()
    .setColor(0xff7fa5)
    .setTitle(isMessages ? '💬 Топ по сообщениям' : '🎙️ Топ по голосовым')
    .setDescription(lines.length > 0 ? lines.join('\n') : 'Пока нет данных.')
    .setFooter({
      text: isMessages
        ? 'Страница 1/2 — сообщения'
        : 'Страница 2/2 — голосовые',
    });
}

function buildRow(page: Page): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(BTN_MESSAGES)
      .setLabel('💬 Сообщения')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === PAGE_MESSAGES),
    new ButtonBuilder()
      .setCustomId(BTN_VOICE)
      .setLabel('🎙️ Войсы')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === PAGE_VOICE)
  );
}

const command: UtilityCommand = {
  name: 'лидеры',
  description: 'Топ-10 участников по сообщениям и времени в голосовых.',
  executeSlash: async (interaction) => {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'Команда доступна только на сервере.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const guildId = interaction.guildId;
    let page: Page = PAGE_MESSAGES;

    await interaction.reply({
      embeds: [buildEmbed(guildId, page)],
      components: [buildRow(page)],
      allowedMentions: { parse: [] },
    });

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: COLLECTOR_MS,
    });

    collector.on('collect', async (button) => {
      if (button.user.id !== interaction.user.id) {
        await button.reply({
          content: 'Эти кнопки только для того, кто вызвал команду.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      page = button.customId === BTN_VOICE ? PAGE_VOICE : PAGE_MESSAGES;

      await button.update({
        embeds: [buildEmbed(guildId, page)],
        components: [buildRow(page)],
        allowedMentions: { parse: [] },
      });
    });

    collector.on('end', async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {}
    });
  },
};

export default command;
