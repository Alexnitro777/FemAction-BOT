import { EmbedBuilder, MessageFlags, User } from 'discord.js';
import type { UtilityCommand } from '../types.js';
import { getStats } from '../lib/statsStore.js';
import { getActiveVoiceMs } from '../events/activity.js';
import { getMessageRoles, getVoiceRoles } from '../lib/rewardsConfig.js';
import {
  formatMessageCount,
  formatVoiceDuration,
} from '../lib/formatTime.js';

const HOUR_MS = 60 * 60 * 1000;
const BAR_SEGMENTS = 10;

function previousThreshold(values: number[], current: number): number {
  let floor = 0;
  for (const value of values) {
    if (value <= current) floor = value;
    else break;
  }
  return floor;
}

function progressBar(current: number, floor: number, target: number): string {
  const span = target - floor;
  const ratio = span > 0 ? (current - floor) / span : 1;
  const clamped = Math.max(0, Math.min(1, ratio));
  let filled = Math.round(clamped * BAR_SEGMENTS);
  if (clamped < 1) filled = Math.min(filled, BAR_SEGMENTS - 1);
  const bar = '🟩'.repeat(filled) + '⬜'.repeat(BAR_SEGMENTS - filled);
  return `${bar}  ${Math.round(clamped * 100)}%`;
}

function buildStatsEmbed(guildId: string, user: User): EmbedBuilder {
  const stats = getStats(guildId, user.id);
  const totalVoiceMs = stats.voiceMs + getActiveVoiceMs(guildId, user.id);

  const embed = new EmbedBuilder()
    .setColor(0xff7fa5)
    .setTitle('📊 Статистика активности')
    .setThumbnail(user.displayAvatarURL())
    .setDescription(`<@${user.id}>`)
    .addFields(
      { name: '💬 Сообщения', value: formatMessageCount(stats.messages), inline: true },
      { name: '🎙️ В голосовых', value: formatVoiceDuration(totalVoiceMs), inline: true }
    );

  const messageRoles = getMessageRoles();
  const nextMsg = messageRoles.find((r) => r.count > stats.messages);
  if (nextMsg) {
    const floor = previousThreshold(
      messageRoles.map((r) => r.count),
      stats.messages
    );
    embed.addFields({
      name: '⬆️ Следующая роль за сообщения',
      value:
        `${progressBar(stats.messages, floor, nextMsg.count)}\n` +
        `ещё ${formatMessageCount(nextMsg.count - stats.messages)}`,
    });
  }

  const voiceRoles = getVoiceRoles();
  const currentHours = totalVoiceMs / HOUR_MS;
  const nextVoice = voiceRoles.find((r) => r.hours > currentHours);
  if (nextVoice) {
    const floorMs =
      previousThreshold(
        voiceRoles.map((r) => r.hours),
        currentHours
      ) * HOUR_MS;
    const targetMs = nextVoice.hours * HOUR_MS;
    embed.addFields({
      name: '⬆️ Следующая роль за голос',
      value:
        `${progressBar(totalVoiceMs, floorMs, targetMs)}\n` +
        `ещё ${formatVoiceDuration(targetMs - totalVoiceMs)}`,
    });
  }

  return embed;
}

const command: UtilityCommand = {
  name: 'статистика',
  description: 'Статистика активности: сообщения и время в голосовых.',
  executeSlash: async (interaction) => {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'Команда доступна только на сервере.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const user = interaction.options.getUser('цель') ?? interaction.user;

    await interaction.reply({
      embeds: [buildStatsEmbed(interaction.guildId, user)],
      allowedMentions: { parse: [] },
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default command;
