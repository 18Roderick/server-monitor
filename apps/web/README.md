# Web

Frontend de `server-monitor`: React 18 + Vite + TypeScript, TanStack Router/Query, componentes shadcn/Radix + Tailwind. Consume la API del paquete [`server`](../server).

## Rutas

- `/` — landing pública.
- `/auth/signin`, `/auth/signup` — autenticación.
- `/servers` — lista de Servers monitoreados.
- `/servers/$serverId` — detalle de un Server.
- `/settings` — placeholder, sin implementar todavía.

## Desarrollo

Este paquete forma parte del monorepo pnpm+Turborepo en la raíz del repo. Desde la raíz:

```sh
pnpm install
pnpm --filter web run dev
```

Por defecto apunta a la API en `http://localhost:3000` (ver `src/api/constants.ts`).
