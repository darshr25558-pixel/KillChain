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
PYTHON_BIN=python3
if [ -x venv/bin/python ]; then
    PYTHON_BIN=venv/bin/python
fi
# Run backend in the background and save its process ID (PID)
"$PYTHON_BIN" -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting KILLCHAIN frontend on Vite dev server..."
(cd client && npm run dev) &
CLIENT_PID=$!

trap "kill $BACKEND_PID $CLIENT_PID" EXIT
wait

