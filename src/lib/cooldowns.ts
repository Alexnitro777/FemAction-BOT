import { Collection } from 'discord.js';

export class CooldownManager {
  private cooldowns: Collection<string, Collection<string, number>>;
  private readonly cooldownTime: number;

  constructor(cooldownSeconds: number = 25) {
    this.cooldowns = new Collection();
    this.cooldownTime = cooldownSeconds * 1000;
  }

  check(guildId: string, commandName: string): { seconds: number } | null {
    const guildCooldowns = this.cooldowns.get(guildId);
    if (!guildCooldowns) return null;

    const lastUsed = guildCooldowns.get(commandName);
    if (!lastUsed) return null;

    const elapsed = Date.now() - lastUsed;

    if (elapsed >= this.cooldownTime) {
      guildCooldowns.delete(commandName);
      return null;
    }

    const remainingMs = this.cooldownTime - elapsed;
    return { seconds: Math.ceil(remainingMs / 1000) };
  }

  set(guildId: string, commandName: string): void {
    let guildCooldowns = this.cooldowns.get(guildId);

    if (!guildCooldowns) {
      guildCooldowns = new Collection();
      this.cooldowns.set(guildId, guildCooldowns);
    }

    guildCooldowns.set(commandName, Date.now());
  }

  clear(guildId: string, commandName: string): void {
    const guildCooldowns = this.cooldowns.get(guildId);
    if (!guildCooldowns) return;

    guildCooldowns.delete(commandName);

    if (guildCooldowns.size === 0) {
      this.cooldowns.delete(guildId);
    }
  }

  cleanup(): void {
    const now = Date.now();

    for (const [guildId, guildCooldowns] of this.cooldowns.entries()) {
      for (const [commandName, timestamp] of guildCooldowns.entries()) {
        if (now - timestamp >= this.cooldownTime) {
          guildCooldowns.delete(commandName);
        }
      }

      if (guildCooldowns.size === 0) {
        this.cooldowns.delete(guildId);
      }
    }
  }
}
