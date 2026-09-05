import { Button } from "@/components/ui/button";
import { Link, createLazyFileRoute } from "@tanstack/react-router";
import { Activity, Bell, Gauge } from "lucide-react";

export const Route = createLazyFileRoute("/")({
	component: Index,
});

const features = [
	{
		icon: Activity,
		title: "Uptime tracking",
		description: "Every host is pinged on a schedule, no gaps in the record.",
	},
	{
		icon: Gauge,
		title: "Latency at a glance",
		description: "Min, max and average response time for each server.",
	},
	{
		icon: Bell,
		title: "Status the moment it changes",
		description: "Up, degraded or down — see it as soon as it happens.",
	},
];

function Index() {
	return (
		<section className="flex flex-1 flex-col">
			<div className="mx-auto w-full max-w-screen-xl p-6">
				<div className="border-b-2 border-border py-16">
					<h1 className="font-display text-4xl leading-tight md:text-5xl">
						Infrastructure, watched.
					</h1>
					<p className="mt-4 max-w-prose text-base text-muted-foreground">
						Track uptime and latency across every host from one place.
					</p>
					<Button asChild className="mt-8">
						<Link to="/servers">View servers</Link>
					</Button>
				</div>

				<div className="grid gap-8 py-12 sm:grid-cols-3">
					{features.map(({ icon: Icon, title, description }) => (
						<div key={title} className="flex flex-col gap-3">
							<span className="flex h-10 w-10 items-center justify-center bg-primary text-primary-foreground">
								<Icon size={18} />
							</span>
							<h2 className="font-display text-base">{title}</h2>
							<p className="text-sm text-muted-foreground">{description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
