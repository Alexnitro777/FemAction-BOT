# FemAction-BOT

Discord-бот с РП-командами. Поддерживает и текстовые команды (`!обнять @user`),
и слеш-команды (`/hug`). Каждое действие описывается одним файлом в
`src/actions`, из которого автоматически строятся обе формы команды.

## Быстрый старт с Docker

### Предварительные требования

- [Docker](https://www.docker.com/get-started) и Docker Compose
- Discord бот токен (см. раздел "Настройка бота в Discord")

### Установка и запуск

1. **Клонируй репозиторий:**
   ```bash
   git clone <your-repo-url>
   cd FemAction-BOT
   ```

2. **Настрой переменные окружения:**
   ```bash
   cp .env.example .env
   ```
   
   Отредактируй `.env` и заполни:
   - `DISCORD_TOKEN` — токен бота
   - `CLIENT_ID` — Application ID
   - `GUILD_ID` — ID тестового сервера (опционально)
   - `PREFIX` — префикс текстовых команд (по умолчанию `!`)

3. **Зарегистрируй слеш-команды:**
   ```bash
   docker compose run --rm femaction-bot npm run deploy:prod
   ```

4. **Запусти бота:**
   ```bash
   docker compose up -d
   ```

### Управление контейнером

```bash
# Просмотр логов
docker compose logs -f

# Остановка бота
docker compose down

# Перезапуск бота
docker compose restart

# Пересборка после изменений в коде
docker compose up -d --build

# Остановка и удаление контейнера
docker compose down -v
```

## Настройка бота в Discord

1. Создай приложение и бота в [Discord Developer Portal](https://discord.com/developers/applications).
2. На вкладке **Bot** включи **Message Content Intent** (нужен для текстовых команд).
3. Скопируй **Token** (это будет `DISCORD_TOKEN`).
4. На вкладке **OAuth2** скопируй **Application ID** (это будет `CLIENT_ID`).
5. Пригласи бота на сервер:
   - Перейди в **OAuth2 → URL Generator**
   - Выбери scope: `bot` и `applications.commands`
   - Выбери права: `Send Messages`, `Embed Links`, `Read Message History`
   - Скопируй сгенерированную ссылку и открой в браузере

## Как добавить новую РП-команду

1. Создай файл в `src/actions`, например `src/actions/slap.ts`:

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

2. Зарегистрируй новую команду:
   ```bash
   docker compose run --rm femaction-bot npm run deploy:prod
   ```

3. Перезапусти бота:
   ```bash
   docker compose restart
   ```

Плейсхолдеры в шаблонах: `{author}` — автор, `{target}` — упомянутый пользователь.

## Разработка без Docker

Если хочешь разрабатывать локально без Docker:

```bash
# Установка зависимостей
npm install

# Разработка с автоперезапуском
npm run dev

# Регистрация команд
npm run deploy

# Продакшн сборка
npm run build
npm start
```

## Структура проекта

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

## Troubleshooting

### Бот не отвечает на команды
- Проверь, что **Message Content Intent** включен в Discord Developer Portal
- Убедись, что бот имеет права на отправку сообщений в канале
- Проверь логи: `docker compose logs -f`

### Слеш-команды не появляются
- Запусти регистрацию команд: `docker compose run --rm femaction-bot npm run deploy:prod`
- Если указан `GUILD_ID`, команды появятся мгновенно только на этом сервере
- Без `GUILD_ID` команды регистрируются глобально (может занять до 1 часа)

### Ошибка при запуске контейнера
- Проверь, что `.env` файл существует и заполнен
- Убедись, что Docker запущен
- Проверь логи: `docker compose logs`
