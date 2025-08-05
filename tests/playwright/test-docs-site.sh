#!/bin/bash

# Start the Next.js dev server in the background
echo "Starting Next.js dev server..."
cd docs-site && npm run dev &
SERVER_PID=$!

# Wait for the server to start
echo "Waiting for server to start..."
sleep 5

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "Server failed to start"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

# Run the Playwright test
echo "Running Playwright tests..."
cd .. && npx playwright test tests/playwright/docs-site.spec.ts --reporter=list

# Capture the test exit code
TEST_EXIT_CODE=$?

# Kill the server
echo "Stopping server..."
kill $SERVER_PID 2>/dev/null

# Exit with the test exit code
exit $TEST_EXIT_CODE