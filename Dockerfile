FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy source files individually to ensure cache invalidation
COPY src/ ./src/
COPY public/ ./public/
COPY server/ ./server/
COPY index.html vite.config.js ./

# Install dev deps needed for build (vite, tailwind, etc.)
RUN npm install

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install curl for healthcheck
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY server/ ./server/

RUN mkdir -p server/private server/logs \
  && touch server/private/admins.json \
  && echo '[]' > server/private/admins.json \
  && chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT}/health || exit 1

CMD ["node", "server/index.js"]
