import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/about")({
	component: About,
});

function About() {
	return (
		<div className="mx-auto max-w-screen-xl p-6">
			<h1 className="font-display text-2xl">About</h1>
		</div>
	);
}
