export function formatCooldownTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} ${pluralize(seconds, 'секунда', 'секунды', 'секунд')}`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const minuteStr = `${minutes} ${pluralize(minutes, 'минута', 'минуты', 'минут')}`;

  if (remainingSeconds === 0) {
    return minuteStr;
  }

  const secondStr = `${remainingSeconds} ${pluralize(remainingSeconds, 'секунда', 'секунды', 'секунд')}`;
  return `${minuteStr} ${secondStr}`;
}

export function formatMessageCount(n: number): string {
  return `${n} ${pluralize(n, 'сообщение', 'сообщения', 'сообщений')}`;
}

export function formatVoiceDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds} ${pluralize(totalSeconds, 'секунда', 'секунды', 'секунд')}`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} ${pluralize(hours, 'час', 'часа', 'часов')}`);
  }
  if (minutes > 0 || hours === 0) {
    parts.push(`${minutes} ${pluralize(minutes, 'минута', 'минуты', 'минут')}`);
  }
  return parts.join(' ');
}

export function formatVoiceShort(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes} мин ${seconds} с` : `${minutes} мин`;
  }
  return `${seconds} с`;
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}
