import { httpClient } from "./";

// POST /task/:id/stop, POST /task/:id/resume response shape.
export interface TaskEntity {
  id_task: number;
  id_server: number;
  type: string;
  status: "running" | "stopped" | "deleted";
  cron: string | null;
  log: string | null;
  retries_failed: number;
  created_at: string;
  updated_at: string;
}

export const stopTask = async (idTask: string | number) => {
  const response = await httpClient.post<TaskEntity>(`/task/${idTask}/stop`);
  return response.data;
};

export const resumeTask = async (idTask: string | number) => {
  const response = await httpClient.post<TaskEntity>(`/task/${idTask}/resume`);
  return response.data;
};
