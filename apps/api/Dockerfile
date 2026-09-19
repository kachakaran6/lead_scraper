FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY . .
RUN corepack enable && pnpm install --no-frozen-lockfile
# Packages (config/shared/database) have pre-compiled .js in src/ already committed.
# Only run prisma generate then build the API.
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN pnpm --filter @ultimate-leads/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat openssl

# Copy compiled API output
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json

# Copy root node_modules (pnpm hoisted deps)
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema for migrations and generated client
COPY --from=builder /app/packages/database/prisma ./prisma

# Copy workspace packages (already have compiled src/*.js in git)
COPY --from=builder /app/packages ./packages

# pnpm uses symlinks for workspace packages; Docker COPY breaks them.
# Restore symlinks explicitly so Node resolves @ultimate-leads/* correctly.
RUN mkdir -p node_modules/@ultimate-leads && \
    ln -sfn /app/packages/config      node_modules/@ultimate-leads/config && \
    ln -sfn /app/packages/database    node_modules/@ultimate-leads/database && \
    ln -sfn /app/packages/shared      node_modules/@ultimate-leads/shared

EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1
CMD ["sh", "-c", "if [ -f dist/apps/api/src/main.js ]; then node dist/apps/api/src/main.js; elif [ -f dist/main.js ]; then node dist/main.js; else node $(find dist -name main.js | head -n 1); fi"]

