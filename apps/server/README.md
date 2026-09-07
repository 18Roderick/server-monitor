# Ping Server

Backend de `server-monitor`: los usuarios registran los Servers (URLs o IPs) que quieren vigilar, y el sistema los pinguea periódicamente, guardando el resultado como Pings. Ver [CONTEXT.md](./CONTEXT.md) para el glosario de dominio y [docs/adr/](./docs/adr/) para las decisiones de arquitectura.

Construido con [Effect-ts](https://effect.website/) (`HttpApi`), Drizzle ORM + Postgres, y BullMQ + Redis para la programación de tareas.

## Documentación de la API

Con el servidor corriendo, la documentación OpenAPI (auto-generada desde los schemas) está disponible en `/docs`.

## Desarrollo

Este paquete forma parte del monorepo pnpm+Turborepo en la raíz del repo. Desde la raíz:

```sh
pnpm install
pnpm --filter server run dev
```

O con Docker (levanta Postgres + Valkey + el servidor):

```sh
docker compose up
```

Variables de entorno (`apps/server/.env`, ver `src/Config.ts`): `DATABASE_URL`, `PORT`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (opcional), `JWT_SECRET`.

## Estado actual

- **Auth**: signup/signin con JWT — hecho. Refresh token — pendiente.
- **Users**: CRUD completo (`findAll`, `findOne`, `update`, `remove`) — hecho.
- **Servers**: CRUD completo, aislado por usuario — hecho.
- **Pings**: lectura y borrado por Server/usuario — hecho. No hay campos editables en un Ping (es una medición inmutable, ver `CONTEXT.md`).
- **Tasks**: creación automática al registrar un Server, auto-pausa tras 3 fallos consecutivos, reconciliación al arrancar — hecho. Borrado explícito de un Task (fuera del que cascadea al borrar su Server) — pendiente.
- **Dashboard / alertas en tiempo real**: pendiente — es la próxima feature grande del roadmap.

## Licencia

UNLICENSED — proyecto privado.
