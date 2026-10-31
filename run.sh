#!/bin/bash
echo "Starting KILLCHAIN backend on port 8000..."
(cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

echo "Starting KILLCHAIN frontend on Vite dev server..."
(cd client && npm run dev) &
CLIENT_PID=$!

trap "kill $BACKEND_PID $CLIENT_PID" EXIT
wait

