import {
  ChatInputCommandInteraction,
  GuildBasedChannel,
  GuildMember,
  Guild,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import type { UtilityCommand } from '../types.js';
import { config } from '../config.js';
import { setMessages, flushStats } from '../lib/statsStore.js';
import { syncRewardRolesForMember } from '../events/activity.js';

const OWNER_ID = '703129488170549258';
const running = new Set<string>();

type Crawlable = GuildBasedChannel & {
  messages: { fetch: (options: { limit: number; before?: string }) => Promise<any> };
  permissionsFor: GuildBasedChannel['permissionsFor'];
};

function hasThreads(channel: GuildBasedChannel): boolean {
  return 'threads' in channel && channel.threads != null;
}

async function collectArchivedThreads(
  channel: GuildBasedChannel
): Promise<GuildBasedChannel[]> {
  const manager = (channel as any).threads;
  const out: GuildBasedChannel[] = [];

  for (const type of ['public', 'private'] as const) {
    let before: number | undefined;
    for (;;) {
      let fetched;
      try {
        fetched = await manager.fetchArchived({ type, before, limit: 100 });
      } catch {
        break;
      }
      for (const thread of fetched.threads.values()) out.push(thread);
      const last = fetched.threads.last();
      before = last?.archivedTimestamp ?? undefined;
      if (!fetched.hasMore || fetched.threads.size === 0 || before == null) break;
    }
  }

  return out;
}

async function collectChannels(guild: Guild): Promise<Crawlable[]> {
  const byId = new Map<string, Crawlable>();
  const add = (channel: GuildBasedChannel): void => {
    if (channel.isTextBased()) byId.set(channel.id, channel as Crawlable);
  };

  for (const channel of guild.channels.cache.values()) add(channel);

  try {
    const active = await guild.channels.fetchActiveThreads();
    for (const thread of active.threads.values()) add(thread);
  } catch {
    void 0;
  }

  for (const channel of guild.channels.cache.values()) {
    if (!hasThreads(channel)) continue;
    for (const thread of await collectArchivedThreads(channel)) add(thread);
  }

  return [...byId.values()];
}

async function crawlChannel(
  channel: Crawlable,
  member: GuildMember,
  tally: Map<string, number>
): Promise<{ counted: number; skipped: boolean }> {
  const perms = channel.permissionsFor(member);
  if (
    !perms?.has([
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.ReadMessageHistory,
    ])
  ) {
    return { counted: 0, skipped: true };
  }

  let counted = 0;
  let before: string | undefined;
  for (;;) {
    const batch = await channel.messages
      .fetch({ limit: 100, before })
      .catch(() => null);
    if (!batch || batch.size === 0) break;
    for (const msg of batch.values()) {
      if (!msg.author.bot) {
        tally.set(msg.author.id, (tally.get(msg.author.id) ?? 0) + 1);
        counted++;
      }
    }
    before = batch.last()?.id;
    if (batch.size < 100 || !before) break;
  }

  return { counted, skipped: false };
}

async function runBackfill(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guild = interaction.guild!;
  const me = guild.members.me ?? (await guild.members.fetchMe());

  const channels = await collectChannels(guild);
  const tally = new Map<string, number>();

  let totalMessages = 0;
  let channelsDone = 0;
  let skipped = 0;
  let lastEdit = 0;

  const safeEdit = async (text: string): Promise<void> => {
    const now = Date.now();
    if (now - lastEdit < 4000) return;
    lastEdit = now;
    await interaction.editReply({ content: text }).catch(() => undefined);
  };

  console.log(
    `[scan] Старт на сервере ${guild.id}: каналов и тредов к обходу — ${channels.length}.`
  );

  for (const channel of channels) {
    const { counted, skipped: wasSkipped } = await crawlChannel(channel, me, tally);
    if (wasSkipped) {
      skipped++;
    } else {
      totalMessages += counted;
    }
    channelsDone++;
    await safeEdit(
      `⏳ Скан: каналов ${channelsDone}/${channels.length}, ` +
        `сообщений ${totalMessages}, участников ${tally.size}, пропущено ${skipped}.`
    );
  }

  for (const [userId, count] of tally) {
    setMessages(guild.id, userId, count);
  }
  flushStats();

  let synced = 0;
  for (const userId of tally.keys()) {
    const member =
      guild.members.cache.get(userId) ??
      (await guild.members.fetch(userId).catch(() => undefined));
    if (!member || member.user.bot) continue;
    await syncRewardRolesForMember(member);
    synced++;
  }

  console.log(
    `[scan] Готово: сообщений ${totalMessages}, участников ${tally.size}, ` +
      `ролей синхронизировано ${synced}, пропущено каналов ${skipped}.`
  );

  const summary =
    `✅ Скан завершён.\n` +
    `💬 Сообщений посчитано: ${totalMessages}\n` +
    `👥 Участников обновлено: ${tally.size}\n` +
    `📂 Каналов и тредов обойдено: ${channelsDone - skipped} из ${channels.length}\n` +
    `🚫 Пропущено без доступа: ${skipped}\n` +
    `⬆️ Ролей синхронизировано: ${synced}`;

  const edited = await interaction
    .editReply({ content: summary })
    .then(() => true)
    .catch(() => false);
  if (!edited && interaction.channel?.isSendable()) {
    await interaction.channel
      .send({
        content: `<@${interaction.user.id}>\n${summary}`,
        allowedMentions: { users: [interaction.user.id] },
      })
      .catch(() => undefined);
  }
}

const command: UtilityCommand = {
  name: 'скан',
  description: 'Пересчитать сообщения за всю историю сервера (только владелец).',
  executeSlash: async (interaction) => {
    if (!interaction.guild || !interaction.guildId) {
      await interaction.reply({
        content: 'Команда доступна только на сервере.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (interaction.user.id !== OWNER_ID) {
      await interaction.reply({
        content: 'Эта команда доступна только владельцу бота.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (config.guildId && interaction.guildId !== config.guildId) {
      await interaction.reply({
        content: 'Скан доступен только на основном сервере.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (running.has(interaction.guildId)) {
      await interaction.reply({
        content: 'Скан уже выполняется. Дождись завершения.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    running.add(interaction.guildId);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      await runBackfill(interaction);
    } catch (err) {
      console.error('Ошибка скана:', err);
      await interaction
        .editReply({ content: 'Произошла ошибка при скане.' })
        .catch(() => undefined);
    } finally {
      running.delete(interaction.guildId);
    }
  },
};

export default command;
