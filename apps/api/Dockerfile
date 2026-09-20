FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY . .
RUN corepack enable && pnpm install --no-frozen-lockfile

# config tsconfig outDir=./dist — build then place JS in src/ to match "main": "./src/index.js"
RUN cd packages/config && npx tsc && cp -r dist/. src/

# shared tsconfig outDir=./dist — same approach
RUN cd packages/shared && npx tsc && cp -r dist/. src/

# Generate Prisma client (must come before writing database package JS)
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# database package has no tsconfig — it only re-exports @prisma/client.
# Write the two compiled CJS files directly (they're trivial wrappers):
COPY scripts/build-packages.sh /build-packages.sh
RUN chmod +x /build-packages.sh && /build-packages.sh

# Build the API app
RUN pnpm --filter @ultimate-leads/api build

# ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat openssl

# Compiled API output
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json

# All hoisted node_modules including Prisma generated client
COPY --from=builder /app/node_modules ./node_modules

# Prisma schema for runtime
COPY --from=builder /app/packages/database/prisma ./prisma

# Remove broken pnpm workspace symlinks before copying real package folders
RUN rm -rf ./node_modules/@ultimate-leads

# Copy workspace packages directly both to /app/packages and /app/node_modules/@ultimate-leads
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/packages/config   ./node_modules/@ultimate-leads/config
COPY --from=builder /app/packages/database ./node_modules/@ultimate-leads/database
COPY --from=builder /app/packages/shared   ./node_modules/@ultimate-leads/shared

EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1
CMD ["sh", "-c", "if [ -f dist/apps/api/src/main.js ]; then node dist/apps/api/src/main.js; elif [ -f dist/main.js ]; then node dist/main.js; else node $(find dist -name main.js | head -n 1); fi"]

