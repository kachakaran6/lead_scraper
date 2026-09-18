FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY . .
RUN corepack enable && pnpm install --no-frozen-lockfile
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN corepack enable && pnpm --filter @ultimate-leads/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat openssl
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/prisma ./prisma
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1
CMD ["node", "dist/main.js"]
