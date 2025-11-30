FROM node:24-alpine AS base
RUN apk update
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

FROM base AS prepare
RUN pnpm add -g turbo@^2.5.8
COPY . .
# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN pnpm exec turbo prune web --docker

FROM base AS builder
# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .

RUN pnpm install

# Build the project
COPY --from=prepare /app/out/full/ .

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM
RUN pnpm add -g turbo@^2.5.8
RUN turbo run build

FROM node:24-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
CMD ["node", "apps/web/server.js"]