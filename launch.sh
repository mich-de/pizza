#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== PizzaRadar Sorrentum Launcher ===${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[WARN] .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}[WARN] Edit .env and change JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_PASSWORD before deploying!${NC}"
fi

echo -e "${YELLOW}Cleaning up ports 5173, 5174, 5175, 3000, 3001...${NC}"
for port in 5173 5174 5175 3000 3001; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo -e "${RED}Killing process on port $port (PID: $pid)${NC}"
    kill -9 $pid 2>/dev/null
  fi
done

pkill -f "node server/index.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install || exit 1
fi

echo -e "${GREEN}Starting frontend (Vite :5173) + backend (Express :3001)...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers.${NC}"
echo ""

trap 'echo -e "${RED}Stopping servers...${NC}"; trap - SIGINT SIGTERM; kill -- -$$ 2>/dev/null; exit 0' SIGINT SIGTERM

npm run server:dev &
SERVER_PID=$!

sleep 2

if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}Server failed to start. Check for errors above.${NC}"
    exit 1
fi

npm run dev &
VITE_PID=$!

sleep 2

if ! kill -0 $VITE_PID 2>/dev/null; then
    echo -e "${RED}Vite failed to start. Check for errors above.${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}Frontend:  http://localhost:5173${NC}"
echo -e "${GREEN}API:       http://localhost:3000/api/data/stitched${NC}"
echo -e "${GREEN}Health:    http://localhost:3000/health${NC}"
echo -e "${GREEN}Admin:     http://localhost:3000/login${NC}"
echo -e "${YELLOW}Username:  peninsula-ovserver${NC}"
echo -e "${YELLOW}Password:  PizzaAdmin2024!${NC}"
echo ""

wait $SERVER_PID $VITE_PID
