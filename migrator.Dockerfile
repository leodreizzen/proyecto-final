FROM node:20-alpine AS base
RUN apk update && apk add --no-cache openssl
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

FROM base AS prepare
COPY . .
RUN pnpm add -g turbo@^2.5.8
RUN pnpm exec turbo prune @repo/db --docker

FROM base AS migrator
WORKDIR /app

COPY --from=prepare /app/out/json/ .

RUN pnpm install --frozen-lockfile

COPY --from=prepare /app/out/full/ .

WORKDIR /app/packages/db

CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]