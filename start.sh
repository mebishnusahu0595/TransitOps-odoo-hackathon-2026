#!/bin/bash

# Terminate all background processes on exit
trap "kill 0" EXIT

echo "🚀 Starting TransitOps ERP Suite..."

# 1. Start backend server
echo "📦 Booting FastAPI Backend on http://localhost:8000..."
cd backend
source venv/bin/activate
PYTHONPATH=. uvicorn app.main:app --reload --port 8000 &
cd ..

# Wait 2 seconds for backend to start up
sleep 2

# 2. Start frontend dev server
echo "🎨 Booting Vite React Frontend on http://localhost:5173..."
cd frontend
npm run dev &
cd ..

# Keep script running
wait
