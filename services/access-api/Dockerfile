# Standalone Access API image for an operator-managed host (OVH or equivalent).
# The existing shared root Dockerfile/Render deployment is unchanged.
FROM node:22-alpine
RUN apk add --no-cache python3

ENV NODE_ENV=production PORT=8787
WORKDIR /app/services/access-api

COPY --chown=node:node services/access-api/package.json services/access-api/package-lock.json ./
# Locked and reproducible: never silently fall back to npm install in production.
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

COPY --chown=node:node services/access-api/src ./src
COPY --chown=node:node packages/core/src/xorusAnalysisContract.mjs /app/packages/core/src/xorusAnalysisContract.mjs
COPY --chown=node:node lia/chorus/__init__.py lia/chorus/catalog.py lia/chorus/swarm.py /app/lia/chorus/
COPY --chown=node:node lia/xorus/__init__.py lia/xorus/swarm.py lia/xorus/decision_agent.py lia/xorus/analysis_report.py lia/xorus/analysis_cycle.py /app/lia/xorus/
# Manual runbooks only; nothing performs a migration at startup.
COPY --chown=node:node services/access-api/migrations ./migrations
COPY --chown=node:node services/access-api/scripts ./scripts

USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://127.0.0.1:8787/health | grep -q '"service":"access-api"' || exit 1
CMD ["node", "src/server.mjs"]
