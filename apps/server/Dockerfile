FROM node:20-slim AS base
RUN corepack enable \
  && apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ iputils-ping \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Installing from the repo root is required: `server` depends on the
# `@repo/*` workspace packages and a single root pnpm-lock.yaml.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm install --frozen-lockfile

FROM deps AS development
WORKDIR /app/apps/server
EXPOSE 3000
CMD ["pnpm", "run", "dev"]

FROM deps AS build
RUN pnpm --filter server run build
# `pnpm deploy` produces a self-contained directory with only server's
# production dependencies resolved out of the shared workspace lockfile.
# --legacy: pnpm v10 defaults to injected workspace deps, which this repo
# doesn't opt into (server has no runtime dependency on the @repo/* packages).
RUN pnpm --filter server deploy --prod --legacy /app/deploy/server

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app/apps/server
COPY --from=build /app/deploy/server .

EXPOSE 3000
CMD ["node", "dist/Main.js"]
