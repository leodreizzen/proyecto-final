#!/bin/bash
set -e

if [ -n "$POSTGRES_SHADOW_DB" ]; then
    echo "Creating shadow database"

    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        CREATE DATABASE "$POSTGRES_SHADOW_DB";
        GRANT ALL PRIVILEGES ON DATABASE "$POSTGRES_SHADOW_DB" TO "$POSTGRES_USER";
EOSQL
else
    echo "Variable POSTGRES_SHADOW_DB not defined. Omitting shadow DB."
fi