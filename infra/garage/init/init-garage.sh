#!/bin/sh
set -Eeuo pipefail
trap 'echo "Error in line $LINENO"; exit 1' ERR

RPC_HOST="${GARAGE_RPC_HOST:-garage:3901}"
ADMIN_URL="${GARAGE_ADMIN_URL:-http://garage:3903}"
KEY_NAME="app-key-prod"
NODE_CAPACITY="${NODE_CAPACITY:-1G}"

ADMIN_TIMEOUT="${ADMIN_TIMEOUT:-10}"
RPC_TIMEOUT="${RPC_TIMEOUT:-10}"

if [ -z "$GARAGE_ADMIN_TOKEN" ]; then
    echo "Error: GARAGE_ADMIN_TOKEN env var is missing."
    exit 1
fi

if [ -z "$S3_ACCESS_KEY" ] || [ -z "$S3_SECRET_KEY" ]; then
    echo "Error: S3_ACCESS_KEY and S3_SECRET_KEY env vars are required."
    exit 1
fi

BUCKETS_TO_CREATE="
    public-assets:public
    internal-assets:private
"

echo "Waiting for Admin API at $ADMIN_URL..."
START=$(date +%s)
LAST_CURL_ERROR=""

# Create a temp file to capture curl stderr to keep the loop clean
ERR_FILE=$(mktemp)

while true; do
  # We use -w %{http_code} to get the status code as stdout.
  # We send the body to /dev/null (-o /dev/null).
  # We send stderr to a temp file to print it if needed.
  # We remove -f so curl doesn't exit on 503 errors.
  HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $GARAGE_ADMIN_TOKEN" \
    "$ADMIN_URL/health" 2> "$ERR_FILE" || echo "000")

  CURL_ERR=$(cat "$ERR_FILE")

  # Accept 200 (Ready) OR 503 (Service running but not configured yet)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "503" ]; then
      echo "Admin API responded with HTTP $HTTP_CODE. Proceeding..."
      break
  fi

  LAST_CURL_ERROR="HTTP Code: $HTTP_CODE. Error: $CURL_ERR"

  NOW=$(date +%s)
  ELAPSED=$((NOW - START))

  if [ "$ELAPSED" -ge "$ADMIN_TIMEOUT" ]; then
      echo "Timeout: Admin API didn't respond correctly after ${ADMIN_TIMEOUT}s"
      echo "Last curl error details: $LAST_CURL_ERROR"
      rm -f "$ERR_FILE"
      exit 1
  fi
  sleep 2
done
rm -f "$ERR_FILE"

echo "Admin API is ready."

echo "Fetching Node ID..."
# Capture output, if curl fails (non-zero exit code), print the error and exit
if ! RESPONSE=$(curl -fsS -H "Authorization: Bearer $GARAGE_ADMIN_TOKEN" "$ADMIN_URL/v2/GetNodeInfo?node=self" 2>&1); then
    echo "Failed to fetch Node ID. Curl error:"
    echo "$RESPONSE"
    exit 1
fi

NODE_ID=$(echo "$RESPONSE" | jq -r '.success[] | .nodeId' | head -n 1)

if [ -z "$NODE_ID" ] || [ "$NODE_ID" = "null" ]; then
    echo "Failed to retrieve Node ID. JSON Response from Admin API:"
    echo "---------------------------------------------------"
    echo "$RESPONSE"
    echo "---------------------------------------------------"
    exit 1
fi

echo "Node ID Found: $NODE_ID"

RPC_ARG="$NODE_ID@$RPC_HOST"
echo "Connecting via RPC ($RPC_ARG)..."

START=$(date +%s)
while ! garage -h "$RPC_ARG" status > /dev/null 2>&1; do
  NOW=$(date +%s)
  ELAPSED=$((NOW - START))
  if [ "$ELAPSED" -ge "$RPC_TIMEOUT" ]; then
      echo "Timeout: RPC didn't respond after ${RPC_TIMEOUT}s"
      exit 1
  fi
  echo "Waiting for RPC connection..."
  sleep 2
done

echo "RPC connection is ready."

# ======= Layout =======
STATUS_OUTPUT=$(garage -h $RPC_ARG status)
if echo "$STATUS_OUTPUT" | grep -q "NO ROLE ASSIGNED"; then
    echo "Configuring new node..."
    garage -h "$RPC_ARG" layout assign -z dc1 -c "$NODE_CAPACITY" "$NODE_ID"
    garage -h "$RPC_ARG" layout apply --version 1
fi

echo "Managing Access Keys..."

EXISTING_KEYS=$(garage -h $RPC_ARG key list 2>/dev/null | grep "^GK" | awk '{print $1}' || true)

for K in $EXISTING_KEYS; do
  if [ "$K" != "$S3_ACCESS_KEY" ]; then
     echo "Deleting unused/old key: $K"
     garage -h "$RPC_ARG" key delete "$K" --yes
  fi
done

if garage -h "$RPC_ARG" key list 2>/dev/null | grep -q "$S3_ACCESS_KEY"; then
    echo "Key $S3_ACCESS_KEY already exists. Skipping import."
else
    echo "Importing master key ($KEY_NAME)..."
    garage -h "$RPC_ARG" key import "$S3_ACCESS_KEY" "$S3_SECRET_KEY" -n "$KEY_NAME" --yes
fi

echo "Processing Buckets..."
IFS='
'
for DEF in $BUCKETS_TO_CREATE; do
    unset IFS
    NAME=$(echo "$DEF" | cut -d':' -f1 | tr -d ' ')
    TYPE=$(echo "$DEF" | cut -d':' -f2 | tr -d ' ')

    [ -z "$NAME" ] && continue

    if ! garage -h "$RPC_ARG" bucket list | grep -q "$NAME"; then
        echo "   -> Creating '$NAME'..."
        garage -h "$RPC_ARG" bucket create "$NAME"
    fi

    garage -h "$RPC_ARG" bucket allow "$NAME" --read --write --owner --key "$S3_ACCESS_KEY" > /dev/null

    if [ "$TYPE" = "public" ]; then
        echo "'$NAME': Enforcing PUBLIC"
        garage -h "$RPC_ARG" bucket website --allow "$NAME" > /dev/null
    else
        echo "'$NAME': Enforcing PRIVATE"
        garage -h "$RPC_ARG" bucket website --deny "$NAME" > /dev/null 2>&1 || true
    fi
done

echo "Configuration finished."