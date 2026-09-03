import Navbar from "@/components/navbar";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/")({
	component: Index,
});

function Index() {
	return (
		<>
			<Navbar />
			<section className="container">{}</section>
		</>
	);
}
