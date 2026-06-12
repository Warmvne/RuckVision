#!/usr/bin/env bash
set -e

echo "=== Rugby Analyst ==="

# Backend
cd backend
if [ ! -d ".venv" ]; then
  echo "[1/4] Création de l'environnement virtuel Python..."
  python -m venv .venv
fi

echo "[2/4] Activation + install des dépendances Python..."
source .venv/Scripts/activate 2>/dev/null || source .venv/bin/activate
pip install -q -r requirements.txt

mkdir -p ../data/videos ../data/hls ../data/thumbnails ../models

echo "[3/4] Démarrage du backend (port 8000)..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
cd ../frontend
echo "[4/4] Démarrage du frontend (port 5173)..."
npm install --silent
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Backend  : http://localhost:8000"
echo "  Frontend : http://localhost:5173"
echo "  API docs : http://localhost:8000/docs"
echo ""
echo "Ctrl+C pour arrêter."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT
wait
