# Standalone Access API image for an operator-managed host (OVH or equivalent).
# The existing shared root Dockerfile/Render deployment is unchanged.
FROM node:22-alpine

ENV NODE_ENV=production PORT=8787
WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./
# Locked and reproducible: never silently fall back to npm install in production.
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

COPY --chown=node:node src ./src
# Manual runbooks only; nothing performs a migration at startup.
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node scripts ./scripts

USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://127.0.0.1:8787/health | grep -q '"service":"access-api"' || exit 1
CMD ["node", "src/server.mjs"]
