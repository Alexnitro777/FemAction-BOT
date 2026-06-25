import { MessageFlags, type TextBasedChannel } from 'discord.js';
import type { UtilityCommand } from '../types.js';

const OWNER_ID = '703129488170549258';

const command: UtilityCommand = {
  name: 'запостить',
  description: 'Опубликовать готовый embed по имени (только владелец).',
  autocomplete: async (interaction) => {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = [...interaction.client.embeds.values()]
      .filter((e) => e.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map((e) => ({ name: `${e.name} — ${e.description}`.slice(0, 100), value: e.name }));
    await interaction.respond(choices);
  },
  executeSlash: async (interaction) => {
    if (interaction.user.id !== OWNER_ID) {
      await interaction.reply({
        content: 'Эта команда доступна только владельцу бота.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const name = interaction.options.getString('название', true);
    const def = interaction.client.embeds.get(name);
    if (!def) {
      await interaction.reply({
        content: `❌ Embed «${name}» не найден.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const target = (interaction.options.getChannel('канал') ?? interaction.channel) as
      | TextBasedChannel
      | null;

    if (!target || !target.isTextBased() || !('send' in target)) {
      await interaction.reply({
        content: '❌ Не получилось отправить: выбери текстовый канал.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const { embeds, components } = def.build();
      await target.send({ embeds, components: components ?? [] });
      await interaction.reply({
        content: `✅ Embed «${name}» отправлен в <#${target.id}>.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error('Ошибка при отправке embed-а:', err);
      await interaction.reply({
        content: `❌ Ошибка при отправке: ${err instanceof Error ? err.message : String(err)}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default command;
