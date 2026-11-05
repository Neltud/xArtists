# xArtists shared Render image: preserves the public Nginx SPA and also
# bundles Access API for the dedicated xartists-access-api Render service.
# XARTISTS_ROLE=api is set ONLY on xartists-access-api via the Render connector.
# Other services safely default to the original frontend behavior.
FROM node:20-alpine AS build
WORKDIR /app

# Keep existing frontend build behavior unchanged.
COPY package.json package-lock.json* pnpm-workspace.yaml* ./
COPY apps/frontend/package.json ./apps/frontend/
RUN npm install --legacy-peer-deps || true

COPY apps/frontend ./apps/frontend
COPY data ./data
WORKDIR /app/apps/frontend
RUN npm install --legacy-peer-deps && npm run build

# Production API dependencies in a separate stage. No tokens, PATs or
# production database credentials enter the image at build time.
FROM node:20-alpine AS api
WORKDIR /opt/xartists/access-api
COPY services/access-api/package.json services/access-api/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY services/access-api/src ./src
# Bundle the operator-only read-only diagnostic; do not run it at startup.
COPY services/access-api/scripts/check-mint-store.mjs ./scripts/check-mint-store.mjs

# Preserve nginx:1.27-alpine as the final image to avoid altering the
# public frontend's Nginx routing or layout.
FROM nginx:1.27-alpine
RUN apk add --no-cache nodejs \
    && node -e "if (Number(process.versions.node.split('.')[0]) < 20) process.exit(1)"
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html/xArtists
COPY --from=api /opt/xartists/access-api /opt/xartists/access-api
COPY ops/write-render-build-info.mjs /usr/local/lib/xartists/write-render-build-info.mjs
COPY ops/render-service-entrypoint.sh /usr/local/bin/xartists-entrypoint
RUN chmod 755 /usr/local/bin/xartists-entrypoint

# Existing SPA fallback, unchanged.
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  # The build identity is a real JSON file, never a successful SPA fallback.\n  location = /xArtists/build-info.json {\n    add_header Cache-Control "no-store" always;\n    try_files $uri =404;\n  }\n  location /xArtists/ {\n    try_files $uri $uri/ /xArtists/index.html;\n  }\n  location / {\n    return 302 /xArtists/;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD if [ "${XARTISTS_ROLE:-frontend}" = "api" ]; then \
        wget -qO- "http://127.0.0.1:${PORT:-8787}/health" | grep -q '"service":"access-api"'; \
      else \
        wget -qO- http://127.0.0.1/xArtists/ > /dev/null; \
      fi
ENTRYPOINT ["/usr/local/bin/xartists-entrypoint"]
