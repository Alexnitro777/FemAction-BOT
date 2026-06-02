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
