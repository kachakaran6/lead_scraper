# Ultimate Lead Engine

A self-hosted business data intelligence platform built for discovering, enriching, scoring, and converting leads.

## Architecture

```
┌─────────────────────────────────────────┐
│            React + Vite + shadcn/ui      │
└──────────────────┬──────────────────────┘
                   │
            ┌──────▼───────┐
            │    NestJS API │
            └──────┬───────┘
                   │
             ┌─────▼─────┐
             │   Redis   │
             └─────┬─────┘
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
   Discovery    Crawler     Analyzer
     Worker       Worker      Worker
      │            │            │
      └────────────┼────────────┘
                   ▼
              PostgreSQL
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Start everything (dev)
pnpm dev

# Build for production
pnpm build

# Docker
docker compose up -d
```

## Packages

- `apps/web` — React + Vite + TypeScript frontend with shadcn/ui
- `apps/api` — NestJS REST API server
- `apps/worker` — BullMQ background workers
- `packages/database` — Prisma schema & migrations
- `packages/shared` — Shared TypeScript types & utilities
- `packages/config` — Shared configuration helpers

## Phases

1. Monorepo foundation + database schema
2. Core API + auth
3. Queue + workers
4. Discovery providers
5. Website crawler + enrichment
6. Lead scoring + opportunity detection
7. Frontend dashboard
8. Infrastructure + monitoring

## License

MIT
