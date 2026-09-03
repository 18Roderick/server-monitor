import { serverDetailOptions } from "@/querys/servers";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/servers/$serverId")({
	loader: async ({ params, context }) => {
		return context.queryClient.ensureQueryData(
			serverDetailOptions(params.serverId),
		);
	},
	component: ServerDetails,
});

function ServerDetails() {
	const { serverId } = Route.useParams();

	const { data } = useSuspenseQuery(serverDetailOptions(serverId));
	return (
		<div>
			Hello /servers/$server! {serverId}
			<h1>{data.title}</h1>
		</div>
	);
}
