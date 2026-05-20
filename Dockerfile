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

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY server/ ./server/

RUN mkdir -p server/private server/logs && \
  chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/health || exit 1

CMD ["node", "server/index.js"]
