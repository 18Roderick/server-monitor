import { Badge } from "@/components/ui/badge";
import { serverDetailOptions } from "@/querys/servers";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

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
		case "up":
			return "success" as const;
		case "degraded":
			return "warning" as const;
		case "down":
			return "destructive" as const;
		default:
			return "outline" as const;
	}
};

function ServerDetails() {
	const { serverId } = Route.useParams();

	const { data } = useSuspenseQuery(serverDetailOptions(serverId));

	return (
		<div className="mx-auto max-w-screen-xl p-6">
			<Link
				to="/servers"
				className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft size={14} />
				Back to servers
			</Link>

			<div className="mt-4 flex items-center gap-3">
				<h1 className="font-display text-2xl">{data.title}</h1>
				{data.status && (
					<Badge variant={statusVariant(data.status)}>{data.status}</Badge>
				)}
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
		</div>
	);
}
