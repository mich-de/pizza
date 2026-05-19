#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== PizzaRadar Sorrentum Unified Launcher ===${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[WARN] .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
fi

echo -e "${YELLOW}Cleaning up ports 5173, 5174, 5175, 3000...${NC}"
for port in 5173 5174 5175 3000; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    kill -9 $pid 2>/dev/null
  fi
done

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}"
echo "============================================="
echo "  Starting Unified Terminal Mode..."
echo "  Press CTRL+C to stop both servers."
echo ""
echo "  Frontend:  http://localhost:5173"
echo "  Admin:     http://localhost:5173/login"
echo "============================================="
echo -e "${NC}"

npm run dev:all
