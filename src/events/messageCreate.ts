import { Events, Message } from 'discord.js';
import type { BotClient } from '../types.js';
import { config } from '../config.js';
import { buildActionResponse } from '../lib/buildResponse.js';

/**
 * Обрабатывает текстовые команды вида !поцеловать @user.
 * Цель определяется по первому упоминанию в сообщении.
 */
export function registerMessageHandler(client: BotClient) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) {
      return;
    }

    const withoutPrefix = message.content.slice(config.prefix.length).trim();
    const parts = withoutPrefix.split(/\s+/);
    const commandName = parts.shift()?.toLowerCase();
    if (!commandName) return;

    // Утилитарные команды.
    const util = client.utility.get(commandName);
    if (util?.executeText) {
      await util.executeText(message, parts);
      return;
    }

    // РП-действия через индекс имён/алиасов.
    const canonical = client.textIndex.get(commandName);
    if (!canonical) return;

    const action = client.rpActions.get(canonical);
    if (!action) return;

    // Проверка кулдауна (только для серверов, не для ЛС).
    if (message.guildId) {
      const remaining = client.cooldowns.check(message.guildId, action.name);
      if (remaining > 0) {
        const reply = await message.reply(
          `⏱️ Команда на кулдауне. Попробуй через ${remaining} сек.`
        );
        // Удаляем сообщение через 5 секунд
        setTimeout(() => reply.delete().catch(() => {}), 5000);
        return;
      }
    }

    const target = message.mentions.users.first();
    if (action.requireTarget && !target) {
      await message.reply(`Укажи цель: \`${config.prefix}${action.textName} @пользователь\``);
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
    await message.channel.send({
      content: content || undefined,
      embeds: embed ? [embed] : [],
      allowedMentions: { parse: ['users'] },
    });

    // Устанавливаем кулдаун после успешного выполнения.
    if (message.guildId) {
      client.cooldowns.set(message.guildId, action.name);
    }
  });
}
