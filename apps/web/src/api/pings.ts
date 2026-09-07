import { httpClient } from "./";

// GET /pings/:id response shape, ordered most-recent-first, hard-capped at
// 1000 rows server-side regardless of the from/to range.
export interface PingEntity {
  id_ping: number;
  times: number;
  packet_loss: number;
  min: number;
  max: number;
  avg: number;
  log: string | null;
  is_alive: 0 | 1;
  numeric_host: string | null;
  created_at: string;
  id_server: number;
}

export type PingHistoryParams = {
  from?: string;
  to?: string;
};

export const getPingHistory = async (
  idServer: string,
  params?: PingHistoryParams,
) => {
  const response = await httpClient.get<PingEntity[]>(`/pings/${idServer}`, {
    params,
  });
  return response.data;
};
