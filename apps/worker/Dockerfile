FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY . .
RUN corepack enable && pnpm install --no-frozen-lockfile
# Packages (config/shared/database) have pre-compiled .js in src/ already committed.
# Only run prisma generate (needed for Prisma client types) then build the worker.
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN pnpm --filter @ultimate-leads/worker build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat openssl

# Copy compiled worker output
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./package.json

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

CMD ["sh", "-c", "if [ -f dist/apps/worker/src/main.js ]; then node dist/apps/worker/src/main.js; elif [ -f dist/main.js ]; then node dist/main.js; else node $(find dist -name main.js | head -n 1); fi"]

