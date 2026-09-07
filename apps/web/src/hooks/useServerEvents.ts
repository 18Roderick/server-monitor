import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseUrl } from "@/api/constants";
import type { ServerSummary } from "@/api/servers";
import { getToken } from "@/utils/storageToken";

type PingEvent = {
	type: "ping";
	idServer: number;
	idUser: number;
	isAlive: boolean;
	avg: number;
	createdAt: string;
};

type TaskStoppedEvent = {
	type: "task-stopped";
	idServer: number;
	idUser: number;
	idTask: number;
};

type TaskResumedEvent = {
	type: "task-resumed";
	idServer: number;
	idUser: number;
	idTask: number;
};

type ServerEvent = PingEvent | TaskStoppedEvent | TaskResumedEvent;

function isServerEvent(value: unknown): value is ServerEvent {
	return (
		!!value &&
		typeof value === "object" &&
		"type" in value &&
		"idServer" in value &&
		["ping", "task-stopped", "task-resumed"].includes(
			(value as { type: unknown }).type as string,
		)
	);
}

function getServerLabel(queryClient: QueryClient, idServer: number): string {
	const servers = queryClient.getQueryData<ServerSummary[]>(["servers"]);
	const match = servers?.find((server) => server.idServer === idServer);
	return match?.title ?? `#${idServer}`;
}

// Live-updates the servers list/detail/ping-history views via Server-Sent
// Events instead of polling — see apps/server's GET /servers/stream
// (src/Http/SseRoute.ts). Unlike a blind "something changed, refetch
// everything" approach, each event's `type` decides which query keys are
// narrowly invalidated, and task lifecycle events also surface a toast.
export function useServerEvents() {
	const queryClient = useQueryClient();

	useEffect(() => {
		const token = getToken();
		if (!token) return;

		const source = new EventSource(
			`${baseUrl}/servers/stream?token=${encodeURIComponent(token)}`,
		);

		source.onmessage = (event) => {
			// SSE comment lines (heartbeats, `: heartbeat`) never reach
			// onmessage — only actual `data:` messages do — but guard with
			// try/catch anyway in case of a malformed payload.
			if (!event.data) return;

			let payload: unknown;
			try {
				payload = JSON.parse(event.data);
			} catch {
				return;
			}

			if (!isServerEvent(payload)) return;

			const idServer = String(payload.idServer);

			switch (payload.type) {
				case "ping": {
					// ping_min/max/avg shown in the list view are aggregates,
					// so the list needs a refetch too — but only the list
					// query itself (exact), not every server's detail query.
					void queryClient.invalidateQueries({
						queryKey: ["servers"],
						exact: true,
					});
					void queryClient.invalidateQueries({
						queryKey: ["servers", idServer],
					});
					void queryClient.invalidateQueries({
						queryKey: ["pings", idServer],
					});
					break;
				}
				case "task-stopped": {
					void queryClient.invalidateQueries({
						queryKey: ["servers"],
						exact: true,
					});
					void queryClient.invalidateQueries({
						queryKey: ["servers", idServer],
					});
					toast(
						`El monitoreo de ${getServerLabel(queryClient, payload.idServer)} se pausó tras fallos repetidos`,
					);
					break;
				}
				case "task-resumed": {
					void queryClient.invalidateQueries({
						queryKey: ["servers"],
						exact: true,
					});
					void queryClient.invalidateQueries({
						queryKey: ["servers", idServer],
					});
					toast(
						`El monitoreo de ${getServerLabel(queryClient, payload.idServer)} se reanudó`,
					);
					break;
				}
			}
		};

		return () => source.close();
	}, [queryClient]);
}
