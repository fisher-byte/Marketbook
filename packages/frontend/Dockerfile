FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/frontend/package.json packages/frontend/package.json
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
RUN npm run build:frontend

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/frontend/package.json /app/packages/frontend/package.json
COPY --from=builder /app/packages/frontend/.next /app/packages/frontend/.next
COPY --from=builder /app/packages/frontend/public /app/packages/frontend/public
EXPOSE 3001
CMD ["npm", "run", "start", "-w", "@marketbook/frontend"]
