import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { deleteServer } from "@/api/servers";
import UnauthorizeBoundary from "@/components/UnauthorizeBoundary";
import ServerTable from "@/components/server-table";
import { serverQueryOptions } from "@/querys/servers";
import z from "zod";

import { Input } from "@/components/ui/input";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Search, ServerOff } from "lucide-react";

export const Route = createFileRoute("/_protected/servers/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(serverQueryOptions),
	validateSearch: z.object({
		search: z.string().optional().catch(""),
	}),
	component: ServerPage,
	errorComponent: UnauthorizeBoundary,
	onError(err) {
		console.log("Error de algo", err);
	},
});

function ServerPage() {
	const { search } = Route.useSearch();
	const navigate = useNavigate({ from: "/servers/" });
	const queryClient = useQueryClient();

	const { data } = useSuspenseQuery(serverQueryOptions);

	const deleteMutation = useMutation({
		mutationFn: deleteServer,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servers"] }),
	});

	const filtered = search
		? data.filter(
				(server) =>
					server.title.toLowerCase().includes(search.toLowerCase()) ||
					server.idServer.toLowerCase().includes(search.toLowerCase()),
			)
		: data;

	return (
		<section className="mx-auto w-full max-w-screen-xl p-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-display text-2xl">Servers</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{data.length} monitored host{data.length === 1 ? "" : "s"}
					</p>
				</div>
				<div className="relative w-full sm:w-64">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search servers..."
						className="pl-8"
						defaultValue={search}
						onChange={(e) => {
							const value = e.target.value;
							navigate({
								search: () => ({ search: value }),
								replace: true,
							});
						}}
					/>
				</div>
			</div>

			<div className="mt-6 border-2 border-border">
				{filtered.length > 0 ? (
					<ServerTable
						data={filtered}
						onDelete={(id) => deleteMutation.mutate(id)}
					/>
				) : (
					<div className="flex flex-col items-center gap-3 p-12 text-center">
						<ServerOff className="h-8 w-8 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							{data.length === 0
								? "No servers are being monitored yet."
								: "No servers match your search."}
						</p>
					</div>
				)}
			</div>
		</section>
	);
}
