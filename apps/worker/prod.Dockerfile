FROM node:24-alpine AS base
RUN apk update && apk add --no-cache python3 py3-pip openssl
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm


FROM base AS prepare
RUN pnpm add -g turbo@^2.5.8
COPY . .
# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN pnpm exec turbo prune worker --docker


FROM base AS builder
# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile

RUN apk add --no-cache build-base python3-dev

COPY --from=prepare /app/out/full/ .

WORKDIR /app/apps/worker
RUN python3 python_setup.py
WORKDIR /app

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

WORKDIR /app

RUN pnpm add -g turbo@^2.5.8

RUN turbo run build

FROM builder AS prod_deps
RUN apk add --no-cache jq

# Remove non external dependencies from package.json
RUN jq ' \
  ._bundlerConfig.external as $list | \
  .dependencies |= with_entries(select(.key as $k | $list | index($k))) \
  ' apps/worker/package.json > apps/worker/package.json.tmp && \
  mv apps/worker/package.json.tmp apps/worker/package.json

RUN pnpm prune --prod
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker
USER worker

COPY --from=prod_deps --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=prod_deps --chown=worker:nodejs /app/apps/worker/node_modules ./apps/worker/node_modules

COPY --from=builder --chown=worker:nodejs /app/apps/worker/build ./apps/worker
COPY --from=builder --chown=worker:nodejs /app/apps/worker/.venv ./apps/worker/.venv

WORKDIR /app/apps/worker
CMD ["node", "worker.js"]