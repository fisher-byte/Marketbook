#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
DB_PATH=${DATABASE_PATH:-"$ROOT_DIR/data/marketbook.db"}
LOCAL_BACKUP_DIR=${LOCAL_BACKUP_DIR:-"$ROOT_DIR/backups/local"}
REMOTE_BASE=${DEPLOY_PATH:-""}
REMOTE_BACKUP_DIR=${REMOTE_BACKUP_DIR:-""}
if [ -z "$REMOTE_BACKUP_DIR" ] && [ -n "$REMOTE_BASE" ]; then
  REMOTE_BACKUP_DIR="$REMOTE_BASE/backups/server"
fi

TS=$(date +"%Y%m%d-%H%M%S")

mkdir -p "$LOCAL_BACKUP_DIR"

if [ -f "$DB_PATH" ]; then
  cp "$DB_PATH" "$LOCAL_BACKUP_DIR/marketbook-$TS.db"
  echo "Local backup saved: $LOCAL_BACKUP_DIR/marketbook-$TS.db"
else
  echo "Local DB not found: $DB_PATH"
fi

if [ -n "${SERVER:-}" ] && [ -n "${DEPLOY_PATH:-}" ] && [ -n "$REMOTE_BACKUP_DIR" ]; then
  ssh "$SERVER" "mkdir -p '$REMOTE_BACKUP_DIR' && if [ -f '$DEPLOY_PATH/data/marketbook.db' ]; then cp '$DEPLOY_PATH/data/marketbook.db' '$REMOTE_BACKUP_DIR/marketbook-$TS.db'; fi"
  echo "Remote backup saved: $SERVER:$REMOTE_BACKUP_DIR/marketbook-$TS.db"
else
  echo "Skip remote backup (SERVER/DEPLOY_PATH not set)"
fi
