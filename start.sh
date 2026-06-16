#!/bin/bash

# ApplyMate - Start all services

echo "🚀 Starting ApplyMate..."

# Start Docker containers
echo "📦 Starting Docker containers..."
docker start applymate-db applymate-redis

# Start backend
echo "🔧 Starting Backend..."
cd /home/hairzee/prods/applymate/backend
PYTHONPATH=/home/hairzee/prods/applymate/backend python -m uvicorn app.main:app --port 8000 &
BACKEND_PID=$!

# Wait for backend
sleep 3

# Start sidecar
echo "🚗 Starting Sidecar..."
cd /home/hairzee/prods/applymate/sidecar
npm run dev &
SIDECAR_PID=$!

# Start frontend
echo "🎨 Starting Frontend..."
cd /home/hairzee/prods/applymate/frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ All services started!"
echo ""
echo "   Sidecar:  http://localhost:4197"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID $SIDECAR_PID 2>/dev/null; exit" INT TERM

wait
