# ActionBOT

Discord-бот с РП-командами. Поддерживает и текстовые команды (`!обнять @user`),
и слеш-команды (`/hug`). Каждое действие описывается одним файлом в
`src/actions`, из которого автоматически строятся обе формы команды.

## Установка

```powershell
npm install
```

## Настройка

1. Создай приложение и бота в [Discord Developer Portal](https://discord.com/developers/applications).
2. На вкладке **Bot** включи **Message Content Intent** (нужен для текстовых команд).
3. Скопируй `.env.example` в `.env` и заполни:
   - `DISCORD_TOKEN` — токен бота
   - `CLIENT_ID` — Application ID
   - `GUILD_ID` — ID тестового сервера (опционально, для мгновенной регистрации слеш-команд)
   - `PREFIX` — префикс текстовых команд (по умолчанию `!`)
4. Пригласи бота на сервер со scope `bot` + `applications.commands` и правом
   отправки сообщений/эмбедов.

## Запуск

```powershell
# Зарегистрировать слеш-команды (делать при добавлении/изменении команд)
npm run deploy

# Разработка с автоперезапуском
npm run dev

# Прод
npm run build
npm start
```

## Как добавить новую РП-команду

Создай файл в `src/actions`, например `src/actions/slap.ts`:

```ts
import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'slap',              // имя слеш-команды (латиница)
  textName: 'шлепнуть',      // имя текстовой команды
  aliases: ['slap', 'шлеп'], // доп. варианты вызова
  description: 'Шлёпнуть пользователя',
  template: '{author} шлёпнул(а) {target} 👋',
  selfTemplate: '{author} шлёпает воздух',
  gifs: ['https://media.tenor.com/....gif'],
};

export default action;
```

Затем `npm run deploy`, чтобы зарегистрировать слеш-команду, и перезапусти бота.
Текстовая команда подхватится автоматически.

Плейсхолдеры в шаблонах: `{author}` — автор, `{target}` — упомянутый пользователь.

## Структура

```
src/
  actions/        РП-действия (по файлу на команду)
  commands/       утилитарные команды (help и т.п.)
  events/         обработчики messageCreate и interactionCreate
  lib/            загрузчик действий, построитель ответа, деплой команд
  config.ts       чтение .env
  types.ts        интерфейсы ActionDefinition / UtilityCommand
  index.ts        точка входа
```
