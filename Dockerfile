# tSeca Control Panel - Dockerfile

FROM node:20-alpine AS base

WORKDIR /app

# Dependências de runtime para healthcheck
RUN apk add --no-cache curl

# Copiar manifests e instalar somente prod deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copiar código
COPY . .

ENV NODE_ENV=production \
    PORT=3030

EXPOSE 3030

# Healthcheck no endpoint /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:3030/health || exit 1

CMD ["node", "server.js"]


