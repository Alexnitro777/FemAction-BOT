import { Events, Message, EmbedBuilder } from 'discord.js';
import type { BotClient } from '../types.js';
import { config } from '../config.js';
import { buildActionResponse } from '../lib/buildResponse.js';
import { formatCooldownTime } from '../lib/formatTime.js';
import { getCommandChannels, isCommandAllowedHere } from '../lib/commandChannels.js';

export function registerMessageHandler(client: BotClient) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) {
      return;
    }

    try {
      const withoutPrefix = message.content.slice(config.prefix.length).trim();
      const parts = withoutPrefix.split(/\s+/);
      const commandName = parts.shift()?.toLowerCase();
      if (!commandName) return;

      const util = client.utility.get(commandName);
      if (util?.executeText) {
        if (
          message.guildId &&
          !isCommandAllowedHere(
            util.name,
            message.channelId,
            'parentId' in message.channel ? message.channel.parentId : null
          )
        ) {
          if (message.channel.isSendable()) {
            const channels = getCommandChannels(util.name)
              .map((id) => `<#${id}>`)
              .join(', ');
            await message.reply(
              `Эту команду можно использовать только в: ${channels}`
            );
          }
          return;
        }
        await util.executeText(message, parts);
        return;
      }

      const canonical = client.textIndex.get(commandName);
      if (!canonical) return;

      const action = client.rpActions.get(canonical);
      if (!action) return;

      if (message.guildId) {
        const cooldown = client.cooldowns.check(message.guildId, action.name);
        if (cooldown) {
          const cooldownEmbed = new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle('⏱️ Команда на кулдауне!')
            .setDescription(`🕐 Осталось: ${formatCooldownTime(cooldown.seconds)}`);

          await message.reply({ embeds: [cooldownEmbed] });
          return;
        }
      }

      const repliedId = message.mentions.repliedUser?.id;
      const mentioned = action.noTarget
        ? null
        : message.mentions.users.find((u) => u.id !== repliedId) ?? null;

      const target =
        mentioned && mentioned.id === message.author.id ? null : mentioned;

      if (action.requireTarget && !target) {
        await message.reply(
          `Укажи цель: \`${config.prefix}${action.textName} @пользователь\``
        );
        return;
      }

      const authorMention = `<@${message.author.id}>`;
      const targetMention = target ? `<@${target.id}>` : null;
      const { content, embed } = buildActionResponse(
        action,
        authorMention,
        targetMention
      );

      if (!message.channel.isSendable()) return;

      if (message.guildId) {
        client.cooldowns.set(message.guildId, action.name);
      }

      try {
        await message.channel.send({
          content: content || undefined,
          embeds: embed ? [embed] : [],
          allowedMentions: { parse: ['users'] },
        });
      } catch (sendErr) {
        if (message.guildId) {
          client.cooldowns.clear(message.guildId, action.name);
        }
        throw sendErr;
      }
    } catch (err) {
      console.error('Ошибка обработки текстовой команды:', err);
    }
  });
}
