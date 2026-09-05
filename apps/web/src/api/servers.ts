import { httpClient } from "./";

export interface Server {
  idServer: string;
  ip?: string;
  url?: string;
  title: string;
  status: string;
  idTask: string;
  ping_max: number;
  ping_min: number;
  ping_avg: number;
}

export type UpdateServer = {
  idServer: string;
  title: string;
};

export const getServers = async () => {
  const response = await httpClient.get<Server[]>("/servers");
  return response.data;
};

export const getServerDetail = async (id: string) => {
  const response = await httpClient.get<Server[]>(`/servers/${id}`);
  return response.data.length ? response.data[0] : ({} as Server);
};

export const deleteServer = async (id: string) => {
  const response = await httpClient.delete(`/servers/${id}`);
  return response.data;
};

export const updateServer = async (id: string, dto: UpdateServer) => {
  const response = await httpClient.put(`/servers/${id}`, dto);
  return response.data;
};
