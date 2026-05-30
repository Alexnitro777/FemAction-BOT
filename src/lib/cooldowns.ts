import { Collection } from 'discord.js';

/**
 * Система кулдаунов для команд.
 * Хранит Map<guildId, Map<commandName, timestamp>>
 */
export class CooldownManager {
  private cooldowns: Collection<string, Collection<string, number>>;
  private readonly cooldownTime: number;

  constructor(cooldownSeconds: number = 20) {
    this.cooldowns = new Collection();
    this.cooldownTime = cooldownSeconds * 1000; // Конвертируем в миллисекунды
  }

  /**
   * Проверяет, находится ли команда на кулдауне для данного сервера.
   * @returns Оставшееся время в секундах, или 0 если кулдаун истёк
   */
  check(guildId: string, commandName: string): number {
    const guildCooldowns = this.cooldowns.get(guildId);
    if (!guildCooldowns) return 0;

    const lastUsed = guildCooldowns.get(commandName);
    if (!lastUsed) return 0;

    const now = Date.now();
    const elapsed = now - lastUsed;

    if (elapsed >= this.cooldownTime) {
      guildCooldowns.delete(commandName);
      return 0;
    }

    return Math.ceil((this.cooldownTime - elapsed) / 1000);
  }

  /**
   * Устанавливает кулдаун для команды на сервере.
   */
  set(guildId: string, commandName: string): void {
    let guildCooldowns = this.cooldowns.get(guildId);

    if (!guildCooldowns) {
      guildCooldowns = new Collection();
      this.cooldowns.set(guildId, guildCooldowns);
    }

    guildCooldowns.set(commandName, Date.now());
  }

  /**
   * Очищает устаревшие кулдауны (опционально, для экономии памяти).
   */
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
