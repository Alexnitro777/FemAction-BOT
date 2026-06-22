import { EmbedBuilder, MessageFlags, User } from 'discord.js';
import type { UtilityCommand } from '../types.js';
import { getStats } from '../lib/statsStore.js';
import { getActiveVoiceMs } from '../events/activity.js';
import { getMessageRoles, getVoiceRoles } from '../lib/rewardsConfig.js';
import {
  formatMessageCount,
  formatVoiceDuration,
  formatVoiceShort,
} from '../lib/formatTime.js';

const HOUR_MS = 60 * 60 * 1000;

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

  const lines: string[] = [];

  const messageRoles = getMessageRoles();
  const nextMsg = messageRoles.find((r) => r.count > stats.messages);
  if (nextMsg) {
    const percent = Math.floor((stats.messages / nextMsg.count) * 100);
    lines.push(
      `💬 ${stats.messages}/${nextMsg.count} (${percent}%) — ещё ${formatMessageCount(nextMsg.count - stats.messages)}`
    );
  }

  const voiceRoles = getVoiceRoles();
  const currentHours = totalVoiceMs / HOUR_MS;
  const nextVoice = voiceRoles.find((r) => r.hours > currentHours);
  if (nextVoice) {
    const targetMs = nextVoice.hours * HOUR_MS;
    const percent = Math.floor((totalVoiceMs / targetMs) * 100);
    lines.push(
      `🎙️ ${formatVoiceShort(totalVoiceMs)}/${formatVoiceShort(targetMs)} (${percent}%) — ещё ${formatVoiceShort(targetMs - totalVoiceMs)}`
    );
  }

  if (lines.length > 0) {
    embed.addFields({ name: '⬆️ Следующая роль', value: lines.join('\n') });
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
