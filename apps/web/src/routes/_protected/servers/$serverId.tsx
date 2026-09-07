import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import { resumeTask, stopTask } from "@/api/task";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PingHistoryTable from "@/components/ping-history-table";
import { EditServerDialog } from "@/components/server-form-dialog";
import { serverDetailOptions } from "@/querys/servers";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";

export const Route = createFileRoute("/_protected/servers/$serverId")({
	loader: async ({ params, context }) => {
		return context.queryClient.ensureQueryData(
			serverDetailOptions(params.serverId),
		);
	},
	component: ServerDetails,
});

const statusVariant = (status: string) => {
	switch (status.toLowerCase()) {
		case "active":
			return "success" as const;
		case "inactive":
			return "destructive" as const;
		default:
			return "outline" as const;
	}
};

function ServerDetails() {
	const { serverId } = Route.useParams();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);

	const { data } = useSuspenseQuery(serverDetailOptions(serverId));

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: ["servers"] });
	};

	const stopMutation = useMutation({
		mutationFn: () => stopTask(data.idTask),
		onSuccess: () => {
			toast("Monitoreo pausado");
			invalidate();
		},
		onError: (error: unknown) => {
			const message = axios.isAxiosError(error)
				? (error.response?.data?.message ?? "No se pudo pausar el monitoreo")
				: "No se pudo pausar el monitoreo";
			toast.error(message);
		},
	});

	const resumeMutation = useMutation({
		mutationFn: () => resumeTask(data.idTask),
		onSuccess: () => {
			toast("Monitoreo reanudado");
			invalidate();
		},
		onError: (error: unknown) => {
			const message = axios.isAxiosError(error)
				? (error.response?.data?.message ?? "No se pudo reanudar el monitoreo")
				: "No se pudo reanudar el monitoreo";
			toast.error(message);
		},
	});

	const isMonitoringRunning = data.taskStatus === "running";
	const hasTask = data.taskStatus != null && data.taskStatus !== "deleted";
	const isPending = stopMutation.isPending || resumeMutation.isPending;

	return (
		<div className="mx-auto max-w-screen-xl p-6">
			<Link
				to="/servers"
				className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft size={14} />
				Back to servers
			</Link>

			<div className="mt-4 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h1 className="font-display text-2xl">{data.title}</h1>
					{data.status && (
						<Badge variant={statusVariant(data.status)}>{data.status}</Badge>
					)}
					{hasTask && (
						<Badge variant={isMonitoringRunning ? "success" : "outline"}>
							{isMonitoringRunning ? "Monitoreo activo" : "Monitoreo pausado"}
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="gap-2"
						onClick={() => setEditing(true)}
					>
						<Pencil className="h-4 w-4" />
						Editar
					</Button>
					<Button
						size="sm"
						className="gap-2"
						disabled={isPending || !hasTask}
						onClick={() =>
							isMonitoringRunning
								? stopMutation.mutate()
								: resumeMutation.mutate()
						}
					>
						{isMonitoringRunning ? "Pausar monitoreo" : "Reanudar monitoreo"}
						{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
					</Button>
				</div>
			</div>
			{(data.ip || data.url) && (
				<p className="mt-1 text-sm text-muted-foreground">
					{data.ip ?? data.url}
				</p>
			)}

			<div className="mt-8 grid grid-cols-3 gap-4">
				<div className="border-2 border-border p-4">
					<span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
						Avg latency
					</span>
					<div className="font-display text-xl">
						{data.ping_avg != null ? `${data.ping_avg}ms` : "—"}
					</div>
				</div>
				<div className="border-2 border-border p-4">
					<span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
						Min latency
					</span>
					<div className="font-display text-xl">
						{data.ping_min != null ? `${data.ping_min}ms` : "—"}
					</div>
				</div>
				<div className="border-2 border-border p-4">
					<span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
						Max latency
					</span>
					<div className="font-display text-xl">
						{data.ping_max != null ? `${data.ping_max}ms` : "—"}
					</div>
				</div>
			</div>

			<PingHistoryTable serverId={serverId} />

			{data.idServer != null && (
				<EditServerDialog
					server={data}
					open={editing}
					onOpenChange={setEditing}
				/>
			)}
		</div>
	);
}
