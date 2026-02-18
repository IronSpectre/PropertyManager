#!/bin/sh
set -e

DB_PATH="/app/data/prod.db"
MIGRATION_SQL="/app/prisma/migrations/20260218201424_init/migration.sql"
SEED_SQL="/app/prisma/seed.sql"

# Check if database has tables (not just if file exists)
TABLE_COUNT=$(sqlite3 "$DB_PATH" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='Property';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" = "0" ]; then
  echo "Initializing database..."
  sqlite3 "$DB_PATH" < "$MIGRATION_SQL"
  echo "Database tables created."

  echo "Seeding data..."
  sqlite3 "$DB_PATH" < "$SEED_SQL"
  echo "Seed data imported."

  # Copy baked-in uploads to the volume
  if [ -d /app/uploads-seed ]; then
    cp -rn /app/uploads-seed/* /app/public/uploads/ 2>/dev/null || true
    echo "Upload files copied."
  fi
else
  echo "Database already initialized ($(sqlite3 "$DB_PATH" "SELECT count(*) FROM Property;") properties found)."
fi

echo "Starting server..."
exec node server.js
