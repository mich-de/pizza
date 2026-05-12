FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY server/ ./server/

# Install nginx
RUN apk add --no-cache nginx

# Copy nginx config (Alpine uses /etc/nginx/http.d/)
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create required directories
RUN mkdir -p server/private server/logs /run/nginx \
  && touch server/private/admins.json \
  && echo '[]' > server/private/admins.json \
  && chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node server/healthcheck.cjs

# Start node in background, then nginx in foreground (so container stays alive)
CMD ["sh", "-c", "node server/index.js & exec nginx -g 'daemon off;'"]
