import {
  ChatInputCommandInteraction,
  Collection,
  Message,
} from 'discord.js';

/**
 * Определение одного РП-действия (поцеловать, обнять, буп и т.д.).
 * Каждый файл в src/actions экспортирует такой объект по умолчанию.
 * Из него автоматически строятся и текстовая, и слеш-команда.
 */
export interface ActionDefinition {
  /** Имя команды. Латиницей, в нижнем регистре — это имя слеш-команды. */
  name: string;

  /** Имя для текстовой команды (может быть кириллицей, напр. "поцеловать"). */
  textName: string;

  /** Альтернативные имена для текстовой команды (напр. "поцелуй", "kiss"). */
  aliases?: string[];

  /** Описание для слеш-команды (видно в Discord). */
  description: string;

  /**
   * Шаблон ответа. {author} — автор команды, {target} — упомянутый пользователь.
   * Используется, когда цель указана.
   */
  template: string;

  /**
   * Шаблон, когда цель не указана (действие "в пустоту" или над собой).
   * Если не задан, используется требование указать цель.
   */
  selfTemplate?: string;

  /** Требовать ли обязательного указания цели. По умолчанию false. */
  requireTarget?: boolean;

  /** Список URL гифок/картинок — выбирается случайная. */
  gifs?: string[];

  /** Цвет эмбеда в hex (напр. 0xff7fa5). По умолчанию розовый. */
  color?: number;
}

/** Команда, не относящаяся к РП (help, ping и т.п.). */
export interface UtilityCommand {
  name: string;
  textName: string;
  aliases?: string[];
  description: string;
  /** Обработчик текстовой команды. */
  executeText?: (message: Message, args: string[]) => Promise<void> | void;
  /** Обработчик слеш-команды. */
  executeSlash?: (
    interaction: ChatInputCommandInteraction
  ) => Promise<void> | void;
}

/**
 * Дополняем встроенный Client коллекциями загруженных команд через
 * module augmentation — это идиоматичный для discord.js способ, не ломающий
 * приватные поля базового класса.
 */
declare module 'discord.js' {
  interface Client {
    rpActions: Collection<string, ActionDefinition>;
    /** Карта алиас/textName -> каноническое имя команды. */
    textIndex: Collection<string, string>;
    utility: Collection<string, UtilityCommand>;
  }
}

/** Псевдоним для читаемости там, где коллекции точно инициализированы. */
export type BotClient = import('discord.js').Client;
