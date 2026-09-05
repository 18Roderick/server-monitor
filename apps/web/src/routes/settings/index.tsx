import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/")({
	component: () => (
		<div className="mx-auto max-w-screen-xl p-6">
			<h1 className="font-display text-2xl">Settings</h1>
		</div>
	),
});
