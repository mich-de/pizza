# Gemini Memory Log - PizzaRadar Sorrento

## Project Overview
**PizzaRadar Sorrento** is a dashboard for monitoring and comparing Margherita pizza prices across 6 towns in the Sorrento Peninsula. It features a community feed, price proposals, and an admin panel for verification.

## Current State
- Repository cloned from `https://github.com/mich-de/pizza.git`.
- Project detected as a **Node.js (React + Express)** application.
- Frontend: React 19, Vite 8, Tailwind 4, React Router 7.
- Backend: Express 5, File-based JSON storage, Argon2, JWT, TOTP 2FA.
- Design: Brutalist aesthetics with Material Symbols.
- Infrastructure: Docker-ready with Nginx proxy.

## Context
- The project uses a monolithic backend in `server/index.js`.
- It uses file-based JSON storage instead of a traditional database.
- i18n is handled via a custom Context API.
- Security is a priority (CSRF, JWT rotation, 2FA, sanitization).

## Architectural Decisions
- **Backend-as-Proxy**: The backend serves as a proxy and data aggregator for JSON files.
- **Atomic Writes**: JSON file updates use a tmp-and-rename strategy to prevent corruption.
- **Strict SPA**: Frontend is a pure React SPA with lazy loading.

## Recent Actions
- Initialized `GEMINI.MD`, `TASKS.MD`, and `IMPLEMENTATION_PLAN.MD`.
- Fixed CORS error during login by allowing more local origins and improving diagnostic logging.
- Verified `ALLOWED_ORIGINS` environment variable usage.
