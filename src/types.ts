import {
  ChatInputCommandInteraction,
  Collection,
} from 'discord.js';

export interface ActionDefinition {
  name: string;
  description: string;
  template: string;
  selfTemplate?: string;
  requireTarget?: boolean;
  noTarget?: boolean;
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
  description: string;
  executeSlash?: (
    interaction: ChatInputCommandInteraction
  ) => Promise<void> | void;
}

declare module 'discord.js' {
  interface Client {
    rpActions: Collection<string, ActionDefinition>;
    utility: Collection<string, UtilityCommand>;
    cooldowns: import('./lib/cooldowns.js').CooldownManager;
  }
}

export type BotClient = import('discord.js').Client;
