# server-monitor

Monorepo (pnpm + Turborepo) para monitorear el estado de servidores/URLs.

- [`apps/server`](./apps/server) — API (Effect-ts, Postgres, BullMQ/Redis). Ver su [README](./apps/server/README.md) y [CONTEXT.md](./apps/server/CONTEXT.md) para el dominio.
- [`apps/web`](./apps/web) — frontend (React + Vite). Ver su [README](./apps/web/README.md).

## Desarrollo

```sh
pnpm install
pnpm dev     # corre server + web en paralelo vía Turborepo
```

O con Docker (Postgres + Valkey + server):

```sh
docker compose up
```
