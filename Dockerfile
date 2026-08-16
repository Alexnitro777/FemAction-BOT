FROM node:24-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:24-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

CMD ["sh", "-c", "node dist/lib/clearGuildCommands.js; node dist/lib/deployCommands.js && node dist/index.js"]
