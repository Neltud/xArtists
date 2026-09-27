# Scaffold — remplacer par image GPU + COLMAP compilé pour production labo
FROM node:20-alpine
WORKDIR /app
COPY package.json worker.mjs ./
RUN npm install --omit=dev 2>/dev/null || true
EXPOSE 8080
ENV PORT=8080
CMD ["node", "worker.mjs"]
