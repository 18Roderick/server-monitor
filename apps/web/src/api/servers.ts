import { httpClient } from "./";

// GET /servers, GET /servers/:id response shape (camelCase aggregate view).
export interface ServerSummary {
  idServer: number;
  ip: string | null;
  url: string | null;
  title: string;
  status: "active" | "inactive";
  idTask: number;
  taskStatus: "running" | "stopped" | "deleted" | null;
  ping_max: number | null;
  ping_min: number | null;
  ping_avg: number | null;
}

// Response of POST /servers and PUT /servers/:id (snake_case entity, as
// persisted). Distinct shape from ServerSummary above.
export interface ServerEntity {
  id_server: number;
  url: string | null;
  ip: string | null;
  description: string | null;
  title: string;
  status: string;
  worker_type: string;
  created_at: string;
  updated_at: string;
  id_user: number;
}

// A Server has exactly one Monitor Mode, fixed at creation (see
// apps/server CONTEXT.md + ADR 0005) — modeled here as a discriminated
// union so the frontend can't construct a payload with both/neither address.
export type CreateServerInput =
  | { mode: "url"; url: string; title: string; description?: string }
  | { mode: "ip"; ip: string; title: string; description?: string };

// Same discriminant, but every field besides `mode` and the mode's address
// is optional. `mode` must match the server's existing Monitor Mode — the
// backend rejects a mode switch, so callers must always echo the current mode.
export type UpdateServerInput =
  | { mode: "url"; url?: string; title?: string; description?: string }
  | { mode: "ip"; ip?: string; title?: string; description?: string };

export const getServers = async () => {
  const response = await httpClient.get<ServerSummary[]>("/servers");
  return response.data;
};

export const getServerDetail = async (id: string) => {
  const response = await httpClient.get<ServerSummary[]>(`/servers/${id}`);
  return response.data.length ? response.data[0] : ({} as ServerSummary);
};

export const createServer = async (dto: CreateServerInput) => {
  const response = await httpClient.post<ServerEntity>("/servers", dto);
  return response.data;
};

export const deleteServer = async (id: string) => {
  const response = await httpClient.delete(`/servers/${id}`);
  return response.data;
};

export const updateServer = async (id: string, dto: UpdateServerInput) => {
  const response = await httpClient.put<ServerEntity>(`/servers/${id}`, dto);
  return response.data;
};
