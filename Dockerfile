FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json vite.config.js index.html ./
RUN npm install

COPY src/ ./src/
COPY public/ ./public/

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    apk add --no-cache curl

# Use --chown to set permissions during copy, avoiding a heavy recursive chown later
COPY --chown=appuser:appgroup package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/public ./public
COPY --chown=appuser:appgroup server/ ./server/

# Ensure writeable directories exist and have correct permissions
RUN mkdir -p server/private server/logs && \
    chown -R appuser:appgroup /app/server/private /app/server/logs && \
    chmod -R 755 /app/server/private /app/server/logs

USER appuser

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/health || exit 1

CMD ["node", "server/index.js"]
