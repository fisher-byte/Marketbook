FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/api/package.json packages/api/package.json

RUN npm install -w @marketbook/api

COPY packages/api ./packages/api

ENV PORT=3000
EXPOSE 3000

CMD ["node", "packages/api/src/index.js"]
