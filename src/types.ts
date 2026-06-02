import {
  ChatInputCommandInteraction,
  Collection,
  Message,
} from 'discord.js';

export interface ActionDefinition {
  name: string;
  textName: string;
  aliases?: string[];
  description: string;
  template: string;
  selfTemplate?: string;
  requireTarget?: boolean;
  noTarget?: boolean;
  gifs?: string[];
  color?: number;
  customEmbed?: (authorMention: string, targetMention: string | null) => {
    title?: string;
    description: string;
    color: number;
    image?: string;
    footer?: string;
  };
}

export interface UtilityCommand {
  name: string;
  textName: string;
  aliases?: string[];
  description: string;
  executeText?: (message: Message, args: string[]) => Promise<void> | void;
  executeSlash?: (
    interaction: ChatInputCommandInteraction
  ) => Promise<void> | void;
}

declare module 'discord.js' {
  interface Client {
    rpActions: Collection<string, ActionDefinition>;
    textIndex: Collection<string, string>;
    utility: Collection<string, UtilityCommand>;
    cooldowns: import('./lib/cooldowns.js').CooldownManager;
  }
}

export type BotClient = import('discord.js').Client;
