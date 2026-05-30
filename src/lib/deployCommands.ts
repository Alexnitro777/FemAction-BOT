import {
  REST,
  Routes,
  SlashCommandBuilder,
  type RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js';
import { config } from '../config.js';
import { loadActions } from './loadActions.js';

/**
 * Регистрирует слеш-команды в Discord.
 * Если задан GUILD_ID — регистрирует на сервере (мгновенно, для разработки),
 * иначе глобально (обновляется до часа).
 */
async function deploy() {
  const { actions } = await loadActions();
  const body: RESTPostAPIApplicationCommandsJSONBody[] = [];

  for (const action of actions.values()) {
    const builder = new SlashCommandBuilder()
      .setName(action.name)
      .setDescription(action.description)
      .addUserOption((opt) =>
        opt
          .setName('цель')
          .setDescription('Кого затронуть действием')
          .setRequired(action.requireTarget ?? false)
      );
    body.push(builder.toJSON());
  }

  // Утилитарная команда help.
  body.push(
    new SlashCommandBuilder()
      .setName('help')
      .setDescription('Список доступных РП-команд')
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

deploy();
