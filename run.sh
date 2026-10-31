#!/bin/bash

# Function to clean up background processes if the script is interrupted (Ctrl+C)
cleanup() {
    echo "Stopping frontend and backend..."
    kill "$FRONTEND_PID" "$BACKEND_PID" 2>/dev/null
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM to trigger the cleanup function
trap cleanup SIGINT SIGTERM

echo "Starting FastAPI Backend..."
cd backend || exit 1
# Run backend in the background and save its process ID (PID)
python3 -m uvicorn main:app --host 0.0.0.0 --port 8080 &
BACKEND_PID=$!

# Move back to root directory
cd ..

echo "Starting Frontend..."
cd client || exit 1
# Run frontend in the background and save its process ID (PID)
npm run dev &
FRONTEND_PID=$!

# Move back to root directory
cd ..

echo "Both processes running. Press Ctrl+C to stop both."

# Wait indefinitely so the script doesn't exit prematurely
wait
