import {
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
} from 'discord.js';
import type { EmbedDefinition } from './embeds/types.js';

export interface ActionDefinition {
  name: string;
  description: string;
  template?: string;
  selfTemplate?: string;
  requireTarget?: boolean;
  noTarget?: boolean;
  color?: number;
  protectedTargets?: string[];
  protectedResponse?: {
    text: string;
    gif: string;
    color?: number;
  };
  onlyTargets?: string[];
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
  autocomplete?: (
    interaction: AutocompleteInteraction
  ) => Promise<void> | void;
}

declare module 'discord.js' {
  interface Client {
    rpActions: Collection<string, ActionDefinition>;
    utility: Collection<string, UtilityCommand>;
    embeds: Collection<string, EmbedDefinition>;
    buttonHandlers: Collection<
      string,
      (interaction: ButtonInteraction) => Promise<void> | void
    >;
    cooldowns: import('./lib/cooldowns.js').CooldownManager;
  }
}

export type BotClient = import('discord.js').Client;
