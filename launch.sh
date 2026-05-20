#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== PizzaRadar Sorrento Unified Launcher ===${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[WARN] File .env non trovato. Copio da .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}[WARN] Modifica .env e cambia JWT_SECRET, ADMIN_PASSWORD prima del deploy!${NC}"
fi

echo -e "${YELLOW}Pulizia porte in uso...${NC}"
for port in 5173 5174 5175 3000 3001; do
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
