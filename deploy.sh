#!/bin/bash

# Define variables
PM2_NAME="Kino Manager BE"
BRANCH="master"

# Update the repository
echo "Pulling latest changes from $BRANCH branch..."
git pull origin "$BRANCH"

# Install dependencies
echo "Installing dependencies..."
pnpm i

# Apply database migrations
echo "Applying Prisma migrations..."
pnpx prisma migrate deploy

# Generate Prisma client
echo "Generating Prisma client..."
pnpx prisma generate

# Build the project
echo "Building the project..."
pnpm build

# Restart the application
echo "Restarting PM2 process: $PM2_NAME..."
pm2 restart "$PM2_NAME"

echo "Deployment completed successfully!"
