import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import type { EmbedDefinition } from './types.js';

const IMAGE_URL =
  'https://message.style/cdn/images/19ff44b737f293712cc2c96a452451257a70bc968acb3a5f4df87c0c6f6286b4.jfif';

const DONATE_URL =
  'https://discord.com/channels/1386381286754746439/1432841028766925010/1478132764137095288';
const RULES_URL =
  'https://discord.com/channels/1386381286754746439/1386382390691369000/1399019823161282610';

const EMOJI: Record<'roles' | 'channels' | 'donate' | 'rules', string | null> = {
  roles: 'RPHBabyOwO:1395374987816337500',
  channels: 'whitefur_blush:1480144879630946470',
  donate: 'wyphere_cute:1480139806544625737',
  rules: 'Fox_with_eggplant:1432120298626486292',
};

function withEmoji(button: ButtonBuilder, emoji: string | null): ButtonBuilder {
  return emoji ? button.setEmoji(emoji) : button;
}

const info: EmbedDefinition = {
  name: 'info',
  description: 'Информация Femboy Party',
  build: () => {
    const embed = new EmbedBuilder()
      .setDescription('бебебебебеббебе')
      .setImage(IMAGE_URL);

    const rows = [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        withEmoji(
          new ButtonBuilder()
            .setCustomId('info_roles')
            .setLabel('Рольки')
            .setStyle(ButtonStyle.Secondary),
          EMOJI.roles,
        ),
        withEmoji(
          new ButtonBuilder()
            .setCustomId('info_channels')
            .setLabel('Каналы')
            .setStyle(ButtonStyle.Secondary),
          EMOJI.channels,
        ),
        withEmoji(
          new ButtonBuilder()
            .setLabel('Донатики')
            .setStyle(ButtonStyle.Link)
            .setURL(DONATE_URL),
          EMOJI.donate,
        ),
        withEmoji(
          new ButtonBuilder()
            .setLabel('Правила')
            .setStyle(ButtonStyle.Link)
            .setURL(RULES_URL),
          EMOJI.rules,
        ),
      ),
    ];

    return { embeds: [embed], components: rows };
  },

  buttons: {
    info_roles: async (interaction) => {
      const embed = new EmbedBuilder()
        .setTitle('Рольки')
        .setDescription(
          [
            '<@&1386381356497637497> - *Владелец сервера.*',
            '<@&1389665669192351785> - *Заместитель владельца сервера.*',
            '<@&1453968010787422365> - *Помощник заместителя владельца сервера.*',
            '<@&1518964990810525796> - *Помогает следить за соблюдением порядка на сервере. Его задача состоит в контроле работы обычных администраторов и остальных сотрудников сервера. Заниматься рассмотрением и согласованием ваших идей для улучшения сервера.*',
            '<@&1518964986318295151> - *Занимается рассмотрением жалоб, анкет, апелляций, сохраняет правопорядок на сервере.*',
            '<@&1394291764990574753> - *Старший модератор.*',
            '<@&1388159785018462218> - *Модератор.*',
            '<@&1399053657521131703> - *Младший модератор.*',
            '<@&1408862931898077336> - *роль для тех, кто хочет проводить и делиться веселым временем на нашем сервере!*',
            '',
            '<@&1397535335898152971> - *Роль созданная для лиц способствующих развитию сервера путем прямого воздействия на его активность/рост участников или иных способов благоприятных серверу.*',
            '',
            '<@&1432120523269083299> - *Роль за поддержку нашего сервера. Спасибо!*',
            '<@&1387172479642108007> - *Роль за наш тег. Спасибо за поддержку, пушистик!*',
            '<@&1386426349308219505> - *Роль для бустеров нашего сервера. Спасибо!*',
            '',
            '<@&1400127547836203058> - *Роль для самых милых участников сервера. Нявь!*',
            '<@&1428007571909775401> - *Роль для чмонь и дурачков.*',
            '<@&1415631859697586319> - *Роль для самых-самых художников нашего сервера.*',
            '<@&1406932096387256351> - *Роль для творческих личностей нашего сервера.*',
            '-# за получением ролей обращайтесь к администрации',
            '',
            '<@&1502616650422161609> - *Роль частично ограничивающая доступ к серверу. Выдается несовершеннолетним лицам, анкета которых была создана с целью поиска партнера для отношения или иных подобных целей, выдается так же неадекватным участникам, пытающимся оскорбить или унизить других участников сервер путем создания такой анкеты.*',
            '<@&1453337895153963038> - *Роль ограничивающая доступ к серверу полностью (карантин). Выдается лицам несущий существенный вред серверу и его участникам. Есть возможность подачи апелляции для ее снятия и восстановления доступа.*',
            '',
            '<@&1518708409958928639> - *200 часов в голосовом канале.*',
            '<@&1421458299693305926> - *100 часов в голосовом канале.*',
            '<@&1518708409103286413> - *15000 сообщений.*',
            '<@&1518708408411357216> - *10000 сообщений.*',
            '<@&1518708407446536324> - *5500 сообщений.*',
            '<@&1432120762201935953> - *3500 сообщений.*',
            '<@&1518708402514301090> - *1500 сообщений.*',
            '',
            '**Кастомные роли можно приобрести в <#1432841028766925010>.**',
          ].join('\n'),
        )
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },

    info_channels: async (interaction) => {
      const embed = new EmbedBuilder()
        .setTitle('Каналы')
        .setDescription('бебебебебебе')
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },
  },
};

export default info;
