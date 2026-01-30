FROM node:24-alpine AS base
RUN apk add --no-cache python3 openssl
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
RUN apk add --no-cache build-base python3-dev py3-pip
COPY --from=prepare /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter worker

COPY --from=prepare /app/out/full/ .

WORKDIR /app/apps/worker
RUN python3 python_setup.py
RUN find .venv -type d -name "__pycache__" -exec rm -rf {} +

WORKDIR /app
RUN pnpm add -g turbo@^2.5.8
RUN turbo run build

FROM base AS prod_deps
RUN apk add --no-cache jq

COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN jq ' \
  ._bundlerConfig.external as $list | \
  .dependencies |= with_entries(select(.key as $k | $list | index($k))) \
  ' apps/worker/package.json > apps/worker/package.json.tmp && \
  mv apps/worker/package.json.tmp apps/worker/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install \
    --prod \
    --no-frozen-lockfile \
    --filter=worker \
    --config.node-linker=hoisted \
    --ignore-scripts=false

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker
USER worker

COPY --from=prod_deps --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/apps/worker/src/parser/pdfparse.py ./src/parser/pdfparse.py

COPY --from=builder --chown=worker:nodejs /app/apps/worker/build .
COPY --from=builder --chown=worker:nodejs /app/apps/worker/.venv ./.venv

CMD ["node", "worker.js"]