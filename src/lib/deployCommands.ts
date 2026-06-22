import {
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  type RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js';
import { config } from '../config.js';
import { loadActions } from './loadActions.js';
import helpCommand from '../commands/help.js';
import statisticsCommand from '../commands/statistics.js';
import backfillCommand from '../commands/backfill.js';

async function deploy() {
  const { actions } = await loadActions();
  const body: RESTPostAPIApplicationCommandsJSONBody[] = [];

  for (const action of actions.values()) {
    const builder = new SlashCommandBuilder()
      .setName(action.name)
      .setDescription(action.description);

    if (!action.noTarget) {
      builder.addUserOption((opt) =>
        opt
          .setName('цель')
          .setDescription('Кого затронуть действием')
          .setRequired(action.requireTarget ?? false)
      );
    }

    body.push(builder.toJSON());
  }

  body.push(
    new SlashCommandBuilder()
      .setName(helpCommand.name)
      .setDescription(helpCommand.description)
      .toJSON()
  );

  body.push(
    new SlashCommandBuilder()
      .setName(statisticsCommand.name)
      .setDescription(statisticsCommand.description)
      .addUserOption((opt) =>
        opt
          .setName('цель')
          .setDescription('Чью статистику показать (по умолчанию — твою)')
          .setRequired(false)
      )
      .toJSON()
  );

  body.push(
    new SlashCommandBuilder()
      .setName(backfillCommand.name)
      .setDescription(backfillCommand.description)
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON()
  );

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    if (config.guildId) {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body }
      );
      console.log(
        `Зарегистрировано ${body.length} команд на сервере ${config.guildId}.`
      );
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), { body });
      console.log(
        `Зарегистрировано ${body.length} глобальных команд (обновление до часа).`
      );
    }
  } catch (err) {
    console.error('Ошибка регистрации команд:', err);
    process.exitCode = 1;
  }
}

deploy().catch((err) => {
  console.error('Ошибка деплоя:', err);
  process.exit(1);
});
