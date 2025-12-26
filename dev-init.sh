#!/bin/sh
set -e # Si algún comando tira error (exit code != 0), el script muere aquí mismo.

cd /app
echo "Installing dependencies..."
pnpm install

cd apps/worker
echo "Setting up Python environment..."
python3 python_setup.py


cd /app/packages/db

DIFF_OUTPUT=$(pnpm exec prisma migrate diff \
  --from-schema prisma/schema.prisma \
  --to-migrations prisma/migrations/ \
  --config prisma.config.ts \
  --script)

# Due to a prisma bug, we need to filter out some known non-meaningful changes
CLEAN_OUTPUT=$(echo "$DIFF_OUTPUT" \
  | grep -vF -- "-- CreateSchema" \
  | grep -vF 'CREATE SCHEMA IF NOT EXISTS "public";' \
  | sed '/^[[:space:]]*$/d')

if [ -n "$CLEAN_OUTPUT" ]; then
    echo "Error: Schema drift detected. The Prisma schema has been modified."
    echo "Changes detected:"
    echo "$CLEAN_OUTPUT"
    echo "Run 'pnpm exec prisma migrate dev' inside this container to create and apply the necessary migrations."
    exit 1
else
    echo "No schema drift detected."
    echo "Running prisma migrate dev..."
    npx prisma migrate dev
fi

pnpm exec prisma generate --sql