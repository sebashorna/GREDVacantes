FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY apps/shared/package.json ./apps/shared/package.json

RUN npm ci --include=dev

COPY apps ./apps

RUN npx prisma generate --schema apps/api/prisma/schema.prisma

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npx", "tsx", "apps/api/src/server.ts"]
