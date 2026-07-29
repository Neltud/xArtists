# xArtists frontend — multi-stage production image
FROM node:20-alpine AS build
WORKDIR /app

# Prefer monorepo root if present; fall back to apps/frontend
COPY package.json package-lock.json* pnpm-workspace.yaml* ./
COPY apps/frontend/package.json ./apps/frontend/
RUN npm install --legacy-peer-deps || true

COPY apps/frontend ./apps/frontend
COPY data ./data
WORKDIR /app/apps/frontend
RUN npm install --legacy-peer-deps && npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html/xArtists
# SPA fallback
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  location /xArtists/ {\n    try_files $uri $uri/ /xArtists/index.html;\n  }\n  location / {\n    return 302 /xArtists/;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://127.0.0.1/xArtists/ || exit 1
