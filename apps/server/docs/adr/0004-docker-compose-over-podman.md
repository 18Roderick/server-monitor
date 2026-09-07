# Docker Compose is the supported deployment path; Podman Quadlets are dropped

**Status**: accepted

The repo carried two parallel, unmaintained deployment definitions: a `docker-compose.yml` with its `node` service commented out, and a `podman/` directory of Quadlet unit files that built from the same `Dockerfile` but required manually editing absolute paths into two of the files before use. Neither had been exercised since the monorepo conversion (both still assumed `server`'s own directory held `pnpm-lock.yaml`/`pnpm-workspace.yaml`, which now live at the repo root only). We decided Docker Compose is the one supported path: it has no manual-editing step, ships one file describing the whole stack, and is what the rest of the tooling (README, `.env` conventions) already assumed. The Podman Quadlet files are deleted rather than fixed alongside it — maintaining two deployment definitions for a single-developer project doubles the surface that goes stale for no current benefit; Podman can be reintroduced later from the Compose file (`podman-compose` reads the same format) if a rootless-container requirement actually shows up.

## Considered Options

- **Fix both Compose and Quadlets** — rejected: nothing in the project's current constraints (single maintainer, no rootless-container requirement) needs two deployment paths, and every change to the app's runtime shape (env vars, ports, volumes) would need to be kept in sync across both.
- **Keep only Podman** — rejected: Compose is the more widely known format, needs no path-editing step to install, and is already what the (now-fixed) monorepo `Dockerfile` was written against.

## Consequences

- `docker-compose.yml`/`docker-compose.override.yml` moved to the repo root, since the build context must be the workspace root (`server` depends on the `@repo/*` workspace packages and the single root `pnpm-lock.yaml`) — `dockerfile: apps/server/Dockerfile` points back into the package.
- `apps/server/Dockerfile` was rewritten for the monorepo: it installs from the root lockfile, builds with `pnpm --filter server run build`, then uses `pnpm deploy --prod --legacy` to produce a self-contained runtime directory (server's own `dist`/`drizzle` plus only its resolved production dependencies) — this needed `apps/server/package.json`'s new `"files": ["dist", "drizzle"]` field, since `pnpm deploy` otherwise falls back to `.gitignore` (which excludes `dist/`) to decide what ships.
- `apps/server/podman/` is deleted. If rootless containers are needed again, regenerate Quadlet units from the Compose file rather than hand-maintaining both.
