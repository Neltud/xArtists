# xArtists MultiversX catalog indexer — Akash-ready
FROM node:20-alpine
WORKDIR /app
COPY worker.example.mjs ./worker.mjs
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
USER node
CMD ["node", "worker.mjs"]
