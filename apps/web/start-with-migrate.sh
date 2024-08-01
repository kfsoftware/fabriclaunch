#!/bin/bash

# Set environment variables (if needed)
export NODE_ENV=production

# Function to check if a command was successful
check_success() {
    if [ $? -ne 0 ]; then
        echo "Error: $1 failed"
        exit 1
    fi
}

# Run database migrations
echo "Running database migrations..."
npx drizzle-kit migrate
check_success "Database migration"

# Start the Next.js server
echo "Starting Next.js server..."
npm start
