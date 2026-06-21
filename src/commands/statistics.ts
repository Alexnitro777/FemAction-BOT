import { EmbedBuilder, MessageFlags, User } from 'discord.js';
import type { UtilityCommand } from '../types.js';
import { getStats } from '../lib/statsStore.js';
import { getActiveVoiceMs } from '../events/activity.js';
import { getMessageRoles, getVoiceRoles } from '../lib/rewardsConfig.js';
import {
  formatMessageCount,
  formatVoiceDuration,
  formatVoiceThreshold,
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

  const nextMsg = getMessageRoles().find((r) => r.count > stats.messages);
  if (nextMsg) {
    embed.addFields({
      name: '⬆️ Следующая роль за сообщения',
      value: `Ещё ${formatMessageCount(nextMsg.count - stats.messages)} (до ${nextMsg.count})`,
    });
  }

  const currentHours = totalVoiceMs / HOUR_MS;
  const nextVoice = getVoiceRoles().find((r) => r.hours > currentHours);
  if (nextVoice) {
    const remainingMs = nextVoice.hours * HOUR_MS - totalVoiceMs;
    embed.addFields({
      name: '⬆️ Следующая роль за голос',
      value: `Ещё ${formatVoiceDuration(remainingMs)} (до ${formatVoiceThreshold(nextVoice.hours)})`,
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
