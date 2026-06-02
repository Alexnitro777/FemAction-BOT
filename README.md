# FemAction-BOT

Discord-бот с РП-командами. Поддерживает и текстовые команды (`!обнять @user`),
и слеш-команды (`/обнять`). Каждое действие описывается одним файлом в
`src/actions`, из которого автоматически строятся обе формы команды.

## 1. Структура проекта

```
FemAction-BOT/
├── src/
│   ├── actions/        РП-действия (по файлу на команду: kiss, hug, pat, bite, boop, slap, lick, silly)
│   ├── commands/       Утилитарные команды (help)
│   ├── events/         Обработчики событий (messageCreate, interactionCreate)
│   ├── lib/            Загрузчик действий, построитель ответа, кулдауны, хранилище гифок, деплой команд
│   ├── config.ts       Чтение и валидация config.json
│   ├── types.ts        Интерфейсы ActionDefinition / UtilityCommand
│   └── index.ts        Точка входа
├── config.example.json Шаблон конфига (токен, prefix, гифки)
├── config.json         Реальный конфиг (не в git, монтируется в Docker как volume)
├── Dockerfile          Multi-stage сборка образа (node:24-slim)
├── docker-compose.yml  Описание сервиса femaction-bot
├── tsconfig.json       Настройки TypeScript
├── package.json        Зависимости и npm-скрипты
└── README.md
```

## 2. Быстрый старт с Docker

### 2.1. Предварительные требования

- Установленный Docker (вместе с Docker Compose).

Если Docker ещё не установлен, поставь его одной командой:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 2.2. Установка и запуск

1. **Клонируй репозиторий:**

   ```bash
   git clone https://github.com/Alexnitro777/FemAction-BOT.git
   cd FemAction-BOT
   ```

2. **Настрой конфиг:**

   ```bash
   cp config.example.json config.json
   ```

3. **Запусти бота:**

   ```bash
   docker compose up -d --build
   ```

   При старте контейнер автоматически регистрирует слеш-команды
   (`node dist/lib/deployCommands.js`) и запускает бота.

## 3. Управление контейнером

```bash
# Просмотр логов в реальном времени
docker compose logs -f

# Остановка бота
docker compose stop

# Запуск ранее собранного контейнера
docker compose start

# Перезапуск (например, после правки config.json)
docker compose restart

# Пересборка после изменений в коде
docker compose up -d --build

# Остановка и удаление контейнера
docker compose down
```

> `config.json` смонтирован в контейнер как volume. Правки гифок в `config.json`
> подхватываются «вживую» без перезапуска. Перезапуск нужен только при изменении
> секретов (`token`, `clientId`, `prefix`), а пересборка — при изменении кода
> или добавлении новых команд в `src/actions`.
