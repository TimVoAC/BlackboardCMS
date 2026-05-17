#!/bin/sh
set -e

echo "Waiting for database migrations..."
npx prisma migrate deploy

if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database..."
  npm run db:seed
fi

echo "Starting CampusBoard web server..."
exec npm run start
